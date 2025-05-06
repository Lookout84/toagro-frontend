import React from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helper?: string;
  fullWidth?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  selectClassName?: string;
  errorClassName?: string;
  helperClassName?: string;
  onChange?: (value: string) => void;
}

/**
 * Компонент для відображення випадаючого списку
 */
const FormSelect: React.FC<FormSelectProps> = ({
  label,
  options,
  error,
  helper,
  fullWidth = true,
  containerClassName = "",
  labelClassName = "",
  selectClassName = "",
  errorClassName = "",
  helperClassName = "",
  id,
  className,
  onChange,
  ...props
}) => {
  const selectId = id || `select-${props.name || Math.random().toString(36).substring(2, 9)}`;
  
  // Базові класи
  const containerBaseClass = fullWidth ? "w-full" : "";
  const labelBaseClass = "block text-sm font-medium text-gray-700 mb-1";
  const selectBaseClass = `appearance-none px-4 py-2 border ${
    error ? "border-red-500" : "border-gray-300"
  } rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 pr-10`;
  const errorBaseClass = "mt-1 text-sm text-red-500";
  const helperBaseClass = "mt-1 text-sm text-gray-500";
  
  // Обробник зміни значення
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };
  
  return (
    <div className={`mb-4 ${containerBaseClass} ${containerClassName}`}>
      {label && (
        <label 
          htmlFor={selectId} 
          className={`${labelBaseClass} ${labelClassName}`}
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        <select
          id={selectId}
          className={`${selectBaseClass} ${fullWidth ? "w-full" : ""} ${className || ""} ${selectClassName}`}
          onChange={handleChange}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown size={18} className="text-gray-400" />
        </div>
      </div>
      
      {error && (
        <p className={`${errorBaseClass} ${errorClassName}`}>
          {error}
        </p>
      )}
      
      {helper && !error && (
        <p className={`${helperBaseClass} ${helperClassName}`}>
          {helper}
        </p>
      )}
    </div>
  );
}

export default FormSelect;