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
          const refreshedToken =
            response?.data?.accessToken ||
            response?.data?.token ||
            response?.data?.data?.accessToken ||
            response?.data?.data?.token;

          if (refreshedToken) {
            setToken(refreshedToken);

            if (!error.config.headers) error.config.headers = {};
            error.config.headers.Authorization = `Bearer ${refreshedToken}`;
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

// Розширення ApiClient для кампаній
export const campaignsAPI = {
  getAll: (params?: Record<string, unknown>) => {
    return api.get("/campaigns", { params });
  },

  create: (campaign: {
    name: string;
    description?: string;
    type: string; // CampaignType
    status?: string; // CampaignStatus
    startDate?: string | Date;
    endDate?: string | Date;
    targetAudience?: Record<string, unknown>;
    goal?: string;
    budget?: number;
    performance?: Record<string, unknown>;
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
      type?: string;
      status?: string;
      startDate?: string | Date;
      endDate?: string | Date;
      targetAudience?: Record<string, unknown>;
      goal?: string;
      budget?: number;
      performance?: Record<string, unknown>;
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

  createTest: (data: {
    name: string;
    type: string;
    targetAudience?: Record<string, unknown>;
  }) => {
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

  startMessages: (
    id: number,
    data: {
      messageType: string;
      content: string;
      subject?: string;
      recipientFilter?: Record<string, unknown>;
    }
  ) => {
    return api.post(`/campaigns/${id}/messages`, data);
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

  create: (data: FormData) =>
    api.post("/listings", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  // create: (formData: {
  //   name: string;
  //   description: string;
  //   price: number;
  //   categoryId: number;
  // }) => {
  //   return api.post("/listings", formData);
  // },

  update: (id: number, formData: FormData) => {
    return api.put(`/listings/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
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
  getUserById: (id: string | number) => axios.get(`/admin/users/${id}`),
  updateUser: (userId: number, data: Record<string, unknown>) =>
    api.put(`/admin/users/${userId}`, data),
  // rejectDocument: (companyId: number, documentId: number, data: { reason: string }) =>
  //   api.post(`/admin/companies/${companyId}/documents/${documentId}/reject`, data),
  rejectDocument: (
    companyId: number,
    documentId: number,
    data: { reason: string }
  ) =>
    api.post(
      `/admin/companies/${companyId}/documents/${documentId}/reject`,
      data
    ),
  createCampaign: (data: {
    title: string;
    description: string;
    goal: number;
    status: string;
  }) => api.post("/admin/campaigns", data),
  getCampaign: (id: string | undefined) => api.get(`/admin/campaigns/${id}`),
  // rejectDocument: (
  //   companyId: number,
  //   documentId: number,
  //   data: { reason: string }
  // ) =>
  //   axios.post(
  //     `/admin/companies/${companyId}/documents/${documentId}/reject`,
  //     data
  //   ),

  // getCompanies: (params?: Record<string, unknown>) =>
  //   axios.get("/admin/companies", { params }),
  getSystemHealth: () => api.get("/admin/system-health"),

  getCompany: (id: number) => axios.get(`/admin/companies/${id}`),

  createCategory: (data: { name: string; parentId?: number | null }) =>
    api.post("/admin/categories", data),

  deleteCategory: (id: number) => api.delete(`/admin/categories/${id}`),

  updateCategory(id: number, data: { name: string; slug?: string }) {
    return api.put(`/categories/${id}`, data);
  },

  cancelBulkTask: (taskId: number) =>
    api.delete(`/admin/scheduled-tasks/${taskId}`),

  getCompanyVerificationHistory: (companyId: number) =>
    api.get(`/admin/companies/${companyId}/verification-history`),

  getScheduledTasks: (params?: Record<string, unknown>) =>
    api.get("/admin/scheduled-tasks", { params }),

  pauseScheduledTask: (taskId: number) =>
    api.post(`/admin/scheduled-tasks/${taskId}/pause`),

  resumeScheduledTask: (taskId: number) =>
    api.post(`/admin/scheduled-tasks/${taskId}/resume`),

  getScheduledTaskById: (id: number) => api.get(`/admin/scheduled-tasks/${id}`),

  cancelScheduledTask: (id: number) =>
    api.post(`/admin/scheduled-tasks/${id}/cancel`),

  getScheduledTaskTypes: () => api.get("/admin/scheduled-tasks/types"),

  getRecurringTasks: (params?: Record<string, unknown>) =>
    api.get("/admin/recurring-tasks", { params }),

  cancelRecurringTask: (id: number) =>
    api.post(`/admin/recurring-tasks/${id}/cancel`),

  getCompanyListings: (companyId: number) => {
    return api.get(`/admin/companies/${companyId}/listings`);
  },

  getCompanyDocuments: (companyId: number) => {
    return api.get(`/admin/companies/${companyId}/documents`);
  },

  getCompanyStats: (companyId: number) => {
    return api.get(`/admin/companies/${companyId}/stats`);
  },
  // If you need the axiosInstance version, rename it:
  // getCompanyVerificationHistoryWithInstance: (id: number) =>
  //   axiosInstance.get(`/admin/companies/${id}/verification-history`),

  // Removed duplicate definitions: verifyCompany, rejectCompany, verifyDocument, rejectDocument
  getUser: (userId: number) => api.get(`/admin/users/${userId}`),

  getUserCompanies: (userId: number) => {
    return api.get(`/admin/users/${userId}/companies`);
  },

  getUserListings: (userId: number, params?: Record<string, unknown>) => {
    return api.get(`/admin/users/${userId}/listings`, { params });
  },

  getUserTransactions: (userId: number, params?: Record<string, unknown>) => {
    return api.get(`/admin/users/${userId}/transactions`, { params });
  },

  getUserNotifications: (userId: number, params?: Record<string, unknown>) => {
    return api.get(`/admin/users/${userId}/notifications`, { params });
  },

  getUserMessages: (userId: number, params?: Record<string, unknown>) => {
    return api.get(`/admin/users/${userId}/messages`, { params });
  },

  getCompaniesForVerification: (params: {
    page: number;
    pageSize: number;
    search?: string;
    status: string;
    fromDate?: string;
    toDate?: string;
    sortBy: string;
  }) => axios.get("/admin/companies/verification", { params }),

  getDocumentsForVerification: (params: {
    page: number;
    pageSize: number;
    search?: string;
    status: string;
    type?: string;
    fromDate?: string;
    toDate?: string;
    sortBy: string;
    companyId?: number;
  }) => axios.get("/admin/documents/verification", { params }),

  blockCompany: (
    companyId: number,
    data: { reason: string; durationDays: number }
  ) => api.post(`/admin/companies/${companyId}/block`, data),

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

  getActiveJobs: () => {
    return api.get("/bulk-notifications/active-jobs");
  },

  previewFilteredUsers: (filter: { [key: string]: unknown }) => {
    return api.post("/bulk-notifications/filter-users", filter);
  },

  getUserActivity: (userId: number, params?: Record<string, unknown>) => {
    return api.get(`/admin/users/${userId}/activity`, { params });
  },
  getCompanies: (params?: Record<string, unknown>) =>
    api.get("/admin/companies", { params }),
  // Removed duplicate getCompanyDocuments to avoid property name conflict
  verifyCompany: (companyId: number) =>
    api.post(`/admin/companies/${companyId}/verify`),
  rejectCompany: (companyId: number, data: { reason: string }) =>
    api.post(`/admin/companies/${companyId}/reject`, data),
  verifyDocument: (companyId: number, documentId: number) =>
    api.post(`/admin/companies/${companyId}/documents/${documentId}/verify`),
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

// Розширення API для компаній
export const companiesAPI = {
  // Отримання списку компаній
  getAll: (params?: Record<string, unknown>) => {
    return api.get("/companies", { params });
  },

  // Отримання профілю компанії за ID
  getById: (id: number) => {
    return api.get(`/companies/${id}`);
  },

  // Отримання профілю компанії за ID користувача
  getByUserId: (userId: number) => {
    return api.get(`/users/${userId}/company`);
  },

  // Отримання власного профілю компанії (поточного користувача)
  getMyCompany: () => {
    return api.get("/my-company");
  },
  getCompanyReviews: (companyId: number) =>
    axios.get(`/companies/${companyId}/reviews`),
  // Створення профілю компанії
  create: (data: {
    companyName: string;
    companyCode: string; // ЄДРПОУ
    vatNumber?: string; // ІПН
    website?: string;
    industry?: string;
    foundedYear?: number;
    size?: "SMALL" | "MEDIUM" | "LARGE";
    description?: string;
    address?: {
      country: string;
      region?: string;
      city: string;
      street?: string;
      postalCode?: string;
    };
    contactInfo?: Record<string, unknown>;
  }) => {
    return api.post("/companies", data);
  },

  // Оновлення профілю компанії
  update: (
    id: number,
    data: {
      companyName?: string;
      companyCode?: string;
      vatNumber?: string;
      website?: string;
      industry?: string;
      foundedYear?: number;
      size?: "SMALL" | "MEDIUM" | "LARGE";
      description?: string;
      logo?: File;
      address?: {
        country?: string;
        region?: string;
        city?: string;
        street?: string;
        postalCode?: string;
      };
      contactInfo?: Record<string, unknown>;
    }
  ) => {
    // Якщо є файл logo, використовуємо FormData, інакше просто JSON
    if (data.logo) {
      const formData = new FormData();

      // Додаємо всі поля до FormData, крім address та contactInfo
      Object.entries(data).forEach(([key, value]) => {
        if (key !== "address" && key !== "contactInfo" && value !== undefined) {
          if (key === "logo" && value instanceof File) {
            formData.append(key, value);
          } else if (typeof value !== "object") {
            formData.append(key, String(value));
          }
        }
      });

      // Додаємо address та contactInfo як JSON рядки
      if (data.address) {
        formData.append("address", JSON.stringify(data.address));
      }
      if (data.contactInfo) {
        formData.append("contactInfo", JSON.stringify(data.contactInfo));
      }

      return api.put(`/companies/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } else {
      // Звичайний JSON запит, якщо немає файлів
      return api.put(`/companies/${id}`, data);
    }
  },

  // Видалення профілю компанії
  delete: (id: number) => {
    return api.delete(`/companies/${id}`);
  },
  updateCompanyLogo: (id: number, formData: FormData) =>
    api.post(`/companies/${id}/logo`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  // Додавання документа компанії
  addDocument: (
    companyId: number,
    {
      name,
      type,
      file,
      expiresAt,
    }: {
      name: string;
      type: string;
      file: File;
      expiresAt?: Date | string;
    }
  ) => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("type", type);
    formData.append("document", file);

    if (expiresAt) {
      formData.append(
        "expiresAt",
        expiresAt instanceof Date ? expiresAt.toISOString() : expiresAt
      );
    }

    return api.post(`/companies/${companyId}/documents`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Отримання документів компанії
  getDocuments: (companyId: number) => {
    return api.get(`/companies/${companyId}/documents`);
  },

  // Отримання документа компанії за ID
  getDocumentById: (companyId: number, documentId: number) => {
    return api.get(`/companies/${companyId}/documents/${documentId}`);
  },

  // Видалення документа компанії
  deleteDocument: (companyId: number, documentId: number) => {
    return api.delete(`/companies/${companyId}/documents/${documentId}`);
  },

  // Адмін-методи
  admin: {
    // Верифікація компанії
    verifyCompany: (companyId: number, isVerified: boolean) => {
      return api.post(`/companies/${companyId}/verify`, { isVerified });
    },

    // Верифікація документа
    verifyDocument: (documentId: number, isVerified: boolean) => {
      return api.post(`/documents/${documentId}/verify`, { isVerified });
    },

    // Отримання всіх компаній для адміністрування
    getAllCompanies: (params?: Record<string, unknown>) => {
      return api.get("/admin/companies", { params });
    },

    // Отримання непідтверджених компаній
    getUnverifiedCompanies: () => {
      return api.get("/admin/companies/unverified");
    },

    // Отримання непідтверджених документів
    getUnverifiedDocuments: () => {
      return api.get("/admin/documents/unverified");
    },
  },
};

// В apiClient.ts додайте наступне
export const moderatorAPI = {
  getDashboardStats: () => {
    return axios.get("/api/moderator/dashboard/stats");
  },

  getListings: (params?: Record<string, unknown>) => {
    return axios.get("/api/moderator/listings", { params });
  },

  approveListing: (id: number) => {
    return axios.put(`/api/moderator/listings/${id}/approve`);
  },

  rejectListing: (id: number, reason: string) => {
    return axios.put(`/api/moderator/listings/${id}/reject`, { reason });
  },

  getCompanies: (params?: Record<string, unknown>) => {
    return axios.get("/api/moderator/companies", { params });
  },

  verifyCompany: (id: number) => {
    return axios.put(`/api/moderator/companies/${id}/verify`);
  },

  rejectCompany: (id: number, reason: string) => {
    return axios.put(`/api/moderator/companies/${id}/reject`, { reason });
  },

  getDocuments: (params?: Record<string, unknown>) => {
    return axios.get("/api/moderator/documents", { params });
  },

  verifyDocument: (id: number) => {
    return axios.put(`/api/moderator/documents/${id}/verify`);
  },

  rejectDocument: (id: number, reason: string) => {
    return axios.put(`/api/moderator/documents/${id}/reject`, { reason });
  },

  getReports: (params?: Record<string, unknown>) => {
    return axios.get("/api/moderator/reports", { params });
  },

  resolveReport: (id: number, action: string, note: string) => {
    return axios.put(`/api/moderator/reports/${id}/resolve`, { action, note });
  },
};

// API для перевірки працездатності
export const healthAPI = {
  check: () => {
    return api.get("/health");
  },
};

export default api;
