/**
 * Типи для роботи з API
 */

// Базовий тип для відповідей від API
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

// Тип для метаданих пагінації
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Тип для запитів з пагінацією
export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

// Типи для авторизації
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  avatar?: string;
  role: "user" | "admin";
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Типи для оголошень
export interface ListingRequest {
  title: string;
  description: string;
  price: number;
  categoryId: number;
  location: string;
  images: File[] | string[];
  condition: "NEW" | "USED";
  brand?: string; // Add brand field
}

export interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  priceType?: "BRUTTO" | "NETTO" | string;
  location: string;
  category: string;
  categoryId: number;
  brand?: string; // Додайте поле brand
  images: string[];
  views: number;
  active: boolean;
  condition: 'NEW' | 'USED';
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    name: string;
    avatar?: string;
    phoneNumber?: string;
    email?: string;
  };
}

// Типи для категорій
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  favorite?: boolean;
  isMotorized?: boolean;
  image?: string;
  parentId?: number;
  children?: Category[];
  _count?: {
    listings: number;
  };
}

export interface CategoryRequest {
  name: string;
  description?: string;
  parentId?: number;
  image?: string | File;
}

// Типи для чату
export interface Conversation {
  userId: number;
  userName: string;
  avatar?: string;
  lastMessage: string;
  unreadCount: number;
  lastMessageDate: string;
  isOnline?: boolean;
}

export interface Message {
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

export interface SendMessageRequest {
  receiverId: number;
  content: string;
  listingId?: number;
}
// Типи для марки
export interface Brand {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  active: boolean;
  popular: boolean;
  createdAt: string;
  updatedAt: string;
}

// Типи для транзакцій
export interface Transaction {
  id: string;
  amount: number;
  status: "pending" | "success" | "failed";
  description?: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
  listingId?: number;
}

export interface CreateTransactionRequest {
  amount: number;
  description?: string;
  listingId?: number;
  paymentMethod: string;
}

// Типи для сповіщень
export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
}

export interface NotificationPreferences {
  listingMessages: boolean;
  listingUpdates: boolean;
  promotions: boolean;
  systemAnnouncements: boolean;
  accountActivity: boolean;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

// Типи для адміністративних функцій
export interface AdminDashboardStats {
  totalUsers: number;
  newUsersToday: number;
  totalListings: number;
  newListingsToday: number;
  totalTransactions: number;
  totalRevenue: number;
  revenueToday: number;
  userGrowth: {
    labels: string[];
    data: number[];
  };
  listingGrowth: {
    labels: string[];
    data: number[];
  };
  revenueGrowth: {
    labels: string[];
    data: number[];
  };
}

// Типи для кампаній
export interface Campaign {
  id: number;
  name: string;
  description?: string;
  type: string;
  status: string;
  startDate?: string;
  endDate?: string;
  targetAudience?: Record<string, unknown>;
  content: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
}

export interface CampaignAnalytics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  timeline: {
    date: string;
    opens: number;
    clicks: number;
  }[];
}

// Типи для запланованих завдань
export interface ScheduledTask {
  id: number;
  type: string;
  data: Record<string, unknown>;
  status: string;
  scheduledAt: string;
  executedAt?: string;
  result?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringTask {
  id: number;
  type: string;
  data: Record<string, unknown>;
  status: string;
  schedule: string; // CRON формат
  lastExecutedAt?: string;
  nextExecutionAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Типи для черг повідомлень
export interface QueueStats {
  name: string;
  messagesCount: number;
  consumersCount: number;
  messagesPerSecond: number;
  status: string;
}

export interface QueueMessage {
  id: string;
  content: unknown;
  createdAt: string;
  headers: Record<string, unknown>;
}

export interface QueueConsumer {
  id: string;
  queue: string;
  tag: string;
  status: string;
  createdAt: string;
}

// Типи для перевірки здоров'я системи
export interface HealthCheck {
  status: string;
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: {
      status: string;
      latency: number;
    };
    redis: {
      status: string;
      latency: number;
    };
    rabbitmq: {
      status: string;
      latency: number;
    };
    storage: {
      status: string;
      latency: number;
    };
  };
}

export interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  status: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
  // Додайте інші поля, які є в вашому API
}