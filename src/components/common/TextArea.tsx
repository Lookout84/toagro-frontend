import React, { TextareaHTMLAttributes } from "react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Текст для відображення, коли поле порожнє
   */
  placeholder?: string;
  
  /**
   * Повідомлення про помилку для відображення під полем
   */
  error?: string;
  
  /**
   * Кількість рядків у полі введення
   */
  rows?: number;
  
  /**
   * CSS класи для контейнера
   */
  className?: string;
}

/**
 * Компонент поля для введення багаторядкового тексту
 */
const TextArea: React.FC<TextAreaProps> = ({
  placeholder,
  error,
  rows = 4,
  className = "",
  ...props
}) => {
  return (
    <div className={className}>
      <textarea
        className={`w-full px-3 py-2 text-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
        placeholder={placeholder}
        rows={rows}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default TextArea;

// import React, { forwardRef } from 'react';

// export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
//   error?: string;
// }

// const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
//   ({ error, className = '', rows = 4, ...props }, ref) => {
//     const baseClasses = `
//       block w-full px-3 py-2 
//       border border-gray-300 
//       rounded-md shadow-sm 
//       focus:outline-none 
//       focus:ring-green-500 
//       focus:border-green-500 
//       sm:text-sm
//     `;

//     const errorClasses = error
//       ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
//       : '';

//     const combinedClasses = `${baseClasses} ${errorClasses} ${className}`;

//     return (
//       <div>
//         <textarea ref={ref} rows={rows} className={combinedClasses} {...props} />
        
//         {error && (
//           <div className="mt-1 text-sm text-red-600">{error}</div>
//         )}
//       </div>
//     );
//   }
// );

// TextArea.displayName = 'TextArea';

// export default TextArea;