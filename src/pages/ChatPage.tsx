import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatAPI } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { Send, ArrowLeft, MoreVertical, User } from 'lucide-react';
import Loader from '../components/common/Loader';

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

const ChatPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeChatUser, setActiveChatUser] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Завантаження списку бесід
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        const response = await chatAPI.getConversations();
        setConversations(response.data.data.conversations);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConversations();
  }, []);
  
  // Завантаження повідомлень при виборі співрозмовника
  useEffect(() => {
    if (userId) {
      const fetchMessages = async () => {
        try {
          setIsLoading(true);
          const response = await chatAPI.getMessages(parseInt(userId));
          setMessages(response.data.data.messages);
          
          // Знайти інформацію про співрозмовника
          const activeUser = conversations.find(
            (conv) => conv.userId === parseInt(userId)
          );
          
          if (activeUser) {
            setActiveChatUser(activeUser);
            
            // Позначити повідомлення як прочитані
            await chatAPI.markAsRead(parseInt(userId));
            
            // Оновити кількість непрочитаних повідомлень у бесідах
            setConversations((prev) =>
              prev.map((conv) =>
                conv.userId === parseInt(userId)
                  ? { ...conv, unreadCount: 0 }
                  : conv
              )
            );
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchMessages();
    }
  }, [userId, conversations]);
  
  // Прокрутка до останнього повідомлення
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Обробник відправки повідомлення
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !userId) {
      return;
    }
    
    setIsSending(true);
    
    try {
      const response = await chatAPI.sendMessage(parseInt(userId), newMessage);
      
      // Додати нове повідомлення до списку
      setMessages([...messages, response.data.data.message]);
      
      // Оновити останнє повідомлення в списку бесід
      setConversations((prev) =>
        prev.map((conv) =>
          conv.userId === parseInt(userId)
            ? {
                ...conv,
                lastMessage: newMessage,
                lastMessageDate: new Date().toISOString(),
              }
            : conv
        )
      );
      
      // Очистити поле вводу
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };
  
  // Обробник вибору бесіди
  const handleSelectConversation = (userId: number) => {
    navigate(`/chat/${userId}`);
  };
  
  // Обробник повернення до списку бесід (на мобільних)
  const handleBackToList = () => {
    navigate('/chat');
    setActiveChatUser(null);
  };
  
  // Форматування дати
  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      // Сьогодні (формат: ГГ:ХХ)
      return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      // Вчора
      return 'Вчора';
    } else if (diffInDays < 7) {
      // День тижня
      return date.toLocaleDateString('uk-UA', { weekday: 'long' });
    } else {
      // Повна дата
      return date.toLocaleDateString('uk-UA');
    }
  };
  
  // Відображення списку бесід
  const renderConversationsList = () => {
    if (conversations.length === 0 && !isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-gray-500 mb-4">У вас ще немає повідомлень</p>
          <p className="text-gray-600 text-sm">
            Перейдіть до оголошення та напишіть повідомлення продавцю
          </p>
        </div>
      );
    }
    
    return (
      <div className="divide-y divide-gray-200">
        {conversations.map((conversation) => (
          <div
            key={conversation.userId}
            className={`p-4 hover:bg-gray-50 cursor-pointer ${
              activeChatUser?.userId === conversation.userId ? 'bg-green-50' : ''
            }`}
            onClick={() => handleSelectConversation(conversation.userId)}
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                {conversation.avatar ? (
                  <img
                    src={conversation.avatar}
                    alt={conversation.userName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <User size={24} className="text-gray-500" />
                  </div>
                )}
                
                {conversation.isOnline && (
                  <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                  <h3 className="text-base font-medium text-gray-900 truncate">
                    {conversation.userName}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {formatMessageDate(conversation.lastMessageDate)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600 truncate">
                    {conversation.userId === user?.id ? 'Ви: ' : ''}
                    {conversation.lastMessage}
                  </p>
                  
                  {conversation.unreadCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-green-600 rounded-full">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Відображення повідомлень у бесіді
  const renderMessages = () => {
    if (!activeChatUser) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6">
          <p className="text-gray-500 mb-2">Виберіть бесіду зі списку</p>
          <p className="text-gray-600 text-sm">
            або перейдіть до оголошення, щоб почати нову бесіду
          </p>
        </div>
      );
    }
    
    return (
      <>
        {/* Заголовок бесіди */}
        <div className="border-b border-gray-200 px-4 py-3 flex items-center">
          <button
            onClick={handleBackToList}
            className="md:hidden text-gray-500 mr-3"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex items-center flex-1">
            {activeChatUser.avatar ? (
              <img
                src={activeChatUser.avatar}
                alt={activeChatUser.userName}
                className="w-10 h-10 rounded-full object-cover mr-3"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                <User size={20} className="text-gray-500" />
              </div>
            )}
            
            <div>
              <h3 className="text-base font-medium text-gray-900">
                {activeChatUser.userName}
              </h3>
              <p className="text-xs text-gray-500">
                {activeChatUser.isOnline ? 'Онлайн' : 'Офлайн'}
              </p>
            </div>
          </div>
          
          <button className="text-gray-500">
            <MoreVertical size={20} />
          </button>
        </div>
        
        {/* Повідомлення */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => {
            const isMyMessage = message.senderId === user?.id;
            
            return (
              <div
                key={message.id}
                className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isMyMessage
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.listing && (
                    <div className="mb-2 p-2 bg-white bg-opacity-10 rounded">
                      <div className="flex items-center">
                        {message.listing.images && message.listing.images[0] && (
                          <img
                            src={message.listing.images[0]}
                            alt={message.listing.title}
                            className="w-10 h-10 object-cover rounded mr-2"
                          />
                        )}
                        <div className="text-sm">
                          {message.listing.title}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <p>{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isMyMessage ? 'text-green-100' : 'text-gray-500'
                    }`}
                  >
                    {formatMessageDate(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Форма для відправки повідомлення */}
        <div className="border-t border-gray-200 px-4 py-3">
          <form onSubmit={handleSendMessage} className="flex">
            <input
              type="text"
              placeholder="Введіть повідомлення..."
              className="flex-1 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 px-4 py-2"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isSending}
            />
            <button
              type="submit"
              className={`bg-green-600 text-white px-4 py-2 rounded-r-lg hover:bg-green-700 ${
                isSending ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              disabled={isSending || !newMessage.trim()}
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Повідомлення</h1>
      
      {isLoading && !userId ? (
        <Loader />
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="grid md:grid-cols-3 h-[70vh]">
            {/* Список бесід (приховується на мобільних, коли вибрана бесіда) */}
            <div className={`md:col-span-1 border-r border-gray-200 overflow-y-auto ${userId ? 'hidden md:block' : ''}`}>
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-medium text-gray-700">Всі бесіди</h2>
              </div>
              {renderConversationsList()}
            </div>
            
            {/* Область повідомлень (приховується на мобільних, коли не вибрана бесіда) */}
            <div className={`md:col-span-2 flex flex-col ${!userId ? 'hidden md:flex' : ''}`}>
              {isLoading && userId ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader />
                </div>
              ) : (
                renderMessages()
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;