/**
 * Утиліти для роботи з локальним сховищем браузера
 */

// Ключі для зберігання даних у localStorage
export const STORAGE_KEYS = {
  TOKEN: "token",
  USER: "user",
  THEME: "theme",
  COMPARE_ITEMS: "compare-items",
  LAST_SEARCHES: "last-searches",
  VIEWED_LISTINGS: "viewed-listings",
};

/**
 * Зберігає значення в localStorage
 * @param key - ключ для збереження
 * @param value - значення для збереження
 */
export function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to localStorage: ${error}`);
  }
}

/**
 * Отримує значення з localStorage
 * @param key - ключ для отримання значення
 * @param defaultValue - значення за замовчуванням
 * @returns значення з localStorage або defaultValue
 */
export function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error getting from localStorage: ${error}`);
    return defaultValue;
  }
}

/**
 * Видаляє значення з localStorage
 * @param key - ключ для видалення
 */
export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage: ${error}`);
  }
}

/**
 * Очищає все localStorage
 */
export function clearStorage(): void {
  try {
    localStorage.clear();
  } catch (error) {
    console.error(`Error clearing localStorage: ${error}`);
  }
}

/**
 * Перевіряє, чи localStorage доступний
 * @returns true, якщо localStorage доступний
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = "__storage_test__";
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

// Експортуємо всі функції як об'єкт для зручності
export const storage = {
  setItem,
  getItem,
  removeItem,
  clearStorage,
  isStorageAvailable,
  KEYS: STORAGE_KEYS,
};
