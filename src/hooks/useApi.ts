import { useState, useCallback } from "react";
import { AxiosError, AxiosResponse } from "axios";

interface ApiHookResult<T, A extends unknown[] = unknown[], E = unknown> {
  data: T | null;
  loading: boolean;
  error: E | null;
  fetchData: (...args: A) => Promise<T | null>;
  reset: () => void;
}

/**
 * Хук для спрощення роботи з API запитами
 * @param apiFunction - функція API, яку треба викликати
 * @returns об'єкт з даними, станом завантаження, помилкою та функцією виклику API
 */
function useApi<T, A extends unknown[] = unknown[], E = unknown>(
  apiFunction: (...args: A) => Promise<AxiosResponse<T>>,
): ApiHookResult<T, A, E> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<E | null>(null);

  // Функція для виклику API
  const fetchData = useCallback(
    async (...args: A): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiFunction(...args);
        setData(response.data);
        return response.data;
      } catch (err) {
        const axiosError = err as AxiosError<E>;
        setError((axiosError.response?.data as E) || null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction],
  );

  // Функція для скидання стану
  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return { data, loading, error, fetchData, reset };
}

export default useApi;
