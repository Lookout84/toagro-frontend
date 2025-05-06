import React, { ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost" | "link";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

/**
 * Універсальний компонент кнопки з різними варіантами відображення
 */
const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  icon,
  iconPosition = "left",
  fullWidth = false,
  className = "",
  disabled,
  type = "button",
  ...props
}) => {
  // Базові класи для різних варіантів кнопок
  const variantClasses = {
    primary: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500",
    outline: "bg-transparent border border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
    link: "bg-transparent text-green-600 hover:underline focus:ring-green-500 px-0",
  };

  // Класи для різних розмірів кнопок
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };

  // Відступи для іконок відповідно до розміру кнопки
  const iconSpacing = {
    sm: "mr-1",
    md: "mr-2",
    lg: "mr-2",
  };
  
  // Загальний клас для кнопки
  const buttonBaseClass = `
    flex items-center justify-center 
    font-medium 
    ${variant !== "link" ? "rounded-md" : ""} 
    focus:outline-none focus:ring-2 focus:ring-offset-2
    transition-colors
    disabled:opacity-70 disabled:cursor-not-allowed
    ${variantClasses[variant]}
    ${variant !== "link" ? sizeClasses[size] : ""}
    ${fullWidth ? "w-full" : ""}
  `;
  
  return (
    <button
      type={type}
      className={`${buttonBaseClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
      )}
      
      {!isLoading && icon && iconPosition === "left" && (
        <span className={iconSpacing[size]}>
          {icon}
        </span>
      )}
      
      {children}
      
      {!isLoading && icon && iconPosition === "right" && (
        <span className={`ml-2`}>
          {icon}
        </span>
      )}
    </button>
  );
};

export default Button;