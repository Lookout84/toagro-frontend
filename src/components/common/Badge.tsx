import React from "react";
import classNames from "classnames";

// Типи кольорів для бейджів
export type BadgeColor =
  | "gray"
  | "green"
  | "red"
  | "yellow"
  | "blue"
  | "orange"
  | "indigo"
  | "purple"
  | "pink";

// Властивості компонента Badge
export interface BadgeProps {
  /**
   * Колір бейджа
   */
  color?: BadgeColor;

  /**
   * Вміст бейджа
   */
  children: React.ReactNode;

  /**
   * Клас для додаткового стилізування
   */
  className?: string;

  /**
   * Розмір бейджа: 'small', 'medium' або 'large'
   */
  size?: "small" | "medium" | "large";

  /**
   * Додає іконку перед текстом бейджа
   */
  icon?: React.ReactNode;

  /**
   * Визначає, чи має бейдж заокруглену форму
   */
  rounded?: boolean;

  /**
   * Визначає, чи має бейдж прозорий фон
   */
  outline?: boolean;
}

/**
 * Компонент Badge - використовується для відображення статусів, міток та тегів
 * в інтерфейсі програми. Може бути різних кольорів та розмірів.
 */
const Badge: React.FC<BadgeProps> = ({
  color = "gray",
  children,
  className = "",
  size = "medium",
  icon,
  rounded = false,
  outline = false,
}) => {
  // Базові стилі для всіх бейджів
  const baseClasses = "inline-flex items-center font-medium";

  // Стилі для розмірів
  const sizeClasses = {
    small: "text-xs px-2 py-0.5",
    medium: "text-sm px-2.5 py-0.5",
    large: "text-sm px-3 py-1",
  };

  // Стилі для різних кольорів із заливкою
  const colorClasses = {
    gray: "bg-gray-100 text-gray-800",
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
    yellow: "bg-yellow-100 text-yellow-800",
    blue: "bg-blue-100 text-blue-800",
    orange: "bg-orange-100 text-orange-800",
    indigo: "bg-indigo-100 text-indigo-800",
    purple: "bg-purple-100 text-purple-800",
    pink: "bg-pink-100 text-pink-800",
  };

  // Стилі для різних кольорів з прозорим фоном (outline)
  const outlineClasses = {
    gray: "bg-transparent text-gray-600 border border-gray-300",
    green: "bg-transparent text-green-600 border border-green-300",
    red: "bg-transparent text-red-600 border border-red-300",
    yellow: "bg-transparent text-yellow-600 border border-yellow-300",
    blue: "bg-transparent text-blue-600 border border-blue-300",
    orange: "bg-transparent text-orange-600 border border-orange-300",
    indigo: "bg-transparent text-indigo-600 border border-indigo-300",
    purple: "bg-transparent text-purple-600 border border-purple-300",
    pink: "bg-transparent text-pink-600 border border-pink-300",
  };

  // Стилі для заокруглення
  const roundedClasses = rounded ? "rounded-full" : "rounded";

  // Визначаємо остаточні класи
  const badgeClasses = classNames(
    baseClasses,
    sizeClasses[size],
    outline ? outlineClasses[color] : colorClasses[color],
    roundedClasses,
    className
  );

  return (
    <span className={badgeClasses}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </span>
  );
};

export default Badge;

// import React from 'react';

// export type BadgeColor =
//   | 'gray'
//   | 'red'
//   | 'yellow'
//   | 'green'
//   | 'blue'
//   | 'indigo'
//   | 'purple'
//   | 'pink';

// interface BadgeProps {
//   children: React.ReactNode;
//   color?: BadgeColor;
//   className?: string;
// }

// const Badge: React.FC<BadgeProps> = ({
//   children,
//   color = 'gray',
//   className = '',
// }) => {
//   const colorClasses = {
//     gray: 'bg-gray-100 text-gray-800',
//     red: 'bg-red-100 text-red-800',
//     yellow: 'bg-yellow-100 text-yellow-800',
//     green: 'bg-green-100 text-green-800',
//     blue: 'bg-blue-100 text-blue-800',
//     indigo: 'bg-indigo-100 text-indigo-800',
//     purple: 'bg-purple-100 text-purple-800',
//     pink: 'bg-pink-100 text-pink-800',
//   };

//   return (
//     <span
//       className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]} ${className}`}
//     >
//       {children}
//     </span>
//   );
// };

// export default Badge;
