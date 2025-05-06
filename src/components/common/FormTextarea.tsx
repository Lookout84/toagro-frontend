import React from "react";

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
  fullWidth?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  textareaClassName?: string;
  errorClassName?: string;
  helperClassName?: string;
}

/**
 * Компонент для відображення текстового поля форми (textarea)
 */
const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  error,
  helper,
  fullWidth = true,
  containerClassName = "",
  labelClassName = "",
  textareaClassName = "",
  errorClassName = "",
  helperClassName = "",
  id,
  className,
  ...props
}) => {
  const textareaId = id || `textarea-${props.name || Math.random().toString(36).substring(2, 9)}`;
  
  // Базові класи
  const containerBaseClass = fullWidth ? "w-full" : "";
  const labelBaseClass = "block text-sm font-medium text-gray-700 mb-1";
  const textareaBaseClass = `px-4 py-2 border ${
    error ? "border-red-500" : "border-gray-300"
  } rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500`;
  const errorBaseClass = "mt-1 text-sm text-red-500";
  const helperBaseClass = "mt-1 text-sm text-gray-500";
  
  return (
    <div className={`mb-4 ${containerBaseClass} ${containerClassName}`}>
      {label && (
        <label 
          htmlFor={textareaId} 
          className={`${labelBaseClass} ${labelClassName}`}
        >
          {label}
        </label>
      )}
      
      <textarea
        id={textareaId}
        className={`${textareaBaseClass} ${fullWidth ? "w-full" : ""} ${className || ""} ${textareaClassName}`}
        {...props}
      />
      
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

export default FormTextarea;