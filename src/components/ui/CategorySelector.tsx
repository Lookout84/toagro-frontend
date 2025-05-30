import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useAppSelector } from '../../store';

interface CategorySelectorProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ value, onChange, error }) => {
  const { categories, status: categoriesStatus } = useAppSelector(
    (state) => state.catalog
  );

  return (
    <div>
      <label
        htmlFor="categoryId"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Категорія *
      </label>
      <div className="relative">
        <select
          id="categoryId"
          name="categoryId"
          value={value}
          onChange={onChange}
          className={`appearance-none w-full px-4 py-2 border ${
            error ? "border-red-500" : "border-gray-300"
          } rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500`}
        >
          <option value="">Виберіть категорію</option>
          {categoriesStatus === "loading" ? (
            <option disabled>Завантаження категорій...</option>
          ) : (
            categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))
          )}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown size={18} className="text-gray-400" />
        </div>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default CategorySelector;