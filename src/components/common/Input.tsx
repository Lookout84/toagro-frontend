import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, icon, iconPosition = 'left', className = '', ...props }, ref) => {
    const baseClasses = `
      block w-full px-3 py-2 
      border border-gray-300 
      rounded-md shadow-sm 
      focus:outline-none 
      focus:ring-green-500 
      focus:border-green-500 
      sm:text-sm
    `;

    const errorClasses = error
      ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
      : '';

    const iconClasses = icon
      ? iconPosition === 'left'
        ? 'pl-10'
        : 'pr-10'
      : '';

    const combinedClasses = `${baseClasses} ${errorClasses} ${iconClasses} ${className}`;

    return (
      <div className="relative">
        {icon && (
          <div
            className={`absolute inset-y-0 ${
              iconPosition === 'left' ? 'left-0' : 'right-0'
            } flex items-center ${
              iconPosition === 'left' ? 'pl-3' : 'pr-3'
            } pointer-events-none`}
          >
            {icon}
          </div>
        )}
        
        <input ref={ref} className={combinedClasses} {...props} />
        
        {error && (
          <div className="mt-1 text-sm text-red-600">{error}</div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;