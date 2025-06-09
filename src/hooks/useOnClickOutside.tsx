import { RefObject, useEffect } from "react";

/**
 * Хук для відстеження кліків поза елементом
 * @param ref Посилання на DOM елемент, поза яким слід відстежувати кліки
 * @param handler Функція, яка викликається при кліку поза елементом
 */
export function useOnClickOutside<T extends HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void
): void {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      // Перевіряємо, чи елемент існує і чи клік був поза ним
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      
      handler(event);
    };
    
    // Додаємо слухачі подій до документа
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    
    // Прибираємо слухачі при розмонтуванні компонента
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}