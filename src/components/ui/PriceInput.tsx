import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { formatPriceWithSymbol, getCurrencySymbol } from '../../utils/formatters';

interface PriceInputProps {
  price: string;
  currency: "UAH" | "USD" | "EUR";
  priceType: "NETTO" | "BRUTTO";
  vatIncluded: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  error?: string;
}

const PriceInput: React.FC<PriceInputProps> = ({
  price,
  currency,
  priceType,
  vatIncluded,
  onChange,
  error,
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Функція для форматування числа з пробілами
  const formatNumberWithSpaces = (value: string): string => {
    // Видаляємо всі символи окрім цифр
    const cleanValue = value.replace(/\D/g, '');
    
    // Додаємо пробіли кожні 3 цифри з кінця
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Функція для очищення форматованого числа
  const cleanFormattedNumber = (value: string): string => {
    return value.replace(/\s/g, '');
  };

  // Оновлюємо відображення при зміні пропса price
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(price ? formatNumberWithSpaces(price) : '');
    }
  }, [price, isFocused]);

  // Обробка введення
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatNumberWithSpaces(value);
    const cleanValue = cleanFormattedNumber(value);
    
    setDisplayValue(formattedValue);
    
    // Створюємо подію з очищеним значенням для батьківського компонента
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        value: cleanValue,
        name: 'price'
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(syntheticEvent);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // При втраті фокусу оновлюємо відображення
    setDisplayValue(price ? formatNumberWithSpaces(price) : '');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Дозволяємо тільки цифри, Backspace, Delete, Tab, Enter, стрілки
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'
    ];
    
    if (!allowedKeys.includes(e.key) && !/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  // Розрахунок ціни з/без ПДВ для підказки
  const getCalculatedPrices = () => {
    if (!price || isNaN(Number(price))) return null;
    
    const numPrice = Number(price);
    const vatRate = 0.2; // 20% ПДВ
    
    if (priceType === 'NETTO') {
      const bruttoPrice = Math.round(numPrice * (1 + vatRate));
      return {
        netto: numPrice,
        brutto: bruttoPrice,
        vat: bruttoPrice - numPrice
      };
    } else {
      const nettoPrice = Math.round(numPrice / (1 + vatRate));
      return {
        netto: nettoPrice,
        brutto: numPrice,
        vat: numPrice - nettoPrice
      };
    }
  };

  const calculatedPrices = getCalculatedPrices();

  return (
    <div className="space-y-3">
      <label
        htmlFor="price"
        className="block text-sm font-medium text-gray-700"
      >
        Ціна *
      </label>
      
      {/* Основне поле введення ціни */}
      <div className="relative">
        <div className="flex rounded-md shadow-sm">
          <div className="relative flex-1">
            <input
              type="text"
              id="price"
              name="price"
              value={displayValue}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="Наприклад: 1 000 000"
              className={`block w-full px-4 py-3 border ${
                error ? "border-red-500" : "border-gray-300"
              } rounded-l-md text-lg font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500`}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-gray-500 text-lg font-medium">
                {getCurrencySymbol(currency)}
              </span>
            </div>
          </div>
          
          {/* Селектор валюти */}
          <div className="relative">
            <select
              id="currency"
              name="currency"
              value={currency}
              onChange={onChange}
              className="appearance-none h-full px-4 py-3 border-l-0 border-t border-r-0 border-b border-gray-300 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 rounded-r-md"
            >
              <option value="UAH">UAH</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ChevronDown size={16} className="text-gray-400" />
            </div>
          </div>
        </div>
        
        {/* Підказка з форматуванням */}
        {price && !error && (
          <div className="mt-1 text-xs text-green-600 font-medium">
            ✓ Буде відображатися як: {formatPriceWithSymbol(price, currency)}
          </div>
        )}
        
        {!price && !error && (
          <div className="mt-1 text-xs text-gray-400">
            💡 Вводьте тільки цифри, пробіли додаються автоматично
          </div>
        )}
        
        {/* Швидкі кнопки для популярних цін */}
        {!price && (
          <div className="mt-2">
            <div className="text-xs text-gray-500 mb-1">Швидкий вибір:</div>
            <div className="flex flex-wrap gap-1">
              {['100000', '500000', '1000000', '2000000', '5000000'].map((quickPrice) => (
                <button
                  key={quickPrice}
                  type="button"
                  onClick={() => {
                    const formattedValue = formatNumberWithSpaces(quickPrice);
                    setDisplayValue(formattedValue);
                    const syntheticEvent = {
                      target: { value: quickPrice, name: 'price' }
                    } as React.ChangeEvent<HTMLInputElement>;
                    onChange(syntheticEvent);
                  }}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border text-gray-600 transition-colors"
                >
                  {formatPriceWithSymbol(quickPrice, currency)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Тип ціни і ПДВ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Тип ціни */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Тип ціни
          </label>
          <div className="flex space-x-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="priceType"
                value="NETTO"
                checked={priceType === "NETTO"}
                onChange={onChange}
                className="mr-2 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm">Нетто (без ПДВ)</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="priceType"
                value="BRUTTO"
                checked={priceType === "BRUTTO"}
                onChange={onChange}
                className="mr-2 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm">Брутто (з ПДВ)</span>
            </label>
          </div>
        </div>

        {/* ПДВ чекбокс */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Додатково
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="vatIncluded"
              name="vatIncluded"
              checked={vatIncluded}
              onChange={onChange}
              className="mr-2 text-green-600 focus:ring-green-500 rounded"
            />
            <span className="text-sm">Можлива оплата з ПДВ</span>
          </label>
        </div>
      </div>

      {/* Розрахунок ПДВ */}
      {calculatedPrices && (
        <div className="bg-gray-50 rounded-md p-3 text-xs">
          <h4 className="font-medium text-gray-700 mb-2">📊 Розрахунок ПДВ (20%):</h4>
          <div className="grid grid-cols-3 gap-2 text-gray-600">
            <div>
              <span className="block font-medium">Нетто:</span>
              <span>{formatPriceWithSymbol(String(calculatedPrices.netto), currency)}</span>
            </div>
            <div>
              <span className="block font-medium">ПДВ:</span>
              <span>{formatPriceWithSymbol(String(calculatedPrices.vat), currency)}</span>
            </div>
            <div>
              <span className="block font-medium">Брутто:</span>
              <span className="text-green-600 font-medium">{formatPriceWithSymbol(String(calculatedPrices.brutto), currency)}</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 flex items-center">
          <span className="mr-1">⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
};

export default PriceInput;