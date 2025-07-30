import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useAppSelector } from '../../store';

interface BrandSelectorProps {
  value: string;
  onChange: (brandId: string, brandName: string) => void;
  error?: string;
}

const BrandSelector: React.FC<BrandSelectorProps> = ({ value, onChange, error }) => {
  const { brands, status: brandsStatus } = useAppSelector((state) => state.brands);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Debug логування
  console.log("🚗 BrandSelector render:", {
    brandsCount: brands.length,
    brandsStatus,
    brands: brands.slice(0, 3), // Показуємо тільки перші 3 для читабельності
    value,
    searchQuery
  });

  const handleBrandSelect = (brandId: string, brandName: string) => {
    onChange(brandId, brandName);
    setSearchQuery(brandName);
    setIsDropdownOpen(false);
  };

  return (
    <div>
      <label
        htmlFor="brandId"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Марка техніки *
      </label>
      <div className="relative" id="brands-dropdown-container">
        <div
          className={`relative w-full border ${
            error ? "border-red-500" : "border-gray-300"
          } rounded-md focus-within:ring-1 focus-within:ring-green-500 focus-within:border-green-500`}
        >
          <input
            type="text"
            placeholder="Почніть вводити назву марки..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            className="w-full px-4 py-2 rounded-md focus:outline-none"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="text-gray-400 hover:text-gray-600"
            >
              <ChevronDown size={18} className="text-gray-400" />
            </button>
          </div>
        </div>
        {isDropdownOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {brandsStatus === "loading" ? (
              <div className="px-4 py-2 text-sm text-gray-500 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                Завантаження марок...
              </div>
            ) : brandsStatus === "failed" ? (
              <div className="px-4 py-2 text-sm text-red-500">
                Помилка завантаження марок. Спробуйте оновити сторінку.
              </div>
            ) : Array.isArray(brands) && brands.length > 0 ? (
              <ul className="py-1">
                <li className="px-4 py-1 text-xs text-gray-500 border-b">
                  Знайдено брендів: {brands.length}
                </li>
                {brands
                  .filter((brand) =>
                    searchQuery
                      ? brand.name
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase())
                      : true
                  )
                  .map((brand) => (
                    <li key={brand.id}>
                      <button
                        type="button"
                        onClick={() => handleBrandSelect(brand.id.toString(), brand.name)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                          value === brand.id.toString()
                            ? "bg-green-50 text-green-700"
                            : "text-gray-700"
                        }`}
                      >
                        {brand.name}
                      </button>
                    </li>
                  ))}
                {brands.filter((brand) =>
                  searchQuery
                    ? brand.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
                    : true
                ).length === 0 && (
                  <li className="px-4 py-2 text-sm text-gray-500">
                    За вашим запитом нічого не знайдено
                  </li>
                )}
              </ul>
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500">
                <div>Немає доступних марок</div>
                <div className="text-xs mt-1">
                  Статус: {brandsStatus}, Кількість: {brands.length}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default BrandSelector;