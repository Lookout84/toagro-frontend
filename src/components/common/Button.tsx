import React, { forwardRef } from 'react';
import Loader from './Loader';

/**
 * Доступні варіанти стилів кнопки
 */
export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'danger' 
  | 'warning' 
  | 'info' 
  | 'outline'
  | 'link';

/**
 * Доступні розміри кнопки
 */
export type ButtonSize = 'small' | 'medium' | 'large';

/**
 * Властивості компонента Button
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Варіант стилю кнопки */
  variant?: ButtonVariant;
  /** Розмір кнопки */
  size?: ButtonSize;
  /** Показувати індикатор завантаження */
  loading?: boolean;
  /** Іконка для відображення перед текстом */
  icon?: React.ReactNode;
  /** Іконка для відображення після тексту */
  endIcon?: React.ReactNode;
  /** Розтягнути кнопку на всю доступну ширину */
  fullWidth?: boolean;
  /** Контент кнопки */
  children: React.ReactNode;
  /** Додатковий клас для стилізації */
  className?: string;
}

/**
 * Кнопка з різними варіантами стилізації
 * 
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>
 *   Натисніть мене
 * </Button>
 * 
 * <Button variant="danger" loading={isSubmitting}>
 *   Видалити
 * </Button>
 * 
 * <Button variant="outline" icon={<Edit size={16} />}>
 *   Редагувати
 * </Button>
 * ```
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'medium',
  loading = false,
  icon,
  endIcon,
  fullWidth = false,
  children,
  disabled,
  className = '',
  ...props
}, ref) => {
  // Стилі для різних варіантів кнопок
  const variantClasses = {
    primary: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 border border-transparent',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500 border border-transparent',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 border border-transparent',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 border border-transparent',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-500 border border-transparent',
    info: 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500 border border-transparent',
    outline: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    link: 'bg-transparent text-blue-600 hover:text-blue-800 hover:underline focus:ring-blue-500 border-0 shadow-none'
  };

  // Стилі для різних розмірів кнопок
  const sizeClasses = {
    small: 'px-2.5 py-1.5 text-xs',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type="button"
      disabled={isDisabled}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        inline-flex items-center justify-center
        font-medium rounded-md
        focus:outline-none focus:ring-2 focus:ring-offset-2
        transition-colors duration-200 ease-in-out
        ${variant !== 'link' ? 'shadow-sm' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <span className="mr-2"><Loader size="small" /></span>
          {children}
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
          {endIcon && <span className="ml-2">{endIcon}</span>}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;

// import React, { ReactNode } from "react";
// import { Loader2 } from "lucide-react";

// interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
//   variant?: "primary" | "secondary" | "outline" | "danger" | "ghost" | "link";
//   size?: "sm" | "md" | "lg";
//   isLoading?: boolean;
//   icon?: ReactNode;
//   iconPosition?: "left" | "right";
//   fullWidth?: boolean;
// }

// /**
//  * Універсальний компонент кнопки з різними варіантами відображення
//  */
// const Button: React.FC<ButtonProps> = ({
//   children,
//   variant = "primary",
//   size = "md",
//   isLoading = false,
//   icon,
//   iconPosition = "left",
//   fullWidth = false,
//   className = "",
//   disabled,
//   type = "button",
//   ...props
// }) => {
//   // Базові класи для різних варіантів кнопок
//   const variantClasses = {
//     primary: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
//     secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500",
//     outline: "bg-transparent border border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-500",
//     danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
//     ghost: "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
//     link: "bg-transparent text-green-600 hover:underline focus:ring-green-500 px-0",
//   };

//   // Класи для різних розмірів кнопок
//   const sizeClasses = {
//     sm: "px-3 py-1.5 text-sm",
//     md: "px-4 py-2",
//     lg: "px-6 py-3 text-lg",
//   };

//   // Відступи для іконок відповідно до розміру кнопки
//   const iconSpacing = {
//     sm: "mr-1",
//     md: "mr-2",
//     lg: "mr-2",
//   };
  
//   // Загальний клас для кнопки
//   const buttonBaseClass = `
//     flex items-center justify-center 
//     font-medium 
//     ${variant !== "link" ? "rounded-md" : ""} 
//     focus:outline-none focus:ring-2 focus:ring-offset-2
//     transition-colors
//     disabled:opacity-70 disabled:cursor-not-allowed
//     ${variantClasses[variant]}
//     ${variant !== "link" ? sizeClasses[size] : ""}
//     ${fullWidth ? "w-full" : ""}
//   `;
  
//   return (
//     <button
//       type={type}
//       className={`${buttonBaseClass} ${className}`}
//       disabled={disabled || isLoading}
//       {...props}
//     >
//       {isLoading && (
//         <Loader2 className="w-5 h-5 mr-2 animate-spin" />
//       )}
      
//       {!isLoading && icon && iconPosition === "left" && (
//         <span className={iconSpacing[size]}>
//           {icon}
//         </span>
//       )}
      
//       {children}
      
//       {!isLoading && icon && iconPosition === "right" && (
//         <span className={`ml-2`}>
//           {icon}
//         </span>
//       )}
//     </button>
//   );
// };

// export default Button;