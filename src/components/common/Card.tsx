import React, { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string | ReactNode;
  footer?: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  bordered?: boolean;
  elevated?: boolean;
  onClick?: () => void;
}

/**
 * Компонент для відображення карток та панелей
 */
const Card: React.FC<CardProps> = ({
  children,
  className = "",
  title,
  footer,
  padding = "md",
  bordered = true,
  elevated = false,
  onClick,
}) => {
  // Базові класи
  const cardBaseClass = `
    bg-white 
    rounded-lg 
    overflow-hidden
    ${bordered ? "border border-gray-200" : ""}
    ${elevated ? "shadow-sm" : ""}
    ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
  `;
  
  // Класи для різних розмірів відступів
  const paddingClasses = {
    none: "",
    sm: "p-3",
    md: "p-6",
    lg: "p-8",
  };
  
  return (
    <div 
      className={`${cardBaseClass} ${className}`} 
      onClick={onClick}
    >
      {title && (
        <div className={`border-b border-gray-200 ${paddingClasses[padding]}`}>
          {typeof title === "string" ? (
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          ) : (
            title
          )}
        </div>
      )}
      
      <div className={`${paddingClasses[padding]}`}>
        {children}
      </div>
      
      {footer && (
        <div className={`border-t border-gray-200 ${paddingClasses[padding]}`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;