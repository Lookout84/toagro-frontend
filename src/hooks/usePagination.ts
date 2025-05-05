import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

interface PaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  useUrlParams?: boolean;
  totalItems?: number;
}

interface PaginationResult {
  page: number;
  limit: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  pagesRange: number[];
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
}

/**
 * Хук для управління пагінацією
 * @param options - налаштування пагінації
 * @returns об'єкт з даними пагінації та функціями управління
 */
function usePagination({
  initialPage = 1,
  initialLimit = 10,
  useUrlParams = true,
  totalItems = 0,
}: PaginationOptions = {}): PaginationResult {
  const [searchParams, setSearchParams] = useSearchParams();

  // Ініціалізація з URL-параметрів, якщо useUrlParams = true
  const [page, setPageState] = useState<number>(() => {
    if (useUrlParams) {
      const pageParam = searchParams.get("page");
      return pageParam ? parseInt(pageParam) : initialPage;
    }
    return initialPage;
  });

  const [limit, setLimitState] = useState<number>(() => {
    if (useUrlParams) {
      const limitParam = searchParams.get("limit");
      return limitParam ? parseInt(limitParam) : initialLimit;
    }
    return initialLimit;
  });

  // Загальна кількість сторінок
  const totalPages = useMemo(() => {
    return totalItems ? Math.ceil(totalItems / limit) : 0;
  }, [totalItems, limit]);

  // Індекси для поточної сторінки
  const startIndex = useMemo(() => (page - 1) * limit, [page, limit]);
  const endIndex = useMemo(
    () => Math.min(startIndex + limit - 1, totalItems - 1),
    [startIndex, limit, totalItems],
  );

  // Статуси наявності наступної/попередньої сторінки
  const hasNextPage = useMemo(() => page < totalPages, [page, totalPages]);
  const hasPrevPage = useMemo(() => page > 1, [page]);

  // Формування масиву номерів сторінок для відображення
  const pagesRange = useMemo(() => {
    const range: number[] = [];
    const maxVisiblePages = 5; // Максимальна кількість видимих сторінок

    if (totalPages <= maxVisiblePages) {
      // Якщо загальна кількість сторінок менша за максимальну кількість видимих сторінок,
      // просто показуємо всі сторінки
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
    } else {
      // Показуємо першу та останню сторінки завжди
      // Та кілька сторінок навколо поточної
      const sidePagesCount = Math.floor((maxVisiblePages - 3) / 2); // Кількість сторінок з кожного боку від поточної

      // Завжди додаємо першу сторінку
      range.push(1);

      // Початкова сторінка для діапазону навколо поточної
      let rangeStart = Math.max(2, page - sidePagesCount);

      // Кінцева сторінка для діапазону навколо поточної
      let rangeEnd = Math.min(totalPages - 1, page + sidePagesCount);

      // Коригуємо початок і кінець, щоб завжди показувати maxVisiblePages сторінок
      if (rangeStart <= 2) {
        rangeEnd = Math.min(totalPages - 1, maxVisiblePages - 2);
      }

      if (rangeEnd >= totalPages - 1) {
        rangeStart = Math.max(2, totalPages - maxVisiblePages + 1);
      }

      // Додаємо "..." перед діапазоном, якщо потрібно
      if (rangeStart > 2) {
        range.push(-1); // -1 означає "..."
      }

      // Додаємо сторінки в діапазоні
      for (let i = rangeStart; i <= rangeEnd; i++) {
        range.push(i);
      }

      // Додаємо "..." після діапазону, якщо потрібно
      if (rangeEnd < totalPages - 1) {
        range.push(-2); // -2 означає "..." в кінці
      }

      // Завжди додаємо останню сторінку
      if (totalPages > 1) {
        range.push(totalPages);
      }
    }

    return range;
  }, [page, totalPages]);

  // Оновлення URL-параметрів при зміні page або limit
  useEffect(() => {
    if (useUrlParams) {
      // Зберігаємо існуючі параметри
      const params: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        params[key] = value;
      });

      // Оновлюємо параметри пагінації
      params["page"] = page.toString();
      params["limit"] = limit.toString();

      // Оновлюємо URL
      setSearchParams(params);
    }
  }, [page, limit, useUrlParams, searchParams, setSearchParams]);

  // Функції для роботи з пагінацією
  const setPage = (newPage: number) => {
    // Переконуємось, що сторінка в допустимих межах
    const validPage = Math.max(1, Math.min(newPage, totalPages || 1));
    setPageState(validPage);
  };

  const setLimit = (newLimit: number) => {
    setLimitState(newLimit);
    // При зміні ліміту повертаємось на першу сторінку
    setPageState(1);
  };

  const nextPage = () => {
    if (hasNextPage) {
      setPageState((prev) => prev + 1);
    }
  };

  const prevPage = () => {
    if (hasPrevPage) {
      setPageState((prev) => prev - 1);
    }
  };

  const firstPage = () => {
    setPageState(1);
  };

  const lastPage = () => {
    setPageState(totalPages || 1);
  };

  return {
    page,
    limit,
    totalPages,
    startIndex,
    endIndex,
    hasNextPage,
    hasPrevPage,
    pagesRange,
    setPage,
    setLimit,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
  };
}

export default usePagination;
