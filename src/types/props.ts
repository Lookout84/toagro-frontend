/**
 * Типи для пропсів компонентів
 */
import {
  ReactNode,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
} from "react";
import { Category, Listing, User, Conversation, Message } from "./api";

// Загальні типи для компонентів
export interface ChildrenProps {
  children: ReactNode;
}

// Кнопка
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "link";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

// Поля форми
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
  fullWidth?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helper?: string;
  options: { value: string; label: string }[];
  fullWidth?: boolean;
}

// Компоненти для карток товарів
export interface ListingCardProps {
  listing: Listing;
  compareEnabled?: boolean;
  onToggleCompare?: (listing: Listing, isSelected: boolean) => void;
  isSelected?: boolean;
}

export interface ListingDetailsProps {
  listing: Listing;
  isLoading?: boolean;
  error?: string | null;
}

// Компоненти для фільтрації та пошуку
export interface FilterSidebarProps {
  categories: Category[];
  onFilterChange?: (filters: any) => void;
  initialFilters?: any;
  isLoading?: boolean;
}

export interface SearchBarProps {
  onSearch?: (term: string) => void;
  initialValue?: string;
  placeholder?: string;
  className?: string;
}

// Компоненти для навігації
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  visiblePages?: number;
  className?: string;
}

export interface BreadcrumbsProps {
  items: { label: string; path?: string }[];
  separator?: ReactNode;
  homeIcon?: ReactNode;
  className?: string;
}

// Компоненти для авторизації
export interface LoginFormProps {
  onSubmit: (data: { email: string; password: string }) => void;
  isLoading?: boolean;
  error?: string | null;
}

export interface RegisterFormProps {
  onSubmit: (data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => void;
  isLoading?: boolean;
  error?: string | null;
}

// Компоненти для профілю та користувача
export interface UserProfileProps {
  user: User;
  isEditing?: boolean;
  onEditToggle?: () => void;
  onUpdateProfile?: (data: any) => void;
  isLoading?: boolean;
}

export interface UserListingsProps {
  listings: Listing[];
  isLoading?: boolean;
  onDelete?: (id: number) => void;
}

// Компоненти для чату
export interface ChatListProps {
  conversations: Conversation[];
  activeConversationId?: number | null;
  onSelectConversation?: (userId: number) => void;
  isLoading?: boolean;
}

export interface MessageListProps {
  messages: Message[];
  currentUserId: number;
  isLoading?: boolean;
}

export interface MessageFormProps {
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

// Компоненти для сповіщень та модальних вікон
export interface ToastProps {
  message: string;
  type?: "info" | "success" | "warning" | "error";
  autoClose?: boolean;
  duration?: number;
  onClose?: () => void;
}

export interface ModalProps extends ChildrenProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "primary" | "danger";
}
