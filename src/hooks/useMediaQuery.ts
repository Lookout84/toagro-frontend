import { useState, useEffect } from "react";

/**
 * Хук для відстеження медіа-запитів
 * @param query - CSS медіа-запит для відстеження
 * @returns булеве значення, чи відповідає медіа-запит поточним умовам
 */
function useMediaQuery(query: string): boolean {
  // Початкове значення для уникнення гідрації/неспівпадіння на клієнті та сервері
  const getMatches = (): boolean => {
    // Перевірка, чи ми в браузері
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  const [matches, setMatches] = useState<boolean>(getMatches());

  // Оновлення стану при зміні медіа-запиту
  function handleChange() {
    setMatches(getMatches());
  }

  useEffect(() => {
    const matchMedia = window.matchMedia(query);

    // Ініціалізуємо стан
    handleChange();

    try {
      // Сучасний підхід до слухання змін медіа-запиту
      matchMedia.addEventListener("change", handleChange);
    } catch (e) {
      // Запасний варіант для старих браузерів
      matchMedia.addListener(handleChange);
    }

    // Очищення при розмонтуванні
    return () => {
      try {
        matchMedia.removeEventListener("change", handleChange);
      } catch (e) {
        matchMedia.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
}

// Попередньо визначені брейкпоінти для TailwindCSS
export const tailwindBreakpoints = {
  sm: useMediaQuery("(min-width: 640px)"),
  md: useMediaQuery("(min-width: 768px)"),
  lg: useMediaQuery("(min-width: 1024px)"),
  xl: useMediaQuery("(min-width: 1280px)"),
  "2xl": useMediaQuery("(min-width: 1536px)"),
};

export default useMediaQuery;
