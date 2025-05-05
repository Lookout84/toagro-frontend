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
}

export interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  location: string;
  category: string;
  categoryId: number;
  images: string[];
  views: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    name: string;
    avatar?: string;
  };
}

// Типи для категорій
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: number;
  children?: Category[];
  _count?: {
    listings: number;
  };
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
