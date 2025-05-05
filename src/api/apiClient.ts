import axios from "axios";

// Створення екземпляру axios з базовими налаштуваннями
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Додавання перехоплювача запитів для автоматичного додавання токену
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
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
      localStorage.removeItem("token");

      // Перевіряємо, що ми не на сторінці входу, щоб уникнути циклічних перенаправлень
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// API для авторизації
export const authAPI = {
  login: (email: string, password: string) => {
    return api.post("/auth/login", { email, password });
  },

  register: (formData: { name: string; email: string; password: string }) => {
    return api.post("/auth/register", formData);
  },

  verifyEmail: (token: string) => {
    return api.get(`/auth/verify/${token}`);
  },

  forgotPassword: (email: string) => {
    return api.post("/auth/forgot-password", { email });
  },

  resetPassword: (token: string, password: string) => {
    return api.post(`/auth/reset-password/${token}`, { password });
  },

  getProfile: () => {
    return api.get("/auth/me");
  },

  updateProfile: (formData: { name?: string; email?: string; password?: string }) => {
    return api.put("/auth/me", formData);
  },

  changePassword: (currentPassword: string, newPassword: string) => {
    return api.post("/auth/change-password", {
      currentPassword,
      newPassword,
    });
  },
};

// API для оголошень
export const listingsAPI = {
  getAll: (params?: Record<string, unknown>) => {
    return api.get("/listings", { params });
  },

  getById: (id: number) => {
    return api.get(`/listings/${id}`);
  },

  getUserListings: () => {
    return api.get("/listings/user/me");
  },

  create: (formData: { name: string; description: string; price: number; categoryId: number }) => {
    return api.post("/listings", formData);
  },

  update: (id: number, formData: { name?: string; description?: string; price?: number; categoryId?: number }) => {
    return api.put(`/listings/${id}`, formData);
  },

  delete: (id: number) => {
    return api.delete(`/listings/${id}`);
  },
};

// API для категорій
export const categoriesAPI = {
  getAll: (params?: Record<string, unknown>) => {
    return api.get("/categories", { params });
  },

  getById: (id: number) => {
    return api.get(`/categories/${id}`);
  },

  getBySlug: (slug: string) => {
    return api.get(`/categories/slug/${slug}`);
  },

  getTree: () => {
    return api.get("/categories/tree");
  },

  // Адміністративні функції
  create: (data: any) => {
    return api.post("/categories", data);
  },

  update: (id: number, data: any) => {
    return api.put(`/categories/${id}`, data);
  },

  delete: (id: number) => {
    return api.delete(`/categories/${id}`);
  },
};

// API для чату
export const chatAPI = {
  getConversations: () => {
    return api.get("/chat/conversations");
  },

  getMessages: (userId: number, params?: any) => {
    return api.get(`/chat/conversations/${userId}`, { params });
  },

  sendMessage: (receiverId: number, content: string, listingId?: number) => {
    return api.post("/chat/messages", {
      receiverId,
      content,
      listingId,
    });
  },

  markAsRead: (userId: number) => {
    return api.post(`/chat/conversations/${userId}/read`);
  },

  getUnreadCount: () => {
    return api.get("/chat/unread");
  },
};

// API для транзакцій/оплат
export const transactionsAPI = {
  create: (formData: any) => {
    return api.post("/transactions", formData);
  },

  getAll: (params?: any) => {
    return api.get("/transactions", { params });
  },

  getById: (transactionId: string) => {
    return api.get(`/transactions/${transactionId}`);
  },
};

// API для сповіщень
export const notificationsAPI = {
  // Налаштування сповіщень
  getSettings: () => {
    return api.get("/notifications/settings");
  },

  updateSettings: (settings: any) => {
    return api.put("/notifications/settings", settings);
  },

  getPreferences: () => {
    return api.get("/notifications/preferences");
  },

  updatePreferences: (preferences: any) => {
    return api.put("/notifications/preferences", preferences);
  },

  // Історія сповіщень
  getHistory: (params?: any) => {
    return api.get("/notifications/history", { params });
  },

  getNotificationDetails: (id: number) => {
    return api.get(`/notifications/history/${id}`);
  },

  deleteNotification: (id: number) => {
    return api.delete(`/notifications/history/${id}`);
  },

  markAllAsRead: () => {
    return api.post("/notifications/history/read");
  },

  markAsRead: (id: number) => {
    return api.post(`/notifications/history/${id}/read`);
  },

  // Тестові сповіщення (для налагодження)
  sendTestEmail: () => {
    return api.post("/notifications/test-email");
  },

  sendTestSms: () => {
    return api.post("/notifications/test-sms");
  },

  sendTestPush: () => {
    return api.post("/notifications/test-push");
  },
};

// API для адмін-панелі
export const adminAPI = {
  getDashboardStats: () => {
    return api.get("/admin/dashboard");
  },

  getUsers: (params?: any) => {
    return api.get("/admin/users", { params });
  },

  updateUserRole: (userId: number, role: string) => {
    return api.put(`/admin/users/${userId}/role`, { role });
  },

  getListings: (params?: any) => {
    return api.get("/admin/listings", { params });
  },

  getPayments: (params?: any) => {
    return api.get("/admin/payments", { params });
  },

  getCategories: () => {
    return api.get("/admin/categories");
  },

  // API для шаблонів сповіщень (адмін)
  getNotificationTemplates: () => {
    return api.get("/notifications/templates");
  },

  getNotificationTemplate: (id: number) => {
    return api.get(`/notifications/templates/${id}`);
  },

  createNotificationTemplate: (template: any) => {
    return api.post("/notifications/templates", template);
  },

  updateNotificationTemplate: (id: number, template: any) => {
    return api.put(`/notifications/templates/${id}`, template);
  },

  deleteNotificationTemplate: (id: number) => {
    return api.delete(`/notifications/templates/${id}`);
  },

  // API для масових розсилок
  sendBulkEmails: (data: any) => {
    return api.post("/bulk-notifications/email", data);
  },

  sendBulkSms: (data: any) => {
    return api.post("/bulk-notifications/sms", data);
  },

  sendBulkPush: (data: any) => {
    return api.post("/bulk-notifications/push", data);
  },

  getBulkTasks: () => {
    return api.get("/bulk-notifications/tasks");
  },

  getBulkTaskById: (id: number) => {
    return api.get(`/bulk-notifications/tasks/${id}`);
  },

  cancelBulkTask: (id: number) => {
    return api.delete(`/bulk-notifications/tasks/${id}`);
  },

  getActiveJobs: () => {
    return api.get("/bulk-notifications/active-jobs");
  },

  previewFilteredUsers: (filter: any) => {
    return api.post("/bulk-notifications/filter-users", filter);
  },
};

// API для кампаній
export const campaignsAPI = {
  getAll: (params?: any) => {
    return api.get("/campaigns", { params });
  },

  create: (campaign: any) => {
    return api.post("/campaigns", campaign);
  },

  getTypes: () => {
    return api.get("/campaigns/types");
  },

  getStatuses: () => {
    return api.get("/campaigns/statuses");
  },

  getById: (id: number) => {
    return api.get(`/campaigns/${id}`);
  },

  update: (id: number, campaign: any) => {
    return api.put(`/campaigns/${id}`, campaign);
  },

  delete: (id: number) => {
    return api.delete(`/campaigns/${id}`);
  },

  getAnalytics: (id: number) => {
    return api.get(`/campaigns/${id}/analytics`);
  },

  createTest: (data: any) => {
    return api.post("/campaigns/test", data);
  },

  duplicate: (id: number) => {
    return api.post(`/campaigns/${id}/duplicate`);
  },

  activate: (id: number) => {
    return api.post(`/campaigns/${id}/activate`);
  },

  pause: (id: number) => {
    return api.post(`/campaigns/${id}/pause`);
  },

  cancel: (id: number) => {
    return api.post(`/campaigns/${id}/cancel`);
  },

  startMessages: (id: number, data: any) => {
    return api.post(`/campaigns/${id}/messages`, data);
  },
};

// API для запланованих завдань
export const scheduledTasksAPI = {
  schedulListingDeactivation: (listingId: number) => {
    return api.get(`/scheduled-tasks/listing/${listingId}/schedule-deactivation`);
  },

  schedulePaymentReminder: (paymentId: string) => {
    return api.get(`/scheduled-tasks/payment/${paymentId}/reminder`);
  },

  // Адміністративні функції
  createTask: (task: any) => {
    return api.post("/scheduled-tasks/task", task);
  },

  createBatchTasks: (tasks: any[]) => {
    return api.post("/scheduled-tasks/batch", { tasks });
  },

  createRecurringTask: (task: any) => {
    return api.post("/scheduled-tasks/recurring", task);
  },

  getAll: (params?: any) => {
    return api.get("/scheduled-tasks", { params });
  },

  getById: (id: number) => {
    return api.get(`/scheduled-tasks/${id}`);
  },

  cancelTask: (id: number) => {
    return api.delete(`/scheduled-tasks/${id}`);
  },

  getTaskTypes: () => {
    return api.get("/scheduled-tasks/types");
  },

  getRecurringTasks: () => {
    return api.get("/scheduled-tasks/recurring");
  },

  cancelRecurringTask: (id: number) => {
    return api.delete(`/scheduled-tasks/recurring/${id}`);
  },
};

// API для управління чергами (адмін)
export const queuesAPI = {
  getStats: () => {
    return api.get("/queues");
  },

  getList: () => {
    return api.get("/queues/list");
  },

  purgeQueue: (queueName: string) => {
    return api.delete(`/queues/${queueName}/purge`);
  },

  deleteQueue: (queueName: string) => {
    return api.delete(`/queues/${queueName}`);
  },

  sendTestMessage: (queueName: string, data: any) => {
    return api.post(`/queues/${queueName}/test`, data);
  },

  getMessages: (queueName: string, params?: any) => {
    return api.get(`/queues/${queueName}/messages`, { params });
  },

  getConsumers: () => {
    return api.get("/queues/consumers");
  },
};

// API для перевірки працездатності
export const healthAPI = {
  check: () => {
    return api.get("/health");
  },
};

export default api;