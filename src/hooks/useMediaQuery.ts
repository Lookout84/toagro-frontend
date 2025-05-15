import { useState, useEffect } from 'react';

/**
 * Хук для визначення, чи відповідає поточний розмір екрану заданому медіа-запиту
 * @param query Медіа-запит, наприклад "(max-width: 768px)"
 * @returns Булеве значення, що вказує на відповідність медіа-запиту
 */
const useMediaQuery = (query: string): boolean => {
  // Функція для отримання поточного стану медіа-запиту
  const getMatches = (): boolean => {
    return typeof window !== 'undefined' ? window.matchMedia(query).matches : false;
  };
  
  // Ініціалізуємо стан з правильним початковим значенням
  const [matches, setMatches] = useState<boolean>(getMatches());

  useEffect(() => {
    // Перевіряємо, чи в браузері
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia(query);
      
      // Обробник для відстеження зміни медіа-запиту
      const handleChange = (event: MediaQueryListEvent) => {
        setMatches(event.matches);
      };
      
      // Додаємо слухач подій для медіа-запиту
      mediaQuery.addEventListener('change', handleChange);
      
      // Прибираємо слухач при розмонтуванні компонента
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
    return () => {}; // Return empty cleanup function for non-browser environments
  }, [query]);

  return matches;
};

export default useMediaQuery;

/**
 * Хук для отримання всіх Tailwind брейкпоінтів
 * @returns Об'єкт з булевими значеннями для кожного брейкпоінту
 */
export const useTailwindBreakpoints = () => {
  return {
    sm: useMediaQuery("(min-width: 640px)"),
    md: useMediaQuery("(min-width: 768px)"),
    lg: useMediaQuery("(min-width: 1024px)"),
    xl: useMediaQuery("(min-width: 1280px)"),
    "2xl": useMediaQuery("(min-width: 1536px)"),
  };
};

// import { useState, useEffect } from "react";

// /**
//  * Хук для відстеження медіа-запитів
//  * @param query - CSS медіа-запит для відстеження
//  * @returns булеве значення, чи відповідає медіа-запит поточним умовам
//  */
// function useMediaQuery(query: string): boolean {
//   // Початкове значення для уникнення гідрації/неспівпадіння на клієнті та сервері
//   const getMatches = (): boolean => {
//     // Перевірка, чи ми в браузері
//     if (typeof window !== "undefined") {
//       return window.matchMedia(query).matches;
//     }
//     return false;
//   };

//   const [matches, setMatches] = useState<boolean>(getMatches());

//   // Оновлення стану при зміні медіа-запиту
//   function handleChange() {
//     setMatches(getMatches());
//   }

//   useEffect(() => {
//     const matchMedia = window.matchMedia(query);

//     // Ініціалізуємо стан
//     handleChange();

//     try {
//       // Сучасний підхід до слухання змін медіа-запиту
//       matchMedia.addEventListener("change", handleChange);
//     } catch (e) {
//       // Запасний варіант для старих браузерів
//       matchMedia.addListener(handleChange);
//     }

//     // Очищення при розмонтуванні
//     return () => {
//       try {
//         matchMedia.removeEventListener("change", handleChange);
//       } catch (e) {
//         matchMedia.removeListener(handleChange);
//       }
//     };
//   }, [query]);

//   return matches;
// }// export const tailwindBreakpoints = {
//   sm: useMediaQuery("(min-width: 640px)"),
//   md: useMediaQuery("(min-width: 768px)"),
//   lg: useMediaQuery("(min-width: 1024px)"),
//   xl: useMediaQuery("(min-width: 1280px)"),
//   "2xl": useMediaQuery("(min-width: 1536px)"),
// };

// // Попередньо визначені брейкпоінти для TailwindCSS


// export default useMediaQuery;
