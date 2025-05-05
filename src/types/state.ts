/**
 * Типи для стану Redux
 */
import { Listing, Category, Conversation, Message, User } from "./api";

// Типи для стану каталогу
export interface CatalogState {
  categories: Category[];
  categoryTree: Category[];
  currentCategory: Category | null;
  listings: Listing[];
  filters: FilterParams;
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

export interface FilterParams {
  category?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "price" | "views";
  sortOrder?: "asc" | "desc";
}

// Типи для стану оголошень
export interface ListingState {
  currentListing: Listing | null;
  userListings: Listing[];
  similarListings: Listing[];
  isLoading: boolean;
  error: string | null;
}

// Типи для стану чату
export interface ChatState {
  conversations: Conversation[];
  messages: Record<number, Message[]>; // userId -> messages
  activeConversationId: number | null;
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

// Типи для стану UI
export interface UiState {
  theme: "light" | "dark";
  mobileMenuOpen: boolean;
  lastSearches: string[];
  compareItems: number[];
  notifications: {
    id: string;
    type: "info" | "success" | "warning" | "error";
    message: string;
    autoClose?: boolean;
  }[];
}

// Тип для стану авторизації
export interface AuthState {
  user: User | null;
  token: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

// Комбінований тип для кореневого стану
export interface RootState {
  auth: AuthState;
  catalog: CatalogState;
  listing: ListingState;
  chat: ChatState;
  ui: UiState;
}
