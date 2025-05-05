import { useState, useEffect } from "react";

/**
 * Хук для роботи з localStorage
 * @param key - ключ для збереження в localStorage
 * @param initialValue - початкове значення, якщо ключ не знайдено
 * @returns [storedValue, setValue] - поточне значення та функція для його оновлення
 */
function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((val: T) => T)) => void] {
  // Функція для отримання значення з localStorage
  const readValue = (): T => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  };

  // Стан для зберігання поточного значення
  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Функція для оновлення значення в localStorage та стані
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Дозволяємо значенню бути функцією (як setState)
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      // Оновлюємо стан
      setStoredValue(valueToStore);

      // Зберігаємо в localStorage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Слухаємо зміни ключа в інших вкладках/вікнах
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        setStoredValue(JSON.parse(e.newValue));
      }
    };

    // Додаємо слухача подій
    window.addEventListener("storage", handleStorageChange);

    // Видаляємо слухача при розмонтуванні
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue];
}

export default useLocalStorage;
