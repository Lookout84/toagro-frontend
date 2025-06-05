import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const Select = forwardRef<HTMLDivElement, SearchableSelectProps>(
  ({ 
    options, 
    value, 
    onChange, 
    placeholder = 'Виберіть опцію', 
    searchPlaceholder = 'Пошук...', 
    error, 
    disabled = false,
    className = '',
  }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const selectRef = useRef<HTMLDivElement>(null);
    
    // Знаходимо обрану опцію
    const selectedOption = options.find(option => option.value === value);
    
    // Фільтруємо опції за пошуковим запитом
    const filteredOptions = options.filter(option => 
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Закриваємо селект при кліку зовні
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          selectRef.current && 
          !selectRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);
    
    const handleToggle = () => {
      if (!disabled) {
        setIsOpen(!isOpen);
        setSearchTerm('');
      }
    };
    
    const handleSelect = (option: SelectOption) => {
      onChange(option.value);
      setIsOpen(false);
      setSearchTerm('');
    };
    
    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange('');
    };
    
    const baseClasses = `
      relative w-full cursor-default 
      rounded-md border border-gray-300 
      bg-white py-2 pl-3 pr-10 
      text-left shadow-sm 
      focus:outline-none focus:ring-1 
      focus:ring-green-500 focus:border-green-500 
      sm:text-sm
    `;
    
    const errorClasses = error
      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
      : '';
    
    const disabledClasses = disabled
      ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
      : '';
    
    const combinedClasses = `${baseClasses} ${errorClasses} ${disabledClasses} ${className}`;
    
    return (
      <div ref={ref}>
        <div ref={selectRef} className="relative">
          {/* Головний елемент селекта */}
          <div
            className={combinedClasses}
            onClick={handleToggle}
          >
            <span className="block truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            
            <span className="absolute inset-y-0 right-0 flex items-center pr-2">
              {selectedOption && !disabled ? (
                <X
                  className="h-4 w-4 text-gray-400 hover:text-gray-500"
                  onClick={handleClear}
                />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </span>
          </div>
          
          {/* Випадаючий список опцій */}
          {isOpen && (
            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {/* Поле пошуку */}
              <div className="sticky top-0 z-10 bg-white px-3 py-2 border-b">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Список опцій */}
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-green-50 ${
                      option.value === value ? 'bg-green-50 text-green-700' : 'text-gray-900'
                    }`}
                    onClick={() => handleSelect(option)}
                  >
                    <span className={`block truncate ${option.value === value ? 'font-medium' : 'font-normal'}`}>
                      {option.label}
                    </span>
                  </div>
                ))
              ) : (
                <div className="relative cursor-default select-none py-2 px-3 text-gray-500">
                  Нічого не знайдено
                </div>
              )}
            </div>
          )}
        </div>
        
        {error && (
          <div className="mt-1 text-sm text-red-600">{error}</div>
        )}
      </div>
    );
  }
);

Select.displayName = 'SearchableSelect';

export default Select;
// import React, { forwardRef } from 'react';
// import { ChevronDown } from 'lucide-react';

// export interface SelectOption {
//   value: string;
//   label: string;
// }

// export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
//   options: SelectOption[];
//   value: string;
//   onChange: (value: string) => void;
//   placeholder?: string;
//   error?: string;
// }

// const Select = forwardRef<HTMLSelectElement, SelectProps>(
//   ({ options, value, onChange, placeholder, error, className = '', ...props }, ref) => {
//     const baseClasses = `
//       block w-full px-3 py-2 
//       border border-gray-300 
//       rounded-md shadow-sm 
//       focus:outline-none 
//       focus:ring-green-500 
//       focus:border-green-500 
//       appearance-none
//       bg-white
//       pr-10
//       sm:text-sm
//     `;

//     const errorClasses = error
//       ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
//       : '';

//     const combinedClasses = `${baseClasses} ${errorClasses} ${className}`;

//     const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//       onChange(e.target.value);
//     };

//     return (
//       <div className="relative">
//         <select
//           ref={ref}
//           value={value}
//           onChange={handleChange}
//           className={combinedClasses}
//           {...props}
//         >
//           {placeholder && (
//             <option value="" disabled>
//               {placeholder}
//             </option>
//           )}
          
//           {options.map((option) => (
//             <option key={option.value} value={option.value}>
//               {option.label}
//             </option>
//           ))}
//         </select>
        
//         <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
//           <ChevronDown className="h-4 w-4 text-gray-400" />
//         </div>
        
//         {error && (
//           <div className="mt-1 text-sm text-red-600">{error}</div>
//         )}
//       </div>
//     );
//   }
// );

// Select.displayName = 'Select';

// export default Select;