import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import Button from "../common/Button";

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Закриття при кліку на оверлей
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Закриття по Esc
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
      // Заборона прокрутки фону коли відкрито
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Анімація при відкритті/закритті
  useEffect(() => {
    if (isOpen && drawerRef.current) {
      drawerRef.current.classList.remove("-translate-x-full");
    } else if (!isOpen && drawerRef.current) {
      drawerRef.current.classList.add("-translate-x-full");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start transition-opacity"
      onClick={handleOverlayClick}
    >
      <div
        ref={drawerRef}
        className="bg-white h-full w-4/5 max-w-sm overflow-auto shadow-xl transform -translate-x-full transition-transform duration-300 ease-in-out"
      >
        <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
          <div className="flex justify-between items-center p-4">
            <h3 className="text-lg font-semibold">{title}</h3>
            <Button
              variant="ghost"
              size="sm"
              icon={<X size={18} />}
              onClick={onClose}
              aria-label="Закрити"
              className="p-1"
            />
          </div>
        </div>
        
        <div className="p-4">
          {children}
        </div>
        
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <Button 
            variant="primary" 
            className="w-full"
            onClick={onClose}
          >
            Застосувати фільтри
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MobileFilterDrawer;