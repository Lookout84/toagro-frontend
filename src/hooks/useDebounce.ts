import { useState, useEffect } from "react";

/**
 * Хук для дебаунсингу значень, корисно для пошуку або фільтрації
 * @param value - значення, яке потрібно дебаунсити
 * @param delay - затримка в мілісекундах (за замовчуванням 500мс)
 * @returns дебаунсене значення
 */
function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Встановлюємо таймер для оновлення дебаунсенного значення
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Очищення попереднього таймера при зміні value або delay
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
