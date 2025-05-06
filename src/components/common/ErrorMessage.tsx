import React from "react";
import { AlertTriangle } from "lucide-react";

interface ErrorMessageProps {
  message: string;
  className?: string;
  variant?: "inline" | "block" | "alert";
}

/**
 * Компонент для відображення повідомлень про помилки
 * @param message Текст повідомлення
 * @param className Додаткові CSS класи
 * @param variant Варіант відображення (inline, block, alert)
 */
const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  className = "",
  variant = "inline",
}) => {
  if (!message) return null;

  // Inline варіант (для полів форми)
  if (variant === "inline") {
    return (
      <p className={`mt-1 text-sm text-red-500 ${className}`}>
        {message}
      </p>
    );
  }

  // Block варіант (для секцій)
  if (variant === "block") {
    return (
      <div className={`p-3 mb-4 text-sm text-red-700 bg-red-50 rounded-md ${className}`}>
        <p>{message}</p>
      </div>
    );
  }

  // Alert варіант (з іконкою)
  return (
    <div className={`p-4 mb-4 flex items-center text-sm text-red-700 bg-red-100 rounded-lg ${className}`}>
      <AlertTriangle className="flex-shrink-0 mr-2 w-5 h-5" />
      <span>{message}</span>
    </div>
  );
};

export default ErrorMessage;