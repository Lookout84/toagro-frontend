import React, { ReactNode } from "react";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
  helperClassName?: string;
}

/**
 * Компонент для відображення поля вводу форми
 */
const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  helper,
  leftIcon,
  rightIcon,
  fullWidth = true,
  containerClassName = "",
  labelClassName = "",
  inputClassName = "",
  errorClassName = "",
  helperClassName = "",
  id,
  className,
  ...props
}) => {
  const inputId = id || `input-${props.name || Math.random().toString(36).substring(2, 9)}`;
  
  // Базові класи
  const containerBaseClass = fullWidth ? "w-full" : "";
  const labelBaseClass = "block text-sm font-medium text-gray-700 mb-1";
  const inputBaseClass = `px-4 py-2 border ${
    error ? "border-red-500" : "border-gray-300"
  } rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
    leftIcon ? "pl-10" : ""
  } ${rightIcon ? "pr-10" : ""}`;
  const errorBaseClass = "mt-1 text-sm text-red-500";
  const helperBaseClass = "mt-1 text-sm text-gray-500";
  
  return (
    <div className={`mb-4 ${containerBaseClass} ${containerClassName}`}>
      {label && (
        <label 
          htmlFor={inputId} 
          className={`${labelBaseClass} ${labelClassName}`}
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        
        <input
          id={inputId}
          className={`${inputBaseClass} ${fullWidth ? "w-full" : ""} ${className || ""} ${inputClassName}`}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {rightIcon}
          </div>
        )}
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

export default FormInput;