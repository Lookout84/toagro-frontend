import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// Типи сповіщень
export type ToastType = "success" | "error" | "warning" | "info";

// Інтерфейс для параметрів сповіщення
export interface ToastProps {
  id?: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Інтерфейс для контексту сповіщень
interface ToastContextType {
  showToast: (props: ToastProps) => string;
  hideToast: (id: string) => void;
  clearToasts: () => void;
}

// Створення контексту
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Компонент окремого сповіщення
function Toast({
  type,
  title,
  message,
  action,
  onClose,
}: ToastProps & { onClose: () => void }): React.ReactElement {
  const toastConfig: Record<
    ToastType,
    {
      icon: React.ReactNode;
      bgColor: string;
      borderColor: string;
      textColor: string;
      iconColor: string;
    }
  > = {
    success: {
      icon: <CheckCircle size={20} />,
      bgColor: "bg-green-50",
      borderColor: "border-green-400",
      textColor: "text-green-800",
      iconColor: "text-green-500",
    },
    error: {
      icon: <AlertCircle size={20} />,
      bgColor: "bg-red-50",
      borderColor: "border-red-400",
      textColor: "text-red-800",
      iconColor: "text-red-500",
    },
    warning: {
      icon: <AlertTriangle size={20} />,
      bgColor: "bg-amber-50",
      borderColor: "border-amber-400",
      textColor: "text-amber-800",
      iconColor: "text-amber-500",
    },
    info: {
      icon: <Info size={20} />,
      bgColor: "bg-blue-50",
      borderColor: "border-blue-400",
      textColor: "text-blue-800",
      iconColor: "text-blue-500",
    },
  };

  const config = toastConfig[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`w-full max-w-sm rounded-lg shadow-lg border-l-4 ${config.borderColor} ${config.bgColor} p-4 mb-3`}
    >
      <div className="flex items-start">
        <div className={`mr-3 ${config.iconColor} flex-shrink-0 mt-0.5`}>
          {config.icon}
        </div>
        <div className="flex-grow">
          <h3 className={`font-semibold ${config.textColor}`}>{title}</h3>
          <p className={`mt-1 text-sm ${config.textColor}`}>{message}</p>
          {action && (
            <button
              onClick={action.onClick}
              className="mt-2 text-sm font-medium hover:underline text-blue-600"
            >
              {action.label}
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className={`ml-3 flex-shrink-0 ${config.textColor} hover:bg-opacity-10 hover:bg-gray-500 p-1 rounded`}
        >
          <X size={16} />
        </button>
      </div>
    </motion.div>
  );
}

// Провайдер для системи сповіщень
export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([]);

  // Приховати сповіщення
  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Показати нове сповіщення
  const showToast = useCallback(
    ({ id, type, title, message, duration = 5000, action }: ToastProps): string => {
      const toastId = id || Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [
        ...prev,
        { id: toastId, type, title, message, ...(action !== undefined ? { action } : {}) }
      ]);
      if (duration > 0) {
        setTimeout(() => {
          hideToast(toastId);
        }, duration);
      }
      return toastId;
    },
    [hideToast]
  );

  // Очистити всі сповіщення
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Контейнер для сповіщень (портал)
  const ToastContainer = () =>
    createPortal(
      <div className="fixed top-4 right-4 z-50 flex flex-col items-end">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              {...toast}
              onClose={() => hideToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>,
      document.body
    );

  return (
    <ToastContext.Provider value={{ showToast, hideToast, clearToasts }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

// Хук для використання системи сповіщень
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};