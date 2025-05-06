import React, { ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { useScrollLock } from "../../hooks";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string | ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

/**
 * Компонент модального вікна
 */
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  closeOnOverlayClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  className = "",
}) => {
  // Використовуємо хук для блокування прокрутки сторінки
  useScrollLock(isOpen);
  
  // Розміри модального вікна
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-4xl",
  };
  
  // Обробка натискання клавіші Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (isOpen && closeOnEsc && e.key === "Escape") {
        onClose();
      }
    };
    
    window.addEventListener("keydown", handleEsc);
    
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, closeOnEsc, onClose]);
  
  // Закриття модального вікна при кліку на оверлей
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };
  
  if (!isOpen) {
    return null;
  }
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div 
        className={`bg-white rounded-lg shadow-xl overflow-hidden w-full ${sizeClasses[size]} ${className}`}
        role="document"
      >
        {/* Заголовок */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {title && (
              <h3 id="modal-title" className="text-lg font-medium text-gray-900">
                {title}
              </h3>
            )}
            
            {showCloseButton && (
              <button
                type="button"
                className="p-1 text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={onClose}
                aria-label="Закрити"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}
        
        {/* Вміст */}
        <div className="p-6">
          {children}
        </div>
        
        {/* Футер */}
        {footer && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;