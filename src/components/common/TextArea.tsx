import React, { forwardRef } from 'react';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ error, className = '', rows = 4, ...props }, ref) => {
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

    const combinedClasses = `${baseClasses} ${errorClasses} ${className}`;

    return (
      <div>
        <textarea ref={ref} rows={rows} className={combinedClasses} {...props} />
        
        {error && (
          <div className="mt-1 text-sm text-red-600">{error}</div>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

export default TextArea;