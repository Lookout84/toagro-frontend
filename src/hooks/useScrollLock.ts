import { useEffect } from "react";

/**
 * Хук для блокування прокрутки сторінки
 * @param isLocked - стан блокування прокрутки
 */
function useScrollLock(isLocked: boolean): void {
  useEffect(() => {
    // Рання перевірка на наявність window (SSR)
    if (typeof window === "undefined") return;

    // Оригінальний overflow стиль body
    const originalStyle = window.getComputedStyle(document.body).overflow;

    // Додаткові змінні для зберігання ширини прокрутки
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    const originalPaddingRight = window.getComputedStyle(
      document.body,
    ).paddingRight;

    if (isLocked) {
      // Запам'ятовуємо поточну позицію прокрутки
      const scrollY = window.scrollY;

      // Блокуємо прокрутку та додаємо padding, щоб уникнути стрибків
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${parseInt(originalPaddingRight) + scrollbarWidth}px`;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
    } else {
      // Відновлюємо прокрутку та позицію
      const scrollY = document.body.style.top;
      document.body.style.overflow = originalStyle;
      document.body.style.paddingRight = originalPaddingRight;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";

      // Відновлюємо позицію прокрутки
      window.scrollTo(0, parseInt(scrollY || "0") * -1);
    }

    // Очищення стилів при розмонтуванні
    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.paddingRight = originalPaddingRight;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
    };
  }, [isLocked]);
}

export default useScrollLock;
