import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useDebounce from "./useDebounce";

interface SearchOptions {
  paramName?: string;
  initialValue?: string;
  debounceTime?: number;
  navigate?: boolean;
}

/**
 * Хук для реалізації пошуку з дебаунсингом та синхронізацією з URL
 * @param options - налаштування пошуку
 * @returns об'єкт з поточним пошуковим запитом, функцією його зміни та ін.
 */
function useSearch({
  paramName = "search",
  initialValue = "",
  debounceTime = 500,
  navigate = true,
}: SearchOptions = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigateFunc = useNavigate();

  // Ініціалізація з URL-параметрів
  const [searchTerm, setSearchTerm] = useState<string>(() => {
    const paramValue = searchParams.get(paramName);
    return paramValue !== null ? paramValue : initialValue;
  });

  // Дебаунсене значення пошукового запиту
  const debouncedSearchTerm = useDebounce(searchTerm, debounceTime);

  // Установка URL-параметрів при зміні дебаунсенного значення
  useEffect(() => {
    if (navigate) {
      // Копіюємо існуючі параметри
      const params: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        params[key] = value;
      });

      // Оновлюємо або видаляємо параметр пошуку
      if (debouncedSearchTerm) {
        params[paramName] = debouncedSearchTerm;
      } else {
        delete params[paramName];
      }

      // Оновлюємо URL
      setSearchParams(params);
    }
  }, [debouncedSearchTerm, paramName, navigate, searchParams, setSearchParams]);

  // Функція для навігації на сторінку пошуку
  const navigateToSearch = useCallback(
    (term: string, path = "/catalog") => {
      if (navigate) {
        navigateFunc({
          pathname: path,
          search: term ? `?${paramName}=${encodeURIComponent(term)}` : "",
        });
      }
    },
    [navigate, navigateFunc, paramName],
  );

  // Функція для очищення пошукового запиту
  const clearSearch = useCallback(() => {
    setSearchTerm("");

    if (navigate) {
      // Копіюємо існуючі параметри
      const params: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        if (key !== paramName) {
          params[key] = value;
        }
      });

      // Оновлюємо URL
      setSearchParams(params);
    }
  }, [navigate, paramName, searchParams, setSearchParams]);

  return {
    searchTerm,
    debouncedSearchTerm,
    setSearchTerm,
    navigateToSearch,
    clearSearch,
  };
}

export default useSearch;
