import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetChatQuery, useSendMessageMutation, useGetChatsQuery } from '../api/chatApi';
import { Message, Chat, User } from '../types/chatTypes';
import ErrorAlert from '../components/common/ErrorAlert';
import { ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

const ChatConversationPage = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const [newMessage, setNewMessage] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  const currentUser: User = {
    id: 'currentUserId',
    name: 'Поточний користувач'
  };

  const { 
    data: chatData, 
    isLoading: isChatLoading, 
    isError: isChatError 
  } = useGetChatQuery(chatId || '', { skip: !chatId });

  // Трансформація даних чату у відповідний формат
  const chat: Chat | undefined = chatData ? {
    id: chatData.id,
    participants: chatData.name ? [{ id: 'otherUser', name: chatData.name }] : [],
    lastMessage: chatData.lastMessage ? { 
      content: chatData.lastMessage,
      createdAt: new Date().toISOString()
    } : { content: '', createdAt: new Date().toISOString() },
    messages: (chatData as { messages?: Array<{ id: string; content: string; sender: { id: string; name: string }; createdAt: string }> }).messages?.map((message) => ({
      id: message.id,
      content: message.content,
      sender: message.sender,
      createdAt: message.createdAt,
    })) || [],
  } : undefined;

  const { 
    data: chatsData = [], 
    isLoading: isChatsLoading 
  } = useGetChatsQuery();
  
  // Трансформація списку чатів
  const chats: Chat[] = chatsData.map(chatItem => ({
    id: chatItem.id,
    participants: chatItem.name ? [{ id: 'otherUser', name: chatItem.name }] : [],
    lastMessage: chatItem.lastMessage ? {
      content: chatItem.lastMessage,
      createdAt: new Date().toISOString()
    } : { content: '', createdAt: new Date().toISOString() }, // Provide default value instead of undefined
    messages: [],
  }));

  // Мутація для відправки повідомлення
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const handleSend = async () => {
    if (newMessage.trim() && chatId) {
      try {
        await sendMessage({ chatId, content: newMessage }).unwrap();
        setNewMessage('');
      } catch (error) {
        console.error('Помилка відправки:', error);
        // Додати відображення помилки користувачу
        alert('Не вдалося відправити повідомлення. Спробуйте ще раз.');
      }
    }
  };

  // Автопрокрутка до останнього повідомлення при додаванні нових
  useEffect(() => {
    if (messagesContainerRef.current && chat?.messages?.length) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [chat?.messages]);

  // Рендер списку доступних чатів
  const renderChatsList = () => {
    if (isChatsLoading) {
      return (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      );
    }

    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Оберіть чат</h2>
        {chats.length === 0 ? (
          <p className="text-gray-500">Немає доступних чатів</p>
        ) : (
          <ul className="space-y-2">
            {chats.map((chat) => (
              <li
                key={chat.id}
                onClick={() => navigate(`/chat/${chat.id}`)}
                className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600">
                        {chat.participants?.[0]?.name?.charAt(0) || '?'}
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">
                      {chat.participants?.map(p => p.name).join(', ') || 'Невідомий чат'}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {chat.lastMessage?.content || 'Немає повідомлень'}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  // Якщо немає chatId, показуємо список чатів
  if (!chatId) {
    return renderChatsList();
  }

  // Обробка помилки завантаження чату
  if (isChatError) {
    return (
      <div className="p-4">
        <ErrorAlert message="Не вдалося завантажити чат" />
        <button 
          onClick={() => navigate('/chat')}
          className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          Повернутися до списку чатів
        </button>
      </div>
    );
  }

  // Відображення завантаження чату
  if (isChatLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Шапка чату */}
      <div className="p-4 border-b flex items-center space-x-2 bg-white">
        <button 
          onClick={() => navigate('/chat')}
          className="p-2 hover:bg-gray-100 rounded-full"
          aria-label="Назад до списку чатів"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </button>
        <h2 className="text-lg font-semibold">
          {chat?.participants?.map((p: { name: string }) => p.name).join(', ') || 'Чат'}
        </h2>
      </div>

      {/* Список повідомлень */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {!chat?.messages?.length ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Немає повідомлень. Почніть спілкування!</p>
          </div>
        ) : (
          chat.messages.map((message: Message) => {
            // Перевірка та встановлення властивостей повідомлення
            const isSentByCurrentUser = message.sender?.id === currentUser.id;
            const messageTime = message.createdAt 
              ? new Date(message.createdAt).toLocaleTimeString('uk-UA', {
                  hour: '2-digit',
                  minute: '2-digit'
                }) 
              : '';
            
            return (
              <div
                key={message.id || `msg-${Math.random()}`}
                className={`flex ${isSentByCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    isSentByCurrentUser 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-white border'
                  }`}
                >
                  <p>{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    isSentByCurrentUser 
                      ? 'text-primary-100' 
                      : 'text-gray-500'
                  }`}>
                    {messageTime}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Поле вводу */}
      <div className="p-4 border-t bg-white">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Написати повідомлення..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            className="flex-1 rounded-full border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isSending}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="p-2 rounded-full bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Відправити повідомлення"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatConversationPage;