import { useEffect, useRef, RefObject } from "react";

/**
 * Хук для обробки кліків поза елементом
 * @param callback - функція, яка викликається при кліку поза елементом
 * @param ignoreRefs - масив RefObject елементів, які слід ігнорувати (не рахувати як "поза елементом")
 * @returns ref, який треба прикріпити до цільового елемента
 */
function useOutsideClick<T extends HTMLElement = HTMLElement>(
  callback: () => void,
  ignoreRefs: RefObject<HTMLElement>[] = [],
): RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;

      // Перевіряємо, чи клік був поза основним елементом
      const isOutside = ref.current && !ref.current.contains(target);

      // Перевіряємо, чи клік був всередині будь-якого з ігнорованих елементів
      const isInsideIgnored = ignoreRefs.some(
        (ignoreRef) => ignoreRef.current && ignoreRef.current.contains(target),
      );

      // Викликаємо callback, якщо клік був поза цільовим елементом
      // та не всередині ігнорованих елементів
      if (isOutside && !isInsideIgnored) {
        callback();
      }
    };

    // Додаємо слухача події на document
    document.addEventListener("mousedown", handleClick);

    // Очищення при розмонтуванні
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [callback, ignoreRefs]);

  return ref as RefObject<T>;
}

export default useOutsideClick;
