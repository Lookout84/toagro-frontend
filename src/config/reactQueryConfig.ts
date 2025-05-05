import { QueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

/**
 * Налаштування для React Query
 */
export const queryClientConfig = {
  defaultOptions: {
    queries: {
      // Не оновлюємо дані, коли вікно отримує фокус
      refetchOnWindowFocus: false,

      // Кількість повторних спроб при помилці
      retry: 1,

      // Час, протягом якого дані вважаються "свіжими" (5 хвилин)
      staleTime: 5 * 60 * 1000,

      // Час, протягом якого дані зберігаються в кеші (10 хвилин)
      cacheTime: 10 * 60 * 1000,

      // Обробник помилок
      onError: (error: any) => {
        const message =
          error?.response?.data?.message ||
          "Сталася помилка при завантаженні даних";
        toast.error(message);
      },
    },
    mutations: {
      // Обробник помилок для мутацій
      onError: (error: any) => {
        const message =
          error?.response?.data?.message ||
          "Сталася помилка при обробці запиту";
        toast.error(message);
      },
    },
  },
};

/**
 * Фабрика для створення клієнта React Query
 */
export const createQueryClient = (): QueryClient => {
  return new QueryClient(queryClientConfig);
};

// Інстанс клієнта React Query для використання в додатку
export const queryClient = createQueryClient();
