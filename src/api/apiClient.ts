import axios from 'axios';

// Створення екземпляру axios з базовими налаштуваннями
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Додавання перехоплювача запитів для автоматичного додавання токену
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Додавання перехоплювача відповідей для обробки помилок
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Перевірка статусу 401 (Unauthorized)
    if (error.response && error.response.status === 401) {
      // Видаляємо токен і перенаправляємо на сторінку входу
      localStorage.removeItem('token');
      
      // Перевіряємо, що ми не на сторінці входу, щоб уникнути циклічних перенаправлень
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API для авторизації
export const authAPI = {
  login: (email: string, password: string) => {
    return api.post('/auth/login', { email, password });
  },
  
  register: (formData: any) => {
    return api.post('/auth/register', formData);
  },
  
  getProfile: () => {
    return api.get('/auth/me');
  },
  
  updateProfile: (formData: any) => {
    return api.put('/auth/me', formData);
  },
  
  changePassword: (currentPassword: string, newPassword: string) => {
    return api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },
  
  forgotPassword: (email: string) => {
    return api.post('/auth/forgot-password', { email });
  },
  
  resetPassword: (token: string, password: string) => {
    return api.post(`/auth/reset-password/${token}`, { password });
  },
};

// API для оголошень
export const listingsAPI = {
  getAll: (params?: any) => {
    return api.get('/listings', { params });
  },
  
  getById: (id: number) => {
    return api.get(`/listings/${id}`);
  },
  
  getUserListings: () => {
    return api.get('/listings/user/me');
  },
  
  create: (formData: any) => {
    return api.post('/listings', formData);
  },
  
  update: (id: number, formData: any) => {
    return api.put(`/listings/${id}`, formData);
  },
  
  delete: (id: number) => {
    return api.delete(`/listings/${id}`);
  },
};

// API для категорій
export const categoriesAPI = {
  getAll: (params?: any) => {
    return api.get('/categories', { params });
  },
  
  getById: (id: number) => {
    return api.get(`/categories/${id}`);
  },
  
  getBySlug: (slug: string) => {
    return api.get(`/categories/slug/${slug}`);
  },
  
  getTree: () => {
    return api.get('/categories/tree');
  },
};

// API для чату
export const chatAPI = {
  getConversations: () => {
    return api.get('/chat/conversations');
  },
  
  getMessages: (userId: number, params?: any) => {
    return api.get(`/chat/conversations/${userId}`, { params });
  },
  
  sendMessage: (receiverId: number, content: string, listingId?: number) => {
    return api.post('/chat/messages', {
      receiverId,
      content,
      listingId,
    });
  },
  
  markAsRead: (userId: number) => {
    return api.post(`/chat/conversations/${userId}/read`);
  },
  
  getUnreadCount: () => {
    return api.get('/chat/unread');
  },
};

// API для транзакцій/оплат
export const paymentsAPI = {
  create: (formData: any) => {
    return api.post('/transactions', formData);
  },
  
  getAll: () => {
    return api.get('/transactions');
  },
  
  getById: (transactionId: string) => {
    return api.get(`/transactions/${transactionId}`);
  },
};

export default api;