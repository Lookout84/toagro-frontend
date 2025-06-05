import React, { forwardRef } from 'react';
import ReactDatePicker, { DatePickerProps as ReactDatePickerProps } from 'react-datepicker';
import { CalendarIcon } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';

// Локалізація для українського формату дати
import { registerLocale } from 'react-datepicker';
import { uk } from 'date-fns/locale/uk';
registerLocale('uk', uk);

interface DatePickerProps extends Omit<ReactDatePickerProps, 'onChange' | 'selectsMultiple'> {
  error?: string;
  onChange: (date: Date | null) => void;
  label?: string;
  fullWidth?: boolean;
}

const DatePicker = forwardRef<ReactDatePicker, DatePickerProps>(
  ({ 
    error, 
    onChange, 
    selected, 
    className = '', 
    label,
    fullWidth = true,
    ...props 
  }, _ref) => {
    const handleChange = (date: Date | Date[] | null) => {
      if (Array.isArray(date)) {
        onChange(date[0] ?? null);
      } else {
        onChange(date);
      }
    };

    const CustomInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
      ({ value, onClick, onChange, placeholder }, inputRef) => (
        <div className="relative">
          <input
            ref={inputRef}
            onClick={onClick}
            onChange={onChange}
            value={value}
            placeholder={placeholder}
            readOnly
            className={`
              block ${fullWidth ? 'w-full' : ''} px-3 py-2 
              border ${error ? 'border-red-300' : 'border-gray-300'} 
              rounded-md shadow-sm pr-10
              focus:outline-none 
              focus:ring-green-500 
              focus:border-green-500 
              sm:text-sm
              ${error ? 'text-red-900 placeholder-red-300' : 'text-gray-900'}
              ${className}
            `}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      )
    );

    CustomInput.displayName = 'CustomInput';

    return (
      <div>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        
        <ReactDatePicker
          locale="uk"
          dateFormat="dd.MM.yyyy"
          selected={selected}
          onChange={handleChange}
          customInput={<CustomInput />}
          wrapperClassName={fullWidth ? 'w-full' : ''}
          {...props}
        />
        
        {error && (
          <div className="mt-1 text-sm text-red-600">{error}</div>
        )}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';

export default DatePicker;