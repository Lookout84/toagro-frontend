import React, { useState, useEffect } from "react";
import { Category } from "../../store/catalogSlice";
import { ChevronDown, ChevronUp, RotateCw } from "lucide-react";
import Button from "../common/Button";

// Типи для сортування
type SortOption = {
  label: string;
  value: {
    sortBy: string;
    sortOrder: string;
  };
};

// Опції сортування
const sortOptions: SortOption[] = [
  { label: "Нові спочатку", value: { sortBy: "createdAt", sortOrder: "desc" } },
  { label: "Старі спочатку", value: { sortBy: "createdAt", sortOrder: "asc" } },
  { label: "Від дешевих до дорогих", value: { sortBy: "price", sortOrder: "asc" } },
  { label: "Від дорогих до дешевих", value: { sortBy: "price", sortOrder: "desc" } },
];

// Опції стану обладнання
const conditionOptions = [
  { label: "Усі", value: "" },
  { label: "Нове", value: "new" },
  { label: "Вживане", value: "used" },
];

interface CatalogFiltersProps {
  filters: {
    condition?: string;
    categoryId?: number | string;
    minPrice?: string;
    maxPrice?: string;
    location?: string;
    sortBy: string;
    sortOrder: string;
  };
  onFilterChange: (filters: {
    condition?: string;
    categoryId?: number | string;
    minPrice?: string;
    maxPrice?: string;
    location?: string;
    sortBy: string;
    sortOrder: string;
  }) => void;
  categories: Category[];
  showCondition?: boolean;
}

const CatalogFilters: React.FC<CatalogFiltersProps> = ({
  filters,
  onFilterChange,
  categories,
  showCondition = true,
}) => {
  // Локальний стан для фільтрів
  const [localFilters, setLocalFilters] = useState(filters);
  
  // Стан для розкритих секцій фільтрів на мобільних
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    condition: true,
    location: true,
    sort: true,
  });

  // Оновлення локального стану при зміні пропсів
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Обробка зміни фільтрів
  const handleFilterChange = (
    field: string,
    value: string | number | undefined
  ) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Обробка зміни сортування
  const handleSortChange = (option: SortOption) => {
    const newFilters = {
      ...localFilters,
      sortBy: option.value.sortBy,
      sortOrder: option.value.sortOrder,
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Обробка зміни діапазону цін
  const handlePriceChange = (field: "minPrice" | "maxPrice", value: string) => {
    // Перевірка, що введено числове значення або порожній рядок
    if (value === "" || /^\d+$/.test(value)) {
      handleFilterChange(field, value);
    }
  };

  // Перемикання секцій фільтрів
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  // Функція для отримання поточної опції сортування

  // Очищення всіх фільтрів
  const handleResetFilters = () => {
    const resetFilters = {
      ...(showCondition ? { condition: "" } : {}),
      categoryId: "",
      minPrice: "",
      maxPrice: "",
      location: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="space-y-6">
      {/* Кнопка скидання фільтрів */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          icon={<RotateCw size={14} />}
          onClick={handleResetFilters}
          className="text-sm text-gray-500 hover:text-green-600"
        >
          Скинути фільтри
        </Button>
      </div>

      {/* Фільтр за станом (новий/вживаний) */}
      {showCondition && (
        <div className="border-b border-gray-200 pb-4">
          <div
            className="flex justify-between items-center cursor-pointer mb-2"
            onClick={() => toggleSection("condition")}
          >
            <h3 className="text-base font-medium text-gray-900">Стан</h3>
            {expandedSections.condition ? (
              <ChevronUp size={16} className="text-gray-500" />
            ) : (
              <ChevronDown size={16} className="text-gray-500" />
            )}
          </div>
          
          {expandedSections.condition && (
            <div className="space-y-2">
              {conditionOptions.map((option) => (
                <div key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    id={`condition-${option.value}`}
                    name="condition"
                    value={option.value}
                    checked={localFilters.condition === option.value}
                    onChange={() => handleFilterChange("condition", option.value)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <label
                    htmlFor={`condition-${option.value}`}
                    className="ml-2 text-sm text-gray-700"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Фільтр за категоріями */}
      <div className="border-b border-gray-200 pb-4">
        <div
          className="flex justify-between items-center cursor-pointer mb-2"
          onClick={() => toggleSection("categories")}
        >
          <h3 className="text-base font-medium text-gray-900">Категорії</h3>
          {expandedSections.categories ? (
            <ChevronUp size={16} className="text-gray-500" />
          ) : (
            <ChevronDown size={16} className="text-gray-500" />
          )}
        </div>
        
        {expandedSections.categories && (
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="radio"
                id="category-all"
                name="categoryId"
                value=""
                checked={!localFilters.categoryId}
                onChange={() => handleFilterChange("categoryId", undefined)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
              />
              <label
                htmlFor="category-all"
                className="ml-2 text-sm text-gray-700"
              >
                Усі категорії
              </label>
            </div>
            
            {categories.map((category) => (
              <div key={category.id} className="flex items-center">
                <input
                  type="radio"
                  id={`category-${category.id}`}
                  name="categoryId"
                  value={category.id}
                  checked={Number(localFilters.categoryId) === category.id}
                  onChange={() => handleFilterChange("categoryId", category.id)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <label
                  htmlFor={`category-${category.id}`}
                  className="ml-2 text-sm text-gray-700"
                >
                  {category.name}
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Фільтр за ціною */}
      <div className="border-b border-gray-200 pb-4">
        <div
          className="flex justify-between items-center cursor-pointer mb-2"
          onClick={() => toggleSection("price")}
        >
          <h3 className="text-base font-medium text-gray-900">Ціна</h3>
          {expandedSections.price ? (
            <ChevronUp size={16} className="text-gray-500" />
          ) : (
            <ChevronDown size={16} className="text-gray-500" />
          )}
        </div>
        
        {expandedSections.price && (
          <div className="space-y-3">
            <div>
              <label htmlFor="minPrice" className="text-sm text-gray-700 block mb-1">
                Від (грн)
              </label>
              <input
                type="text"
                id="minPrice"
                value={localFilters.minPrice || ""}
                onChange={(e) => handlePriceChange("minPrice", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm"
                placeholder="Мінімальна ціна"
              />
            </div>
            
            <div>
              <label htmlFor="maxPrice" className="text-sm text-gray-700 block mb-1">
                До (грн)
              </label>
              <input
                type="text"
                id="maxPrice"
                value={localFilters.maxPrice || ""}
                onChange={(e) => handlePriceChange("maxPrice", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm"
                placeholder="Максимальна ціна"
              />
            </div>
          </div>
        )}
      </div>

      {/* Фільтр за місцезнаходженням */}
      <div className="border-b border-gray-200 pb-4">
        <div
          className="flex justify-between items-center cursor-pointer mb-2"
          onClick={() => toggleSection("location")}
        >
          <h3 className="text-base font-medium text-gray-900">Місцезнаходження</h3>
          {expandedSections.location ? (
            <ChevronUp size={16} className="text-gray-500" />
          ) : (
            <ChevronDown size={16} className="text-gray-500" />
          )}
        </div>
        
        {expandedSections.location && (
          <div>
            <input
              type="text"
              id="location"
              value={localFilters.location || ""}
              onChange={(e) => handleFilterChange("location", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm"
              placeholder="Введіть місто або область"
            />
          </div>
        )}
      </div>

      {/* Сортування */}
      <div>
        <div
          className="flex justify-between items-center cursor-pointer mb-2"
          onClick={() => toggleSection("sort")}
        >
          <h3 className="text-base font-medium text-gray-900">Сортування</h3>
          {expandedSections.sort ? (
            <ChevronUp size={16} className="text-gray-500" />
          ) : (
            <ChevronDown size={16} className="text-gray-500" />
          )}
        </div>
        
        {expandedSections.sort && (
          <div className="space-y-2">
            {sortOptions.map((option, index) => (
              <div key={index} className="flex items-center">
                <input
                  type="radio"
                  id={`sort-${index}`}
                  name="sort"
                  checked={
                    option.value.sortBy === localFilters.sortBy &&
                    option.value.sortOrder === localFilters.sortOrder
                  }
                  onChange={() => handleSortChange(option)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <label
                  htmlFor={`sort-${index}`}
                  className="ml-2 text-sm text-gray-700"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CatalogFilters;