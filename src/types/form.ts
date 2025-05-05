/**
 * Типи для форм
 */

// Типи для форми авторизації
export interface LoginFormValues {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterFormValues {
  name: string;
  email: string;
  phoneNumber?: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export interface ForgotPasswordFormValues {
  email: string;
}

export interface ResetPasswordFormValues {
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

// Типи для форми профілю
export interface ProfileFormValues {
  name: string;
  phoneNumber?: string;
  avatar?: string | File;
}

// Типи для форми оголошення
export interface ListingFormValues {
  title: string;
  description: string;
  price: number;
  categoryId: number;
  location: string;
  images: File[] | string[];
}

// Типи для форми фільтрації
export interface FilterFormValues {
  category?: string | number;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  search?: string;
  sortBy?: "createdAt" | "price" | "views";
  sortOrder?: "asc" | "desc";
}

// Типи для форми повідомлень
export interface MessageFormValues {
  content: string;
}
