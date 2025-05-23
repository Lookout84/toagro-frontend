import axios from "axios";
import { getToken, removeToken, setToken } from "../utils/auth";

// Розширюємо тип AxiosRequestConfig для підтримки skipAuthRefresh
declare module "axios" {
  interface AxiosRequestConfig {
    skipAuthRefresh?: boolean;
  }
}

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
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Додавання перехоплювача відповідей для обробки помилок
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error("API Error:", error);

    if (error.config?.skipAuthRefresh) {
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      !error.config.url.includes("/auth/refresh")
    ) {
      console.error("Auth error 401");

      const currentPath = window.location.pathname;

      if (currentPath.includes("/edit") || currentPath.includes("/create")) {
        console.log("На сторінці редагування - залишаємось на сторінці");

        try {
          const response = await authAPI.refreshToken();
          if (response.data?.accessToken) {
            setToken(response.data.accessToken);

            error.config.headers.Authorization = `Bearer ${response.data.accessToken}`;
            return api(error.config);
          }
        } catch (refreshError) {
          console.error("Failed to refresh token:", refreshError);
        }
      } else {
        removeToken();
        window.location.href = "/login?expired=true";
      }
    }

    return Promise.reject(error);
  }
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

  updateProfile: (formData: {
    name?: string;
    email?: string;
    password?: string;
  }) => {
    return api.put("/auth/me", formData);
  },

  changePassword: (currentPassword: string, newPassword: string) => {
    return api.post("/auth/change-password", {
      currentPassword,
      newPassword,
    });
  },
  refreshToken: () => {
    return api.post(
      "/auth/refresh",
      {},
      {
        skipAuthRefresh: true,
      }
    );
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

  create: (formData: {
    name: string;
    description: string;
    price: number;
    categoryId: number;
  }) => {
    return api.post("/listings", formData);
  },

  update: (id: number, formData: FormData) => {
    return api.put(`/listings/${id}`, formData, {
      headers: {},
      onUploadProgress: (progressEvent) => {
        console.log(
          "Прогрес завантаження:",
          Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
        );
      },
    });
  },

  delete: (id: number) => {
    return api.delete(`/listings/${id}`);
  },

  getFeatured: () => api.get("/listings/featured"),
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

  create: (data: { name: string; parentId?: number }) => {
    return api.post("/categories", data);
  },

  update: (id: number, data: { name?: string; parentId?: number }) => {
    return api.put(`/categories/${id}`, data);
  },

  delete: (id: number) => {
    return api.delete(`/categories/${id}`);
  },
};

// API для брендів (марок техніки)
export const brandsAPI = {
  getAll: (params?: Record<string, unknown>) => {
    return api.get("/brands", { params });
  },

  getById: (id: number) => {
    return api.get(`/brands/${id}`);
  },

  getBySlug: (slug: string) => {
    return api.get(`/brands/slug/${slug}`);
  },

  create: (data: { name: string; description?: string; logo?: File }) => {
    const formData = new FormData();
    formData.append("name", data.name);

    if (data.description) {
      formData.append("description", data.description);
    }

    if (data.logo) {
      formData.append("logo", data.logo);
    }

    return api.post("/brands", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  update: (
    id: number,
    data: { name?: string; description?: string; logo?: File }
  ) => {
    const formData = new FormData();

    if (data.name) {
      formData.append("name", data.name);
    }

    if (data.description) {
      formData.append("description", data.description);
    }

    if (data.logo) {
      formData.append("logo", data.logo);
    }

    return api.put(`/brands/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  delete: (id: number) => {
    return api.delete(`/brands/${id}`);
  },

  getPopular: (limit = 10) => {
    return api.get(`/brands/popular?limit=${limit}`);
  },

  search: (query: string) => {
    return api.get(`/brands/search?q=${query}`);
  },
};

// API для країн
export const countriesAPI = {
  getAll: () => {
    return api.get("/countries");
  },
  getById: (id: number) => {
    return api.get(`/countries/${id}`);
  },
};

// API для регіонів, громад, населених пунктів з урахуванням countryId
export const locationsAPI = {
  getRegions: (countryId?: number | string) => {
    if (countryId) {
      return api.get(`/regions/by-country/${countryId}`);
    }
    return api.get("/regions");
  },
  getCommunities: (regionId: number | string) => {
    return api.get(`/regions/${regionId}/communities`);
  },
  getLocations: (communityId: number | string) => {
    return api.get(`/regions/communities/${communityId}/locations`);
  },
  getLocationsByCountry: (countryId: number | string) => {
    return api.get(`/countries/${countryId}/locations`);
  },
};

// API для чату
export const chatAPI = {
  getConversations: () => {
    return api.get("/chat/conversations");
  },

  getMessages: (userId: number, params?: Record<string, unknown>) => {
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
  create: (formData: {
    amount: number;
    description: string;
    userId: number;
  }) => {
    return api.post("/transactions", formData);
  },

  getAll: (params?: Record<string, unknown>) => {
    return api.get("/transactions", { params });
  },

  getById: (transactionId: string) => {
    return api.get(`/transactions/${transactionId}`);
  },
};

// API для сповіщень
export const notificationsAPI = {
  getSettings: () => {
    return api.get("/notifications/settings");
  },

  updateSettings: (settings: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    pushNotifications?: boolean;
  }) => {
    return api.put("/notifications/settings", settings);
  },

  getPreferences: () => {
    return api.get("/notifications/preferences");
  },

  updatePreferences: (preferences: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    pushNotifications?: boolean;
  }) => {
    return api.put("/notifications/preferences", preferences);
  },

  getHistory: (params?: Record<string, unknown>) => {
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

  getUsers: (params?: Record<string, unknown>) => {
    return api.get("/admin/users", { params });
  },

  updateUserRole: (userId: number, role: string) => {
    return api.put(`/admin/users/${userId}/role`, { role });
  },

  getListings: (params?: Record<string, unknown>) => {
    return api.get("/admin/listings", { params });
  },

  getPayments: (params?: Record<string, unknown>) => {
    return api.get("/admin/payments", { params });
  },

  getCategories: () => {
    return api.get("/admin/categories");
  },

  getNotificationTemplates: () => {
    return api.get("/notifications/templates");
  },

  getNotificationTemplate: (id: number) => {
    return api.get(`/notifications/templates/${id}`);
  },

  createNotificationTemplate: (template: {
    title: string;
    body: string;
    type: string;
  }) => {
    return api.post("/notifications/templates", template);
  },

  updateNotificationTemplate: (
    id: number,
    template: { title: string; body: string; type: string }
  ) => {
    return api.put(`/notifications/templates/${id}`, template);
  },

  deleteNotificationTemplate: (id: number) => {
    return api.delete(`/notifications/templates/${id}`);
  },

  sendBulkEmails: (data: {
    subject: string;
    body: string;
    recipients: string[];
  }) => {
    return api.post("/bulk-notifications/email", data);
  },

  sendBulkSms: (data: { message: string; recipients: string[] }) => {
    return api.post("/bulk-notifications/sms", data);
  },

  sendBulkPush: (data: {
    title: string;
    body: string;
    recipients: string[];
  }) => {
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

  previewFilteredUsers: (filter: { [key: string]: unknown }) => {
    return api.post("/bulk-notifications/filter-users", filter);
  },
};

// API для кампаній
export const campaignsAPI = {
  getAll: (params?: Record<string, unknown>) => {
    return api.get("/campaigns", { params });
  },

  create: (campaign: {
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    [key: string]: unknown;
  }) => {
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

  update: (
    id: number,
    campaign: {
      name?: string;
      description?: string;
      startDate?: string;
      endDate?: string;
      [key: string]: unknown;
    }
  ) => {
    return api.put(`/campaigns/${id}`, campaign);
  },

  delete: (id: number) => {
    return api.delete(`/campaigns/${id}`);
  },

  getAnalytics: (id: number) => {
    return api.get(`/campaigns/${id}/analytics`);
  },

  createTest: (data: { [key: string]: unknown }) => {
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

  startMessages: (id: number, data: Record<string, unknown>) => {
    return api.post(`/campaigns/${id}/messages`, data);
  },
};

// API для запланованих завдань
export const scheduledTasksAPI = {
  schedulListingDeactivation: (listingId: number) => {
    return api.get(
      `/scheduled-tasks/listing/${listingId}/schedule-deactivation`
    );
  },

  schedulePaymentReminder: (paymentId: string) => {
    return api.get(`/scheduled-tasks/payment/${paymentId}/reminder`);
  },

  createTask: (task: {
    name: string;
    schedule: string;
    data: Record<string, unknown>;
  }) => {
    return api.post("/scheduled-tasks/task", task);
  },

  createBatchTasks: (
    tasks: { name: string; schedule: string; data: Record<string, unknown> }[]
  ) => {
    return api.post("/scheduled-tasks/batch", { tasks });
  },

  createRecurringTask: (task: {
    name: string;
    schedule: string;
    data: Record<string, unknown>;
  }) => {
    return api.post("/scheduled-tasks/recurring", task);
  },

  getAll: (params?: Record<string, unknown>) => {
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

  sendTestMessage: (queueName: string, data: Record<string, unknown>) => {
    return api.post(`/queues/${queueName}/test`, data);
  },

  getMessages: (queueName: string, params?: Record<string, unknown>) => {
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