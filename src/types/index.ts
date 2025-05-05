export * from "./api";
export * from "./state";
export * from "./props";
export * from "./form";

/**
 * Глобальні типи та розширення типів
 */

// Розширення для Window, щоб включити глобальні змінні
declare global {
  interface Window {
    // Додаткові глобальні змінні або розширення
    fs?: {
      readFile: (
        path: string,
        options?: { encoding?: string },
      ) => Promise<string | Uint8Array>;
    };
  }
}

// Розширення для змінних середовища
declare namespace NodeJS {
  interface ProcessEnv {
    VITE_API_URL: string;
    VITE_DEV_MODE: string;
    VITE_SERVER_PORT: string;
    VITE_GOOGLE_MAPS_API_KEY?: string;
    VITE_LIQPAY_PUBLIC_KEY?: string;
    VITE_MAX_UPLOAD_SIZE: string;
    VITE_ALLOWED_IMAGE_FORMATS: string;
    VITE_NOTIFICATION_TIMEOUT: string;
  }
}

// Загальні типи для додатку
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncStatus = "idle" | "loading" | "succeeded" | "failed";
export type SortOrder = "asc" | "desc";
export type ThemeMode = "light" | "dark" | "system";

// Типи для функцій зворотного виклику
export type VoidFunction = () => void;
export type SubmitHandler<T> = (data: T) => void | Promise<void>;
export type ErrorHandler = (error: any) => void;
export type ChangeHandler<T = string> = (value: T) => void;
export type SelectHandler<T> = (value: T) => void;
