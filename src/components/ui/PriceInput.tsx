import React from 'react';
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
  return (
    <div>
      <label
        htmlFor="price"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Ціна *
      </label>
      <div className="flex">
        <input
          type="number"
          id="price"
          name="price"
          value={price}
          onChange={onChange}
          placeholder={`Наприклад: 1000000 ${getCurrencySymbol(currency)}`}
          min="0"
          step="1"
          className={`w-2/4 px-4 py-2 border ${
            error ? "border-red-500" : "border-gray-300"
          } rounded-l-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500`}
        />
        <div className="relative w-1/4">
          <select
            id="currency"
            name="currency"
            value={currency}
            onChange={onChange}
            className="appearance-none w-full h-full px-3 py-2 border-l-0 border border-gray-300 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          >
            <option value="UAH">{getCurrencySymbol("UAH")} UAH</option>
            <option value="USD">{getCurrencySymbol("USD")} USD</option>
            <option value="EUR">{getCurrencySymbol("EUR")} EUR</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown size={18} className="text-gray-400" />
          </div>
        </div>
        <div className="relative w-1/4">
          <select
            id="priceType"
            name="priceType"
            value={priceType}
            onChange={onChange}
            className="appearance-none w-full h-full px-3 py-2 border-l-0 border border-gray-300 bg-gray-50 rounded-none focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          >
            <option value="NETTO">Нетто (без ПДВ)</option>
            <option value="BRUTTO">Брутто (з ПДВ)</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown size={18} className="text-gray-400" />
          </div>
        </div>
      </div>
      <div className="flex items-center mt-2">
        <input
          type="checkbox"
          id="vatIncluded"
          name="vatIncluded"
          checked={vatIncluded}
          onChange={onChange}
          className="mr-2"
        />
        <label htmlFor="vatIncluded" className="text-sm text-gray-700">
          Включено ПДВ
        </label>
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      {price && !error && (
        <div className="text-sm text-gray-500 mt-1">
          Буде відображатися як: {formatPriceWithSymbol(price, currency)}{" "}
          {priceType === "BRUTTO" ? "(Брутто, з ПДВ)" : "(Нетто, без ПДВ)"}
          {vatIncluded ? " (ПДВ включено)" : ""}
        </div>
      )}
    </div>
  );
};

export default PriceInput;