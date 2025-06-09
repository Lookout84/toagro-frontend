import React, { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useOnClickOutside } from "../../hooks/useOnClickOutside";

export interface DropdownProps {
  /**
   * Текст або елемент, який відображається на кнопці-тригері
   */
  trigger: ReactNode;
  
  /**
   * Елементи випадаючого меню (рекомендовано використовувати DropdownItem)
   */
  children: ReactNode;
  
  /**
   * Вирівнювання меню відносно тригера
   */
  align?: "left" | "right";
  
  /**
   * CSS класи для кореневого елемента
   */
  className?: string;
  
  /**
   * Іконка, яка відображається у кнопці-тригері (за замовчуванням ChevronDown)
   */
  icon?: ReactNode;
  
  /**
   * Ширина меню
   */
  width?: "auto" | "full";
  
  /**
   * Колір кнопки-тригера
   */
  buttonVariant?: "default" | "outline" | "ghost";
}

/**
 * Компонент випадаючого меню
 */
export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  children,
  align = "left",
  className = "",
  icon,
  width = "auto",
  buttonVariant = "default",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useOnClickOutside(dropdownRef as React.RefObject<HTMLDivElement>, () => setIsOpen(false));
  
  // Закриваємо дропдаун при натисканні Escape
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    
    window.addEventListener("keydown", handleEsc);
    
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);
  
  // Стилі для кнопки-тригера в залежності від варіанту
  const buttonStyles = {
    default: "bg-primary-600 text-white hover:bg-primary-700 border border-primary-600",
    outline: "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100 border-none",
  };
  
  // Стилі для меню в залежності від вирівнювання та ширини
  const menuStyles = {
    left: "left-0",
    right: "right-0",
    auto: "min-w-[200px]",
    full: "w-full",
  };
  
  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-between px-4 py-2 text-sm font-medium rounded-md ${
          buttonStyles[buttonVariant]
        }`}
      >
        {trigger}
        {icon || <ChevronDown size={16} className="ml-2" />}
      </button>
      
      {isOpen && (
        <div
          className={`absolute z-10 mt-2 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${
            menuStyles[align]
          } ${menuStyles[width]}`}
        >
          <div className="py-1">{children}</div>
        </div>
      )}
    </div>
  );
};

export interface DropdownItemProps {
  /**
   * Функція, яка викликається при натисканні на елемент
   */
  onClick?: () => void;
  
  /**
   * Текст або елемент, який відображається в елементі меню
   */
  children: ReactNode;
  
  /**
   * Іконка для елемента меню
   */
  icon?: ReactNode;
  
  /**
   * Чи елемент є активним
   */
  active?: boolean;
  
  /**
   * Чи елемент є відключеним
   */
  disabled?: boolean;
  
  /**
   * CSS класи для елемента
   */
  className?: string;
}

/**
 * Компонент елемента випадаючого меню
 */
export const DropdownItem: React.FC<DropdownItemProps> = ({
  onClick,
  children,
  icon,
  active = false,
  disabled = false,
  className = "",
}) => {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };
  
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`flex w-full items-center px-4 py-2 text-sm ${
        active
          ? "bg-gray-100 text-gray-900"
          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
      } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"} ${className}`}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};