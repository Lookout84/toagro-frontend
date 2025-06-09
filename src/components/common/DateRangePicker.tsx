import React, { useState, forwardRef } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { uk } from "date-fns/locale";
import { format } from "date-fns";
import { Calendar, X } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";

// Реєструємо українську локаль для календаря
registerLocale("uk", uk);

interface DateRange {
  from: Date | null;
  to: Date | null;
}

export interface DateRangePickerProps {
  /**
   * Значення діапазону дат
   */
  value: DateRange;
  
  /**
   * Функція зворотного виклику при зміні діапазону дат
   */
  onChange: (range: DateRange) => void;
  
  /**
   * Текст підказки для випадку, коли дати не вибрані
   */
  placeholderText?: string;
  
  /**
   * CSS класи для контейнера
   */
  className?: string;
  
  /**
   * Чи є компонент відключеним
   */
  disabled?: boolean;
  
  /**
   * Мінімальна дата, яку можна вибрати
   */
  minDate?: Date;
  
  /**
   * Максимальна дата, яку можна вибрати
   */
  maxDate?: Date;
  
  /**
   * Чи показувати кнопку очищення діапазону
   */
  showClearButton?: boolean;
}

/**
 * Компонент для вибору діапазону дат
 */
export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  placeholderText = "Виберіть діапазон дат",
  className = "",
  disabled = false,
  minDate,
  maxDate,
  showClearButton = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Форматуємо значення для відображення у полі вводу
  const getDisplayValue = () => {
    if (value.from && value.to) {
      return `${format(value.from, "dd.MM.yyyy")} - ${format(value.to, "dd.MM.yyyy")}`;
    } else if (value.from) {
      return `${format(value.from, "dd.MM.yyyy")} - ...`;
    } else if (value.to) {
      return `... - ${format(value.to, "dd.MM.yyyy")}`;
    }
    return placeholderText;
  };

  // Обробник зміни дати
  const handleChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    onChange({ from: start, to: end });
    
    // Якщо вибрано обидві дати, закриваємо календар
    if (start && end) {
      setTimeout(() => setIsOpen(false), 100);
    }
  };

  // Обробник очищення діапазону
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ from: null, to: null });
  };

  // Кастомний компонент для показу в полі вводу
  const CustomInput = forwardRef<HTMLDivElement, any>(({ value, onClick }, ref) => (
    <div
      ref={ref}
      onClick={disabled ? undefined : onClick}
      className={`relative flex items-center border rounded-md px-3 py-2 ${
        disabled
          ? "bg-gray-100 cursor-not-allowed text-gray-500"
          : "bg-white cursor-pointer hover:border-gray-400"
      } ${className}`}
    >
      <Calendar size={18} className="text-gray-500 mr-2" />
      <div className="flex-1 text-sm">{getDisplayValue()}</div>
      {showClearButton && value && (value.from || value.to) && (
        <button
          type="button"
          onClick={handleClear}
          className="text-gray-400 hover:text-gray-600"
          disabled={disabled}
        >
          <X size={16} />
        </button>
      )}
    </div>
  ));
  CustomInput.displayName = "DateRangePickerInput";

  return (
    <DatePicker
      selectsRange
      startDate={value.from}
      endDate={value.to}
      onChange={handleChange as (dates: [Date | null, Date | null]) => void}
      customInput={<CustomInput value={value} />}
      dateFormat="dd.MM.yyyy"
      locale="uk"
      {...(minDate ? { minDate } : {})}
      {...(maxDate ? { maxDate } : {})}
      disabled={disabled}
      open={isOpen}
      onInputClick={() => setIsOpen(true)}
      onClickOutside={() => setIsOpen(false)}
      isClearable={false}
      className="w-full"
      calendarClassName="bg-white shadow-lg border rounded-md"
      weekDayClassName={() => "text-gray-600 font-medium"}
      monthClassName={() => "font-medium"}
      dayClassName={(date) => 
        date.getDay() === 0 || date.getDay() === 6 
          ? "text-red-500" 
          : "text-gray-800"
      }
    />
  );
};

export default DateRangePicker;