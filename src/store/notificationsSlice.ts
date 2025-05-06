import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { notificationsAPI } from "../api/apiClient";
import { Notification, NotificationSettings, NotificationPreferences } from "../types/api";

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  settings: NotificationSettings | null;
  preferences: NotificationPreferences | null;
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  settings: null,
  preferences: null,
  meta: {
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  },
  isLoading: false,
  error: null,
};

// Асинхронні thunks для запитів до API
export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async (params: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await notificationsAPI.getHistory(params);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Помилка завантаження сповіщень"
      );
    }
  }
);

export const fetchNotificationSettings = createAsyncThunk(
  "notifications/fetchSettings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationsAPI.getSettings();
      return response.data.data.settings;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Помилка завантаження налаштувань сповіщень"
      );
    }
  }
);

export const updateNotificationPreferences = createAsyncThunk(
  "notifications/updatePreferences",
  async (preferences: NotificationPreferences, { rejectWithValue }) => {
    try {
      const response = await notificationsAPI.updatePreferences(preferences);
      return response.data.data.preferences;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Помилка оновлення налаштувань категорій сповіщень"
      );
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  "notifications/markAllAsRead",
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationsAPI.markAllAsRead();
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Помилка позначення всіх сповіщень як прочитаних"
      );
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await notificationsAPI.markAsRead(id);
      return { id, ...response.data.data };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Помилка позначення сповіщення як прочитаного"
      );
    }
  }
);

export const deleteNotification = createAsyncThunk(
  "notifications/deleteNotification",
  async (id: number, { rejectWithValue }) => {
    try {
      await notificationsAPI.deleteNotification(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Помилка видалення сповіщення"
      );
    }
  }
);

// Створення Redux slice
const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    incrementUnreadCount: (state) => {
      state.unreadCount += 1;
    },
    decrementUnreadCount: (state) => {
      if (state.unreadCount > 0) {
        state.unreadCount -= 1;
      }
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
    resetNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.meta.page = 1;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
  },
  extraReducers: (builder) => {
    // Обробка fetchNotifications
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload.notifications;
        state.meta = action.payload.meta;
        
        // Підрахунок кількості непрочитаних повідомлень
        state.unreadCount = state.notifications.filter(notification => !notification.isRead).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

    // Обробка fetchNotificationSettings
      .addCase(fetchNotificationSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotificationSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload;
      })
      .addCase(fetchNotificationSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })



    // Обробка updateNotificationPreferences
      .addCase(updateNotificationPreferences.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateNotificationPreferences.fulfilled, (state, action) => {
        state.isLoading = false;
        state.preferences = action.payload;
      })
      .addCase(updateNotificationPreferences.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

    // Обробка markAllNotificationsAsRead
      .addCase(markAllNotificationsAsRead.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.isLoading = false;
        // Позначаємо всі повідомлення як прочитані
        state.notifications = state.notifications.map(notification => ({
          ...notification,
          isRead: true
        }));
        state.unreadCount = 0;
      })
      .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

    // Обробка markNotificationAsRead
      .addCase(markNotificationAsRead.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        state.isLoading = false;
        // Знаходимо і позначаємо конкретне повідомлення як прочитане
        const index = state.notifications.findIndex(
          (notification) => notification.id === action.payload.id
        );
        if (index !== -1) {
          const notification = state.notifications[index];
          if (notification && !notification.isRead) {
            notification.isRead = true;
            if (state.unreadCount > 0) {
              state.unreadCount -= 1;
            }
          }
        }
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

    // Обробка deleteNotification
      .addCase(deleteNotification.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.isLoading = false;
        // Видаляємо сповіщення з нашого стану
        const index = state.notifications.findIndex(
          (notification) => notification.id === action.payload
        );
        if (index !== -1) {
          const notification = state.notifications[index];
          if (notification && !notification.isRead) {
            if (state.unreadCount > 0) {
              state.unreadCount -= 1;
            }
          }
          state.notifications.splice(index, 1);
        }
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  incrementUnreadCount, 
  decrementUnreadCount, 
  setUnreadCount, 
  resetNotifications, 
  addNotification 
} = notificationsSlice.actions;

export default notificationsSlice.reducer;