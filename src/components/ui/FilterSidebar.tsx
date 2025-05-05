import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store";
import { setFilters, resetFilters } from "@/store/catalogSlice";
import { ChevronDown, ChevronUp, X, Filter, RefreshCw } from "lucide-react";
import { Category } from "@/types/api";
import { useDebounce } from "@/hooks";

/**
 * Інтерфейс для діапазону цін
 */
interface PriceRange {
  min: string;
  max: string;
}

/**
 * Інтерфейс для параметрів фільтрації
 */
interface FilterParams {
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  search?: string;
}

/**
 * Компонент бічної панелі фільтрів
 */
const FilterSidebar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Отримання стану з Redux
  const { categories, filters } = useAppSelector((state) => state.catalog);

  // Локальний стан компонента
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<PriceRange>({
    min: "",
    max: "",
  });
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Використання дебаунсингу для цінового діапазону
  const debouncedMinPrice = useDebounce(priceRange.min, 500);
  const debouncedMaxPrice = useDebounce(priceRange.max, 500);

  // Список локацій (регіонів)
  const locations = useMemo<string[]>(
    () => [
      "Київська обл.",
      "Львівська обл.",
      "Одеська обл.",
      "Харківська обл.",
      "Дніпропетровська обл.",
      "Запорізька обл.",
      "Вінницька обл.",
      "Полтавська обл.",
      "Черкаська обл.",
      "Миколаївська обл.",
    ],
    [],
  );

  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  /**
   * Оновлення URL з параметрами фільтрації
   */
  const updateUrl = useCallback(
    (params: FilterParams) => {
      const searchParams = new URLSearchParams(location.search);

      // Допоміжна функція для оновлення або видалення параметрів
      const updateParam = (
        key: string,
        value: string | number | null | undefined,
      ) => {
        if (value === null || value === undefined || value === "") {
          searchParams.delete(key);
        } else {
          searchParams.set(key, String(value));
        }
      };

      if ("categoryId" in params) updateParam("categoryId", params.categoryId);
      if ("minPrice" in params) updateParam("minPrice", params.minPrice);
      if ("maxPrice" in params) updateParam("maxPrice", params.maxPrice);
      if ("location" in params) updateParam("location", params.location);
      if ("search" in params) updateParam("search", params.search);

      // Збереження пошукового запиту, якщо він є
      const search = searchParams.get("search");
      if (search && !("search" in params)) {
        searchParams.set("search", search);
      }

      navigate(
        {
          pathname: location.pathname,
          search: searchParams.toString(),
        },
        { replace: true },
      );
    },
    [location.search, location.pathname, navigate],
  );

  /**
   * Розбір параметрів URL при завантаженні та зміні URL
   */
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);

    const categoryId = searchParams.get("categoryId");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const locationParam = searchParams.get("location");
    const search = searchParams.get("search");

    // Встановлення стану фільтрів з URL
    setSelectedCategory(categoryId ? parseInt(categoryId) : null);
    setPriceRange({
      min: minPrice || "",
      max: maxPrice || "",
    });
    setSelectedLocations(locationParam ? [locationParam] : []);

    // Створюємо об'єкт фільтрів для Redux
    const filterParams: FilterParams = {};
    if (categoryId) filterParams.categoryId = parseInt(categoryId);
    if (minPrice) filterParams.minPrice = parseFloat(minPrice);
    if (maxPrice) filterParams.maxPrice = parseFloat(maxPrice);
    if (locationParam) filterParams.location = locationParam;
    if (search) filterParams.search = search;

    // Оновлюємо Redux лише якщо є фільтри
    if (Object.keys(filterParams).length > 0) {
      dispatch(setFilters(filterParams));
    }
  }, [location.search, dispatch]);

  /**
   * Ефект для автоматичного застосування цінового діапазону після дебаунсингу
   */
  useEffect(() => {
    if (debouncedMinPrice || debouncedMaxPrice) {
      const minPrice = debouncedMinPrice
        ? parseFloat(debouncedMinPrice)
        : undefined;
      const maxPrice = debouncedMaxPrice
        ? parseFloat(debouncedMaxPrice)
        : undefined;

      if (minPrice !== filters.minPrice || maxPrice !== filters.maxPrice) {
        const filterObj: FilterParams = {};
        if (minPrice !== undefined) filterObj.minPrice = minPrice;
        if (maxPrice !== undefined) filterObj.maxPrice = maxPrice;
        dispatch(setFilters(filterObj));
        updateUrl(filterObj);
      }
    }
  }, [
    debouncedMinPrice,
    debouncedMaxPrice,
    dispatch,
    filters.minPrice,
    filters.maxPrice,
    updateUrl,
  ]);

  /**
   * Обробник зміни категорії
   */
  const handleCategoryChange = useCallback(
    (categoryId: number) => {
      const newCategoryId =
        selectedCategory === categoryId ? undefined : categoryId;
      setSelectedCategory(newCategoryId ?? null);

      const filterObj: FilterParams = {};
      if (newCategoryId !== undefined) filterObj.categoryId = newCategoryId;
      dispatch(setFilters(filterObj));
      updateUrl(
        newCategoryId !== undefined ? { categoryId: newCategoryId } : {},
      );
    },
    [selectedCategory, dispatch, updateUrl],
  );

  /**
   * Обробник розгортання/згортання категорії
   */
  const toggleCategoryExpand = useCallback(
    (categoryId: number, event?: React.MouseEvent) => {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      setExpandedCategories((prev) =>
        prev.includes(categoryId)
          ? prev.filter((id) => id !== categoryId)
          : [...prev, categoryId],
      );
    },
    [],
  );

  /**
   * Обробник зміни цінового діапазону
   */
  const handlePriceChange = useCallback(
    (type: "min" | "max", value: string) => {
      // Перевірка на валідне числове значення
      const numValue = value === "" ? "" : value;

      setPriceRange((prev) => ({ ...prev, [type]: numValue }));
    },
    [],
  );

  /**
   * Обробник зміни локації
   */
  const handleLocationChange = useCallback(
    (location: string) => {
      setSelectedLocations((prev) => {
        // Для радіокнопок або чекбоксів для вибору регіону
        // Якщо локація вже вибрана, знімаємо її вибір, інакше - встановлюємо
        if (prev.includes(location)) {
          return [];
        } else {
          return [location];
        }
      });

      // Відразу застосовуємо фільтр локації
      const newLocation = selectedLocations.includes(location)
        ? undefined
        : location;
      if (typeof newLocation === "string") {
        dispatch(setFilters({ location: newLocation }));
        updateUrl({ location: newLocation });
      } else {
        dispatch(setFilters({}));
        updateUrl({});
      }
    },
    [selectedLocations, dispatch, updateUrl],
  );

  /**
   * Обробник застосування фільтрів
   */
  const applyFilters = useCallback(() => {
    const minPrice = priceRange.min ? parseFloat(priceRange.min) : undefined;
    const maxPrice = priceRange.max ? parseFloat(priceRange.max) : undefined;
    const location =
      selectedLocations.length > 0 ? selectedLocations[0] : undefined;

    const filterObj: FilterParams = {};
    if (minPrice !== undefined) filterObj.minPrice = minPrice;
    if (maxPrice !== undefined) filterObj.maxPrice = maxPrice;
    if (location !== undefined) filterObj.location = location;
    dispatch(setFilters(filterObj));
    updateUrl({ minPrice, maxPrice, location } as FilterParams);

    setIsMobileFiltersOpen(false);
  }, [priceRange, selectedLocations, dispatch, updateUrl]);

  /**
   * Обробник очищення фільтрів
   */
  const clearFilters = useCallback(() => {
    setSelectedCategory(null);
    setPriceRange({ min: "", max: "" });
    setSelectedLocations([]);

    dispatch(resetFilters());

    // Зберігаємо пошуковий запит, якщо він є
    const searchParams = new URLSearchParams(location.search);
    const search = searchParams.get("search");

    if (search) {
      navigate(`${location.pathname}?search=${search}`, { replace: true });
    } else {
      navigate(location.pathname, { replace: true });
    }

    setIsMobileFiltersOpen(false);
  }, [dispatch, location.pathname, location.search, navigate]);

  /**
   * Рекурсивний рендер категорій з підкатегоріями
   */
  const renderCategory = useCallback(
    (category: Category, depth = 0) => {
      const hasChildren = category.children && category.children.length > 0;
      const isExpanded = expandedCategories.includes(category.id);

      return (
        <div key={category.id} className="flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id={`category-${category.id}`}
                checked={selectedCategory === category.id}
                onChange={() => handleCategoryChange(category.id)}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                aria-label={`Фільтрувати за категорією ${category.name}`}
              />
              <label
                htmlFor={`category-${category.id}`}
                className={`ml-2 text-sm text-gray-700 ${depth > 0 ? "font-normal" : "font-medium"}`}
              >
                {category.name}
                {category._count && (
                  <span className="text-gray-400 ml-1">
                    ({category._count.listings})
                  </span>
                )}
              </label>
            </div>

            {hasChildren && (
              <button
                onClick={(e) => toggleCategoryExpand(category.id, e)}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-expanded={isExpanded}
                aria-label={`${isExpanded ? "Згорнути" : "Розгорнути"} категорію ${category.name}`}
              >
                {isExpanded ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>
            )}
          </div>

          {/* Підкатегорії */}
          {hasChildren && isExpanded && (
            <div className={`ml-6 mt-2 space-y-2 pl-${depth + 1}`}>
              {category.children?.map((child) =>
                renderCategory(child, depth + 1),
              )}
            </div>
          )}
        </div>
      );
    },
    [
      expandedCategories,
      selectedCategory,
      handleCategoryChange,
      toggleCategoryExpand,
    ],
  );

  /**
   * Рендеринг контенту фільтрів
   */
  const renderFilters = useCallback(
    () => (
      <>
        {/* Категорії */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Категорії</h3>
          <div className="space-y-2">
            {categories.map((category) => renderCategory(category))}
          </div>
        </div>

        {/* Ціна */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Ціна</h3>
          <div className="flex space-x-2">
            <div className="w-1/2">
              <label htmlFor="min-price" className="sr-only">
                Від
              </label>
              <input
                type="number"
                id="min-price"
                placeholder="Від"
                value={priceRange.min}
                onChange={(e) => handlePriceChange("min", e.target.value)}
                min="0"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                aria-label="Мінімальна ціна"
              />
            </div>
            <div className="w-1/2">
              <label htmlFor="max-price" className="sr-only">
                До
              </label>
              <input
                type="number"
                id="max-price"
                placeholder="До"
                value={priceRange.max}
                onChange={(e) => handlePriceChange("max", e.target.value)}
                min={priceRange.min || "0"}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                aria-label="Максимальна ціна"
              />
            </div>
          </div>
        </div>

        {/* Розташування */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Розташування</h3>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {locations.map((loc) => (
              <div key={loc} className="flex items-center">
                <input
                  type="radio"
                  id={`location-${loc}`}
                  name="location"
                  checked={selectedLocations.includes(loc)}
                  onChange={() => handleLocationChange(loc)}
                  className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                  aria-label={`Вибрати регіон ${loc}`}
                />
                <label
                  htmlFor={`location-${loc}`}
                  className="ml-2 text-sm text-gray-700"
                >
                  {loc}
                </label>
              </div>
            ))}
          </div>
        </div>
      </>
    ),
    [
      categories,
      locations,
      priceRange,
      selectedLocations,
      renderCategory,
      handlePriceChange,
      handleLocationChange,
    ],
  );

  return (
    <>
      {/* Мобільна кнопка фільтрів */}
      <div className="lg:hidden flex justify-between items-center mb-4">
        <button
          onClick={() => setIsMobileFiltersOpen(true)}
          className="flex items-center space-x-2 text-gray-700 hover:text-green-600"
          aria-label="Відкрити фільтри"
          aria-expanded={isMobileFiltersOpen}
          aria-controls="mobile-filters"
        >
          <Filter size={20} aria-hidden="true" />
          <span>Фільтри</span>
        </button>

        <button
          onClick={clearFilters}
          className="flex items-center space-x-1 text-gray-500 hover:text-green-600 text-sm"
          aria-label="Скинути всі фільтри"
          disabled={
            !selectedCategory &&
            !priceRange.min &&
            !priceRange.max &&
            selectedLocations.length === 0
          }
        >
          <RefreshCw size={14} aria-hidden="true" />
          <span>Скинути</span>
        </button>
      </div>

      {/* Мобільні фільтри (оверлей) */}
      {isMobileFiltersOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-lg overflow-y-auto"
            id="mobile-filters"
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Фільтри</h2>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                  aria-label="Закрити фільтри"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>

              {renderFilters()}

              <div className="mt-6 flex space-x-4">
                <button
                  onClick={applyFilters}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex-grow focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  aria-label="Застосувати фільтри"
                >
                  Застосувати
                </button>
                <button
                  onClick={clearFilters}
                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  aria-label="Скинути фільтри"
                  disabled={
                    !selectedCategory &&
                    !priceRange.min &&
                    !priceRange.max &&
                    selectedLocations.length === 0
                  }
                >
                  Скинути
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Десктопні фільтри */}
      <div className="hidden lg:block" aria-label="Фільтри">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Фільтри</h2>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-green-600 flex items-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              aria-label="Скинути всі фільтри"
              disabled={
                !selectedCategory &&
                !priceRange.min &&
                !priceRange.max &&
                selectedLocations.length === 0
              }
            >
              <RefreshCw size={14} className="mr-1" aria-hidden="true" />
              Скинути
            </button>
          </div>

          {renderFilters()}

          <button
            onClick={applyFilters}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 mt-6 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            aria-label="Застосувати всі фільтри"
          >
            Застосувати фільтри
          </button>
        </div>
      </div>
    </>
  );
};

export default FilterSidebar;
