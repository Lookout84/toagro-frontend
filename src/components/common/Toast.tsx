import React, { useEffect, useState } from "react";
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from "lucide-react";

export interface ToastProps {
  id: string;
  message: string;
  type?: "success" | "error" | "warning" | "info";
  duration?: number;
  onClose: (id: string) => void;
}

/**
 * Компонент для відображення сповіщень (тостів)
 */
const Toast: React.FC<ToastProps> = ({
  id,
  message,
  type = "info",
  duration = 5000,
  onClose,
}) => {
  const [visible, setVisible] = useState(true);
  
  // Автоматичне закриття через вказаний час
  useEffect(() => {
    if (duration !== 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => onClose(id), 300); // Затримка для анімації
      }, duration);
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [duration, id, onClose]);
  
  // Варіанти іконок і кольорів для різних типів сповіщень
  const toastStyles = {
    success: {
      bg: "bg-green-100",
      border: "border-green-500",
      text: "text-green-800",
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    },
    error: {
      bg: "bg-red-100",
      border: "border-red-500",
      text: "text-red-800",
      icon: <AlertCircle className="w-5 h-5 text-red-500" />,
    },
    warning: {
      bg: "bg-yellow-100",
      border: "border-yellow-500",
      text: "text-yellow-800",
      icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    },
    info: {
      bg: "bg-blue-100",
      border: "border-blue-500",
      text: "text-blue-800",
      icon: <Info className="w-5 h-5 text-blue-500" />,
    },
  };
  
  const { bg, border, text, icon } = toastStyles[type];
  
  return (
    <div
      className={`
        w-full max-w-sm mb-4 p-4 
        rounded-lg shadow-lg border-l-4 
        ${bg} ${border} ${text}
        transform transition-all duration-300
        ${visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
      `}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3 pt-0.5">
          {icon}
        </div>
        
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(() => onClose(id), 300);
          }}
          className="ml-4 flex-shrink-0 text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label="Закрити"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default Toast;