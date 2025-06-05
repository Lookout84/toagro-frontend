import React, { useState, ReactElement } from 'react';

interface TabProps {
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
  id?: string;
}

/**
 * Компонент для окремої вкладки
 */
export const Tab: React.FC<TabProps> = ({ children }) => {
  return <>{children}</>;
};

export interface TabsProps {
  children: ReactElement<TabProps> | ReactElement<TabProps>[];
  defaultActiveTab?: number;
  onChange?: (index: number) => void;
  variant?: 'default' | 'boxed' | 'pills';
  fullWidth?: boolean;
  className?: string;
}

/**
 * Компонент для створення вкладок в інтерфейсі
 * 
 * @example
 * ```tsx
 * <Tabs defaultActiveTab={0}>
 *   <Tab title="Інформація">
 *     <p>Вміст першої вкладки</p>
 *   </Tab>
 *   <Tab title="Налаштування">
 *     <p>Вміст другої вкладки</p>
 *   </Tab>
 * </Tabs>
 * ```
 */
const Tabs: React.FC<TabsProps> = ({ 
  children, 
  defaultActiveTab = 0, 
  onChange,
  variant = 'default',
  fullWidth = false,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState(defaultActiveTab);
  
  // Перевіряємо, чи children є масивом
  const childrenArray = React.Children.toArray(children) as ReactElement<TabProps>[];
  
  // Отримуємо заголовки вкладок
  const tabTitles = childrenArray.map(child => ({
    title: child.props.title,
    disabled: child.props.disabled || false,
    id: child.props.id
  }));
  
  const handleTabChange = (index: number) => {
    if (tabTitles[index]?.disabled) return;
    
    setActiveTab(index);
    if (onChange) {
      onChange(index);
    }
  };

  // Стилі для різних варіантів відображення вкладок
  const tabsContainerStyles = {
    default: 'border-b border-gray-200',
    boxed: 'border-b border-gray-200',
    pills: ''
  };

  const tabItemStyles = {
    default: (isActive: boolean, isDisabled: boolean) => `
      whitespace-nowrap py-3 px-5 border-b-2 font-medium text-sm
      ${isActive
        ? 'border-green-500 text-green-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
      ${isDisabled
        ? 'opacity-50 cursor-not-allowed'
        : 'cursor-pointer'}
    `,
    boxed: (isActive: boolean, isDisabled: boolean) => `
      whitespace-nowrap py-2 px-4 font-medium text-sm rounded-t-md
      ${isActive
        ? 'bg-white border border-gray-200 border-b-0 text-green-600'
        : 'bg-gray-50 text-gray-500 hover:text-gray-700 hover:bg-gray-100'}
      ${isDisabled
        ? 'opacity-50 cursor-not-allowed'
        : 'cursor-pointer'}
    `,
    pills: (isActive: boolean, isDisabled: boolean) => `
      whitespace-nowrap py-2 px-4 font-medium text-sm rounded-full
      ${isActive
        ? 'bg-green-100 text-green-700'
        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}
      ${isDisabled
        ? 'opacity-50 cursor-not-allowed'
        : 'cursor-pointer'}
    `
  };

  const tabsListStyles = fullWidth ? 'flex w-full' : 'flex';
  const tabItemWidthStyles = fullWidth ? 'flex-1 text-center' : '';
  
  return (
    <div className={className}>
      <div className={tabsContainerStyles[variant]}>
        <nav className={tabsListStyles} aria-label="Tabs">
          {tabTitles.map((tab, index) => (
            <div 
              key={tab.id || `tab-${index}`} 
              className={tabItemWidthStyles}
            >
              <button
                onClick={() => handleTabChange(index)}
                className={tabItemStyles[variant](activeTab === index, tab.disabled)}
                aria-current={activeTab === index ? 'page' : undefined}
                disabled={tab.disabled}
                type="button"
              >
                {tab.title}
              </button>
            </div>
          ))}
        </nav>
      </div>
      <div className="py-4">
        {childrenArray[activeTab]}
      </div>
    </div>
  );
};

export default Tabs;