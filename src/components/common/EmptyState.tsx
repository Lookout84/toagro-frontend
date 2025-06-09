import React, { ReactNode } from "react";
import { FileQuestion } from "lucide-react";

interface EmptyStateProps {
  /**
   * Іконка для відображення (за замовчуванням FileQuestion)
   */
  icon?: ReactNode;
  
  /**
   * Заголовок повідомлення
   */
  title: string;
  
  /**
   * Детальний опис або інструкція
   */
  description?: string;
  
  /**
   * Дія, яку можна виконати (кнопка або інший елемент)
   */
  action?: ReactNode;
  
  /**
   * Додаткові CSS класи
   */
  className?: string;
  
  /**
   * Розмір компонента
   */
  size?: "small" | "medium" | "large";
}

/**
 * Компонент для відображення стану порожнього списку або відсутності даних
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = "",
  size = "medium",
}) => {
  // Визначаємо класи в залежності від розміру
  const sizeClasses = {
    small: "py-4",
    medium: "py-8",
    large: "py-16",
  };
  
  // Визначаємо розмір іконки в залежності від розміру компонента
  const iconSize = {
    small: 32,
    medium: 48,
    large: 64,
  };
  
  // Значення розміру для іконки за замовчуванням
  const defaultIconSize = iconSize[size];
  
  return (
    <div className={`flex flex-col items-center justify-center text-center ${sizeClasses[size]} ${className}`}>
      <div className="mb-4 text-gray-400">
        {icon || <FileQuestion size={defaultIconSize} />}
      </div>
      
      <h3 className={`font-semibold text-gray-900 ${size === "large" ? "text-xl" : size === "medium" ? "text-lg" : "text-base"}`}>
        {title}
      </h3>
      
      {description && (
        <p className={`mt-2 text-gray-500 max-w-md ${size === "small" ? "text-sm" : "text-base"}`}>
          {description}
        </p>
      )}
      
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

export default EmptyState;