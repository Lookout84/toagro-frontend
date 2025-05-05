import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { chatAPI } from '../api/apiClient';

interface Conversation {
  userId: number;
  userName: string;
  avatar?: string;
  lastMessage: string;
  unreadCount: number;
  lastMessageDate: string;
  isOnline?: boolean;
}

interface Message {
  id: number;
  content: string;
  senderId: number;
  receiverId: number;
  createdAt: string;
  listingId?: number;
  listing?: {
    id: number;
    title: string;
    images: string[];
  };
}

interface ChatState {
  conversations: Conversation[];
  messages: Record<number, Message[]>; // userId -> messages
  activeConversationId: number | null;
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

// Початковий стан
const initialState: ChatState = {
  conversations: [],
  messages: {},
  activeConversationId: null,
  unreadCount: 0,
  isLoading: false,
  error: null,
};

// Асинхронні thunks для запитів до API
export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await chatAPI.getConversations();
      return response.data.data.conversations;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Помилка завантаження бесід');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (userId: number, { rejectWithValue }) => {
    try {
      const response = await chatAPI.getMessages(userId);
      return { userId, messages: response.data.data.messages };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Помилка завантаження повідомлень');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ 
    receiverId, 
    content, 
    listingId 
  }: { 
    receiverId: number; 
    content: string; 
    listingId?: number 
  }, { rejectWithValue }) => {
    try {
      const response = await chatAPI.sendMessage(receiverId, content, listingId);
      return response.data.data.message;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Помилка відправки повідомлення');
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'chat/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await chatAPI.getUnreadCount();
      return response.data.data.count;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Помилка отримання кількості непрочитаних повідомлень');
    }
  }
);

export const markConversationAsRead = createAsyncThunk(
  'chat/markConversationAsRead',
  async (userId: number, { rejectWithValue }) => {
    try {
      await chatAPI.markAsRead(userId);
      return userId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Помилка позначення повідомлень як прочитаних');
    }
  }
);

// Створення Redux slice
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveConversation: (state, action: PayloadAction<number | null>) => {
      state.activeConversationId = action.payload;
    },
    addLocalMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      
      // Якщо немає повідомлень для цього користувача, створюємо масив
      if (!state.messages[message.receiverId]) {
        state.messages[message.receiverId] = [];
      }
      
      // Додаємо повідомлення
      state.messages[message.receiverId].push(message);
      
      // Оновлюємо останнє повідомлення в бесіді
      const conversationIndex = state.conversations.findIndex(
        (conv) => conv.userId === message.receiverId
      );
      
      if (conversationIndex !== -1) {
        state.conversations[conversationIndex].lastMessage = message.content;
        state.conversations[conversationIndex].lastMessageDate = message.createdAt;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Обробка fetchConversations
      .addCase(fetchConversations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Обробка fetchMessages
      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages[action.payload.userId] = action.payload.messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Обробка sendMessage
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        
        const message = action.payload;
        
        // Якщо немає повідомлень для цього користувача, створюємо масив
        if (!state.messages[message.receiverId]) {
          state.messages[message.receiverId] = [];
        }
        
        // Додаємо повідомлення
        state.messages[message.receiverId].push(message);
        
        // Оновлюємо останнє повідомлення в бесіді
        const conversationIndex = state.conversations.findIndex(
          (conv) => conv.userId === message.receiverId
        );
        
        if (conversationIndex !== -1) {
          state.conversations[conversationIndex].lastMessage = message.content;
          state.conversations[conversationIndex].lastMessageDate = message.createdAt;
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Обробка fetchUnreadCount
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      
      // Обробка markConversationAsRead
      .addCase(markConversationAsRead.fulfilled, (state, action) => {
        const userId = action.payload;
        
        // Оновлюємо кількість непрочитаних повідомлень в бесіді
        const conversationIndex = state.conversations.findIndex(
          (conv) => conv.userId === userId
        );
        
        if (conversationIndex !== -1) {
          const unreadCount = state.conversations[conversationIndex].unreadCount;
          state.conversations[conversationIndex].unreadCount = 0;
          state.unreadCount -= unreadCount;
        }
      });
  },
});

export const { setActiveConversation, addLocalMessage } = chatSlice.actions;
export default chatSlice.reducer;