import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store";
import { setFilters, resetFilters } from "../../store/catalogSlice";
import { ChevronDown, ChevronUp, X, Filter, RefreshCw } from "lucide-react";
import Button from "../common/Button";
import useDebounce from "../../hooks/useDebounce";

// Типи
interface Category {
  id: number;
  name: string;
  slug: string;
  children?: Category[];
  _count?: {
    listings: number;
  };
}

interface PriceRange {
  min: string;
  max: string;
}

export interface FilterSidebarProps {
  fixedCondition?: "new" | "used";
}

// Константи
const LOCATIONS = [
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
];

const CONDITION_OPTIONS = [
  { value: "", label: "Усі" },
  { value: "new", label: "Нова" },
  { value: "used", label: "Вживана" },
];

const FilterSidebar: React.FC<FilterSidebarProps> = ({ fixedCondition }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { categories, filters } = useAppSelector((state) => state.catalog);

  // Стани
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: "", max: "" });
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedCondition, setSelectedCondition] = useState<string>(
    fixedCondition || (typeof filters.condition === 'string' ? filters.condition : "") || ""
  );
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Дебаунс для цін
  const debouncedMinPrice = useDebounce(priceRange.min, 500);
  const debouncedMaxPrice = useDebounce(priceRange.max, 500);

  // Синхронізація стану з URL (тільки оновлення локального стану!)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const categoryId = searchParams.get("categoryId");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const loc = searchParams.get("location");
    const cond = fixedCondition || searchParams.get("condition") || "";

    setSelectedCategory(categoryId ? parseInt(categoryId) : null);
    setPriceRange({ min: minPrice || "", max: maxPrice || "" });
    setSelectedLocation(loc || "");
    setSelectedCondition(cond);
    // НЕ викликаємо тут dispatch(setFilters) і navigate!
  }, [location.search, fixedCondition]);

  // Функція оновлення URL
  const updateUrl = useCallback((params: Record<string, any>) => {
    const searchParams = new URLSearchParams(location.search);

    // Категорія
    if ("categoryId" in params) {
      if (params.categoryId) {
        searchParams.set("categoryId", String(params.categoryId));
      } else {
        searchParams.delete("categoryId");
      }
    }

    // Ціни
    ["minPrice", "maxPrice"].forEach(key => {
      if (key in params) {
        const value = params[key];
        if (value !== undefined && value !== "") {
          searchParams.set(key, String(value));
        } else {
          searchParams.delete(key);
        }
      }
    });

    // Локація
    if ("location" in params) {
      if (params.location) {
        searchParams.set("location", params.location);
      } else {
        searchParams.delete("location");
      }
    }

    // Стан (якщо не фіксований)
    if (!fixedCondition && "condition" in params) {
      if (params.condition !== undefined) {
        searchParams.set("condition", params.condition);
      } else {
        searchParams.delete("condition");
      }
    }

    // Фіксований стан
    if (fixedCondition) {
      searchParams.set("condition", fixedCondition);
    }

    navigate({
      pathname: location.pathname,
      search: searchParams.toString(),
    }, { replace: true });
  }, [location, navigate, fixedCondition]);

  // Оновлення URL при зміні цін
  useEffect(() => {
    const filterObj: Record<string, any> = {};
    if (debouncedMinPrice !== "") {
      const min = parseFloat(debouncedMinPrice);
      if (!isNaN(min)) filterObj.minPrice = min;
    }
    if (debouncedMaxPrice !== "") {
      const max = parseFloat(debouncedMaxPrice);
      if (!isNaN(max)) filterObj.maxPrice = max;
    }
    if (Object.keys(filterObj).length > 0) {
      dispatch(setFilters(filterObj));
      updateUrl(filterObj);
    }
  }, [debouncedMinPrice, debouncedMaxPrice, dispatch, updateUrl]);

  // Обробники подій
  const handleCategoryChange = useCallback((categoryId: number) => {
    const newCategoryId = selectedCategory === categoryId ? null : categoryId;
    setSelectedCategory(newCategoryId);
    const filterObj = newCategoryId ? { categoryId: newCategoryId } : {};
    dispatch(setFilters(filterObj));
    updateUrl(filterObj);
  }, [selectedCategory, dispatch, updateUrl]);

  const toggleCategoryExpand = useCallback((categoryId: number, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  }, []);

  const handlePriceChange = useCallback((type: "min" | "max", value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setPriceRange(prev => ({ ...prev, [type]: value }));
    }
  }, []);

  const handleLocationChange = useCallback((loc: string) => {
    const newLoc = selectedLocation === loc ? "" : loc;
    setSelectedLocation(newLoc);
    const filterObj: Record<string, any> = {};
    if (newLoc) {
      filterObj.location = newLoc;
    }
    dispatch(setFilters(filterObj));
    updateUrl({ location: newLoc || undefined });
  }, [selectedLocation, dispatch, updateUrl]);

  const handleConditionChange = useCallback((cond: string) => {
    if (fixedCondition) return;
    setSelectedCondition(cond);
    const filterObj = { condition: cond };
    dispatch(setFilters(filterObj));
    updateUrl(filterObj);
  }, [fixedCondition, dispatch, updateUrl]);

  // Очищення фільтрів
  const clearFilters = useCallback(() => {
    setSelectedCategory(null);
    setPriceRange({ min: "", max: "" });
    setSelectedLocation("");
    if (!fixedCondition) setSelectedCondition("");
    const newFilters = fixedCondition ? { condition: fixedCondition } : {};
    dispatch(resetFilters());
    dispatch(setFilters(newFilters));
    const searchParams = new URLSearchParams();
    if (fixedCondition) searchParams.set("condition", fixedCondition);
    navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
    setIsMobileFiltersOpen(false);
  }, [dispatch, fixedCondition, location.pathname, navigate]);

  // Застосування фільтрів (для мобільної версії)
  const applyFilters = useCallback(() => {
    const filterObj: Record<string, any> = {};
    if (selectedCategory) filterObj.categoryId = selectedCategory;
    if (priceRange.min) {
      const min = parseFloat(priceRange.min);
      if (!isNaN(min)) filterObj.minPrice = min;
    }
    if (priceRange.max) {
      const max = parseFloat(priceRange.max);
      if (!isNaN(max)) filterObj.maxPrice = max;
    }
    if (selectedLocation) filterObj.location = selectedLocation;
    if (!fixedCondition && selectedCondition) filterObj.condition = selectedCondition;
    dispatch(setFilters(filterObj));
    updateUrl(filterObj);
    setIsMobileFiltersOpen(false);
  }, [selectedCategory, priceRange, selectedLocation, selectedCondition, fixedCondition, dispatch, updateUrl]);

  // Рендер категорій
  const renderCategory = useCallback((category: Category, depth = 0) => {
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
              className={`ml-2 text-sm ${depth > 0 ? "font-normal" : "font-medium"} text-gray-700`}
            >
              {category.name}
              {category._count && (
                <span className="text-gray-400 ml-1">({category._count.listings})</span>
              )}
            </label>
          </div>
          {hasChildren && (
            <button
              type="button"
              onClick={(e) => toggleCategoryExpand(category.id, e)}
              className="text-gray-400 hover:text-gray-600 p-1"
              aria-expanded={isExpanded}
              aria-label={`${isExpanded ? "Згорнути" : "Розгорнути"} категорію ${category.name}`}
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-6 mt-2 space-y-2">
            {category.children?.map(child => renderCategory(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }, [expandedCategories, selectedCategory, handleCategoryChange, toggleCategoryExpand]);

  // Рендер фільтрів
  const renderFilters = useCallback(() => (
    <>
      {!fixedCondition && (
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Стан техніки</h3>
          <div className="space-y-2">
            {CONDITION_OPTIONS.map(option => (
              <div key={option.value} className="flex items-center">
                <input
                  type="radio"
                  id={`condition-${option.value}`}
                  name="condition"
                  value={option.value}
                  checked={selectedCondition === option.value}
                  onChange={() => handleConditionChange(option.value)}
                  className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                  aria-label={option.label}
                />
                <label htmlFor={`condition-${option.value}`} className="ml-2 text-sm text-gray-700">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="font-medium text-gray-900 mb-3">Категорії</h3>
        <div className="space-y-2">
          {categories.map(category => renderCategory(category))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-medium text-gray-900 mb-3">Ціна</h3>
        <div className="flex space-x-2">
          <div className="w-1/2">
            <label htmlFor="min-price" className="sr-only">Від</label>
            <input
              type="text"
              id="min-price"
              placeholder="Від"
              value={priceRange.min}
              onChange={(e) => handlePriceChange("min", e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              aria-label="Мінімальна ціна"
            />
          </div>
          <div className="w-1/2">
            <label htmlFor="max-price" className="sr-only">До</label>
            <input
              type="text"
              id="max-price"
              placeholder="До"
              value={priceRange.max}
              onChange={(e) => handlePriceChange("max", e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              aria-label="Максимальна ціна"
            />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-medium text-gray-900 mb-3">Розташування</h3>
        <div className="max-h-48 overflow-y-auto space-y-2">
          {LOCATIONS.map(loc => (
            <div key={loc} className="flex items-center">
              <input
                type="radio"
                id={`location-${loc}`}
                name="location"
                checked={selectedLocation === loc}
                onChange={() => handleLocationChange(loc)}
                className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                aria-label={`Вибрати регіон ${loc}`}
              />
              <label htmlFor={`location-${loc}`} className="ml-2 text-sm text-gray-700">
                {loc}
              </label>
            </div>
          ))}
        </div>
      </div>
    </>
  ), [
    fixedCondition, selectedCondition, handleConditionChange,
    categories, renderCategory, priceRange, handlePriceChange,
    selectedLocation, handleLocationChange
  ]);

  // Перевірка чи фільтри порожні
  const isClearDisabled = useMemo((): boolean => (
    !selectedCategory &&
    !priceRange.min &&
    !priceRange.max &&
    !selectedLocation &&
    (!selectedCondition || !!fixedCondition)
  ), [selectedCategory, priceRange, selectedLocation, selectedCondition, fixedCondition]);

  return (
    <>
      {/* Мобільна версія */}
      <div className="lg:hidden flex justify-between items-center mb-4">
        <Button
          variant="outline"
          onClick={() => setIsMobileFiltersOpen(true)}
          icon={<Filter size={20} />}
          aria-label="Відкрити фільтри"
          aria-expanded={isMobileFiltersOpen}
          aria-controls="mobile-filters"
        >
          Фільтри
        </Button>
        <Button
          variant="ghost"
          onClick={clearFilters}
          icon={<RefreshCw size={14} />}
          className="text-sm text-gray-500 hover:text-green-600"
          aria-label="Скинути всі фільтри"
          disabled={isClearDisabled}
        >
          Скинути
        </Button>
      </div>

      {/* Мобільний оверлей */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-lg overflow-y-auto" id="mobile-filters">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Фільтри</h2>
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                  aria-label="Закрити фільтри"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
              {renderFilters()}
              <div className="mt-6 flex space-x-4">
                <Button
                  variant="primary"
                  onClick={applyFilters}
                  className="flex-grow"
                  aria-label="Застосувати фільтри"
                >
                  Застосувати
                </Button>
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  aria-label="Скинути фільтри"
                  disabled={isClearDisabled}
                >
                  Скинути
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Десктопна версія */}
      <div className="hidden lg:block" aria-label="Фільтри">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Фільтри</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              icon={<RefreshCw size={14} />}
              className="text-sm text-gray-500 hover:text-green-600"
              aria-label="Скинути всі фільтри"
              disabled={isClearDisabled}
            >
              Скинути
            </Button>
          </div>
          {renderFilters()}
          <Button
            variant="primary"
            onClick={applyFilters}
            className="w-full mt-6"
            aria-label="Застосувати всі фільтри"
          >
            Застосувати фільтри
          </Button>
        </div>
      </div>
    </>
  );
};

export default React.memo(FilterSidebar);


// import React, { useState, useEffect, useCallback, useMemo } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { useAppDispatch, useAppSelector } from "../../store";
// import { setFilters, resetFilters } from "../../store/catalogSlice";
// import { ChevronDown, ChevronUp, X, Filter, RefreshCw } from "lucide-react";
// import Button from "../common/Button";
// import useDebounce from "../../hooks/useDebounce";

// // Типи
// interface Category {
//   id: number;
//   name: string;
//   slug: string;
//   children?: Category[];
//   _count?: {
//     listings: number;
//   };
// }

// interface PriceRange {
//   min: string;
//   max: string;
// }

// export interface FilterSidebarProps {
//   fixedCondition?: "new" | "used";
//   filters: {
//     condition: string;
//     categoryId: string;
//     minPrice: string;
//     maxPrice: string;
//     location: string;
//     sortBy: string;
//     sortOrder: string;
//   };
//   onFilterChange: (newFilters: Partial<FilterSidebarProps['filters']>) => void;
//   hideConditionFilter?: boolean;
// }

// // interface FilterSidebarProps {
// //   fixedCondition?: "new" | "used";
// // }

// // Константи
// const LOCATIONS = [
//   "Київська обл.",
//   "Львівська обл.",
//   "Одеська обл.",
//   "Харківська обл.",
//   "Дніпропетровська обл.",
//   "Запорізька обл.",
//   "Вінницька обл.",
//   "Полтавська обл.",
//   "Черкаська обл.",
//   "Миколаївська обл.",
// ];

// const CONDITION_OPTIONS = [
//   { value: "", label: "Усі" },
//   { value: "new", label: "Нова" },
//   { value: "used", label: "Вживана" },
// ];

// const FilterSidebar: React.FC<FilterSidebarProps> = ({ fixedCondition }) => {
//   const dispatch = useAppDispatch();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { categories, filters } = useAppSelector((state) => state.catalog);

//   // Стани
//   const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
//   const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
//   const [priceRange, setPriceRange] = useState<PriceRange>({ min: "", max: "" });
//   const [selectedLocation, setSelectedLocation] = useState<string>("");
//   const [selectedCondition, setSelectedCondition] = useState<string>(
//     fixedCondition || (typeof filters.condition === 'string' ? filters.condition : "") || ""
//   );
//   const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

//   // Дебаунс для цін
//   const debouncedMinPrice = useDebounce(priceRange.min, 500);
//   const debouncedMaxPrice = useDebounce(priceRange.max, 500);

//   // Синхронізація стану з URL
//   useEffect(() => {
//     const searchParams = new URLSearchParams(location.search);
    
//     const categoryId = searchParams.get("categoryId");
//     const minPrice = searchParams.get("minPrice");
//     const maxPrice = searchParams.get("maxPrice");
//     const loc = searchParams.get("location");
//     const cond = fixedCondition || searchParams.get("condition") || "";

//     setSelectedCategory(categoryId ? parseInt(categoryId) : null);
//     setPriceRange({ 
//       min: minPrice || "", 
//       max: maxPrice || "" 
//     });
//     setSelectedLocation(loc || "");
//     setSelectedCondition(cond);

//     const filterParams: Record<string, any> = {};
//     if (categoryId) filterParams.categoryId = parseInt(categoryId);
//     if (minPrice) filterParams.minPrice = parseFloat(minPrice);
//     if (maxPrice) filterParams.maxPrice = parseFloat(maxPrice);
//     if (loc) filterParams.location = loc;
//     if (cond) filterParams.condition = cond;

//     dispatch(setFilters(filterParams));
//   }, [location.search, dispatch, fixedCondition]);

//   // Функція оновлення URL
//   const updateUrl = useCallback((params: Record<string, any>) => {
//     const searchParams = new URLSearchParams(location.search);

//     // Категорія
//     if ("categoryId" in params) {
//       if (params.categoryId) {
//         searchParams.set("categoryId", String(params.categoryId));
//       } else {
//         searchParams.delete("categoryId");
//       }
//     }

//     // Ціни
//     ["minPrice", "maxPrice"].forEach(key => {
//       if (key in params) {
//         const value = params[key];
//         if (value !== undefined && value !== "") {
//           searchParams.set(key, String(value));
//         } else {
//           searchParams.delete(key);
//         }
//       }
//     });

//     // Локація
//     if ("location" in params) {
//       if (params.location) {
//         searchParams.set("location", params.location);
//       } else {
//         searchParams.delete("location");
//       }
//     }

//     // Стан (якщо не фіксований)
//     if (!fixedCondition && "condition" in params) {
//       if (params.condition !== undefined) {
//         searchParams.set("condition", params.condition);
//       } else {
//         searchParams.delete("condition");
//       }
//     }

//     // Фіксований стан
//     if (fixedCondition) {
//       searchParams.set("condition", fixedCondition);
//     }

//     navigate({
//       pathname: location.pathname,
//       search: searchParams.toString(),
//     }, { replace: true });
//   }, [location, navigate, fixedCondition]);

//   // Оновлення URL при зміні цін
//   useEffect(() => {
//     const filterObj: Record<string, any> = {};
    
//     if (debouncedMinPrice !== "") {
//       const min = parseFloat(debouncedMinPrice);
//       if (!isNaN(min)) filterObj.minPrice = min;
//     }
    
//     if (debouncedMaxPrice !== "") {
//       const max = parseFloat(debouncedMaxPrice);
//       if (!isNaN(max)) filterObj.maxPrice = max;
//     }

//     if (Object.keys(filterObj).length > 0) {
//       dispatch(setFilters(filterObj));
//       updateUrl(filterObj);
//     }
//   }, [debouncedMinPrice, debouncedMaxPrice, dispatch, updateUrl]);

//   // Обробники подій
//   const handleCategoryChange = useCallback((categoryId: number) => {
//     const newCategoryId = selectedCategory === categoryId ? null : categoryId;
//     setSelectedCategory(newCategoryId);
    
//     const filterObj = newCategoryId ? { categoryId: newCategoryId } : {};
//     dispatch(setFilters(filterObj));
//     updateUrl(filterObj);
//   }, [selectedCategory, dispatch, updateUrl]);

//   const toggleCategoryExpand = useCallback((categoryId: number, e?: React.MouseEvent) => {
//     e?.preventDefault();
//     e?.stopPropagation();
    
//     setExpandedCategories(prev =>
//       prev.includes(categoryId)
//         ? prev.filter(id => id !== categoryId)
//         : [...prev, categoryId]
//     );
//   }, []);

//   const handlePriceChange = useCallback((type: "min" | "max", value: string) => {
//     if (value === "" || /^\d*\.?\d*$/.test(value)) {
//       setPriceRange(prev => ({ ...prev, [type]: value }));
//     }
//   }, []);

//   const handleLocationChange = useCallback((loc: string) => {
//     const newLoc = selectedLocation === loc ? "" : loc;
//     setSelectedLocation(newLoc);
    
//     const filterObj: Record<string, any> = {};
//     if (newLoc) {
//       filterObj.location = newLoc;
//     }
//     dispatch(setFilters(filterObj));
//     updateUrl({ location: newLoc || undefined });
//   }, [selectedLocation, dispatch, updateUrl]);

//   const handleConditionChange = useCallback((cond: string) => {
//     if (fixedCondition) return;
    
//     setSelectedCondition(cond);
    
//     const filterObj = { condition: cond };
//     dispatch(setFilters(filterObj));
//     updateUrl(filterObj);
//   }, [fixedCondition, dispatch, updateUrl]);

//   // Очищення фільтрів
//   const clearFilters = useCallback(() => {
//     setSelectedCategory(null);
//     setPriceRange({ min: "", max: "" });
//     setSelectedLocation("");
//     if (!fixedCondition) setSelectedCondition("");
    
//     const newFilters = fixedCondition ? { condition: fixedCondition } : {};
//     dispatch(resetFilters());
//     dispatch(setFilters(newFilters));
    
//     const searchParams = new URLSearchParams();
//     if (fixedCondition) searchParams.set("condition", fixedCondition);
//     navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
    
//     setIsMobileFiltersOpen(false);
//   }, [dispatch, fixedCondition, location.pathname, navigate]);

//   // Застосування фільтрів
//   const applyFilters = useCallback(() => {
//     const filterObj: Record<string, any> = {};
    
//     if (selectedCategory) filterObj.categoryId = selectedCategory;
    
//     if (priceRange.min) {
//       const min = parseFloat(priceRange.min);
//       if (!isNaN(min)) filterObj.minPrice = min;
//     }
    
//     if (priceRange.max) {
//       const max = parseFloat(priceRange.max);
//       if (!isNaN(max)) filterObj.maxPrice = max;
//     }
    
//     if (selectedLocation) filterObj.location = selectedLocation;
//     if (!fixedCondition && selectedCondition) filterObj.condition = selectedCondition;
    
//     dispatch(setFilters(filterObj));
//     updateUrl(filterObj);
//     setIsMobileFiltersOpen(false);
//   }, [selectedCategory, priceRange, selectedLocation, selectedCondition, fixedCondition, dispatch, updateUrl]);

//   // Рендер категорій
//   const renderCategory = useCallback((category: Category, depth = 0) => {
//     const hasChildren = category.children && category.children.length > 0;
//     const isExpanded = expandedCategories.includes(category.id);
    
//     return (
//       <div key={category.id} className="flex flex-col">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center">
//             <input
//               type="checkbox"
//               id={`category-${category.id}`}
//               checked={selectedCategory === category.id}
//               onChange={() => handleCategoryChange(category.id)}
//               className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
//               aria-label={`Фільтрувати за категорією ${category.name}`}
//             />
//             <label
//               htmlFor={`category-${category.id}`}
//               className={`ml-2 text-sm ${depth > 0 ? "font-normal" : "font-medium"} text-gray-700`}
//             >
//               {category.name}
//               {category._count && (
//                 <span className="text-gray-400 ml-1">({category._count.listings})</span>
//               )}
//             </label>
//           </div>
//           {hasChildren && (
//             <button
//               type="button"
//               onClick={(e) => toggleCategoryExpand(category.id, e)}
//               className="text-gray-400 hover:text-gray-600 p-1"
//               aria-expanded={isExpanded}
//               aria-label={`${isExpanded ? "Згорнути" : "Розгорнути"} категорію ${category.name}`}
//             >
//               {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
//             </button>
//           )}
//         </div>
//         {hasChildren && isExpanded && (
//           <div className="ml-6 mt-2 space-y-2">
//             {category.children?.map(child => renderCategory(child, depth + 1))}
//           </div>
//         )}
//       </div>
//     );
//   }, [expandedCategories, selectedCategory, handleCategoryChange, toggleCategoryExpand]);

//   // Рендер фільтрів
//   const renderFilters = useCallback(() => (
//     <>
//       {!fixedCondition && (
//         <div className="mb-6">
//           <h3 className="font-medium text-gray-900 mb-3">Стан техніки</h3>
//           <div className="space-y-2">
//             {CONDITION_OPTIONS.map(option => (
//               <div key={option.value} className="flex items-center">
//                 <input
//                   type="radio"
//                   id={`condition-${option.value}`}
//                   name="condition"
//                   value={option.value}
//                   checked={selectedCondition === option.value}
//                   onChange={() => handleConditionChange(option.value)}
//                   className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
//                   aria-label={option.label}
//                 />
//                 <label htmlFor={`condition-${option.value}`} className="ml-2 text-sm text-gray-700">
//                   {option.label}
//                 </label>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       <div className="mb-6">
//         <h3 className="font-medium text-gray-900 mb-3">Категорії</h3>
//         <div className="space-y-2">
//           {categories.map(category => renderCategory(category))}
//         </div>
//       </div>

//       <div className="mb-6">
//         <h3 className="font-medium text-gray-900 mb-3">Ціна</h3>
//         <div className="flex space-x-2">
//           <div className="w-1/2">
//             <label htmlFor="min-price" className="sr-only">Від</label>
//             <input
//               type="text"
//               id="min-price"
//               placeholder="Від"
//               value={priceRange.min}
//               onChange={(e) => handlePriceChange("min", e.target.value)}
//               className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
//               aria-label="Мінімальна ціна"
//             />
//           </div>
//           <div className="w-1/2">
//             <label htmlFor="max-price" className="sr-only">До</label>
//             <input
//               type="text"
//               id="max-price"
//               placeholder="До"
//               value={priceRange.max}
//               onChange={(e) => handlePriceChange("max", e.target.value)}
//               className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
//               aria-label="Максимальна ціна"
//             />
//           </div>
//         </div>
//       </div>

//       <div className="mb-6">
//         <h3 className="font-medium text-gray-900 mb-3">Розташування</h3>
//         <div className="max-h-48 overflow-y-auto space-y-2">
//           {LOCATIONS.map(loc => (
//             <div key={loc} className="flex items-center">
//               <input
//                 type="radio"
//                 id={`location-${loc}`}
//                 name="location"
//                 checked={selectedLocation === loc}
//                 onChange={() => handleLocationChange(loc)}
//                 className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
//                 aria-label={`Вибрати регіон ${loc}`}
//               />
//               <label htmlFor={`location-${loc}`} className="ml-2 text-sm text-gray-700">
//                 {loc}
//               </label>
//             </div>
//           ))}
//         </div>
//       </div>
//     </>
//   ), [
//     fixedCondition, selectedCondition, handleConditionChange,
//     categories, renderCategory, priceRange, handlePriceChange,
//     selectedLocation, handleLocationChange
//   ]);

//   // Перевірка чи фільтри порожні
//   const isClearDisabled = useMemo((): boolean => (
//     !selectedCategory &&
//     !priceRange.min &&
//     !priceRange.max &&
//     !selectedLocation &&
//     (!selectedCondition || !!fixedCondition)
//   ), [selectedCategory, priceRange, selectedLocation, selectedCondition, fixedCondition]);

//   return (
//     <>
//       {/* Мобільна версія */}
//       <div className="lg:hidden flex justify-between items-center mb-4">
//         <Button
//           variant="outline"
//           onClick={() => setIsMobileFiltersOpen(true)}
//           icon={<Filter size={20} />}
//           aria-label="Відкрити фільтри"
//           aria-expanded={isMobileFiltersOpen}
//           aria-controls="mobile-filters"
//         >
//           Фільтри
//         </Button>
//         <Button
//           variant="ghost"
//           onClick={clearFilters}
//           icon={<RefreshCw size={14} />}
//           className="text-sm text-gray-500 hover:text-green-600"
//           aria-label="Скинути всі фільтри"
//           disabled={isClearDisabled}
//         >
//           Скинути
//         </Button>
//       </div>

//       {/* Мобільний оверлей */}
//       {isMobileFiltersOpen && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden" role="dialog" aria-modal="true">
//           <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-lg overflow-y-auto" id="mobile-filters">
//             <div className="p-4">
//               <div className="flex justify-between items-center mb-4">
//                 <h2 className="text-lg font-semibold">Фільтри</h2>
//                 <button
//                   type="button"
//                   onClick={() => setIsMobileFiltersOpen(false)}
//                   className="text-gray-500 hover:text-gray-700 p-1"
//                   aria-label="Закрити фільтри"
//                 >
//                   <X size={20} aria-hidden="true" />
//                 </button>
//               </div>
//               {renderFilters()}
//               <div className="mt-6 flex space-x-4">
//                 <Button
//                   variant="primary"
//                   onClick={applyFilters}
//                   className="flex-grow"
//                   aria-label="Застосувати фільтри"
//                 >
//                   Застосувати
//                 </Button>
//                 <Button
//                   variant="outline"
//                   onClick={clearFilters}
//                   aria-label="Скинути фільтри"
//                   disabled={isClearDisabled}
//                 >
//                   Скинути
//                 </Button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Десктопна версія */}
//       <div className="hidden lg:block" aria-label="Фільтри">
//         <div className="bg-white border border-gray-200 rounded-lg p-4">
//           <div className="flex justify-between items-center mb-4">
//             <h2 className="text-lg font-semibold">Фільтри</h2>
//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={clearFilters}
//               icon={<RefreshCw size={14} />}
//               className="text-sm text-gray-500 hover:text-green-600"
//               aria-label="Скинути всі фільтри"
//               disabled={isClearDisabled}
//             >
//               Скинути
//             </Button>
//           </div>
//           {renderFilters()}
//           <Button
//             variant="primary"
//             onClick={applyFilters}
//             className="w-full mt-6"
//             aria-label="Застосувати всі фільтри"
//           >
//             Застосувати фільтри
//           </Button>
//         </div>
//       </div>
//     </>
//   );
// };

// export default React.memo(FilterSidebar);


// // import React, { useState, useEffect, useCallback, useMemo } from "react";
// // import { useNavigate, useLocation } from "react-router-dom";
// // import { useAppDispatch, useAppSelector } from "../../store";
// // import { setFilters, resetFilters } from "../../store/catalogSlice";
// // import { ChevronDown, ChevronUp, X, Filter, RefreshCw } from "lucide-react";
// // import Button from "../common/Button";
// // import useDebounce from "../../hooks/useDebounce";

// // interface Category {
// //   id: number;
// //   name: string;
// //   slug: string;
// //   children?: Category[];
// //   _count?: {
// //     listings: number;
// //   };
// // }

// // interface PriceRange {
// //   min: string;
// //   max: string;
// // }

// // interface FilterParams {
// //   categoryId?: number | undefined;
// //   minPrice?: number | undefined;
// //   maxPrice?: number | undefined;
// //   location?: string | undefined;
// //   condition?: string | undefined;
// //   [key: string]: any;
// // }

// // interface FilterSidebarProps {
// //   fixedCondition?: "new" | "used";
// // }

// // const LOCATIONS = [
// //   "Київська обл.",
// //   "Львівська обл.",
// //   "Одеська обл.",
// //   "Харківська обл.",
// //   "Дніпропетровська обл.",
// //   "Запорізька обл.",
// //   "Вінницька обл.",
// //   "Полтавська обл.",
// //   "Черкаська обл.",
// //   "Миколаївська обл.",
// // ];

// // const CONDITION_OPTIONS = [
// //   { value: "", label: "Усі" },
// //   { value: "new", label: "Нова" },
// //   { value: "used", label: "Вживана" },
// // ];

// // const FilterSidebar: React.FC<FilterSidebarProps> = ({ fixedCondition }) => {
// //   const dispatch = useAppDispatch();
// //   const navigate = useNavigate();
// //   const location = useLocation();
// //   const { categories, filters } = useAppSelector((state) => state.catalog);

// //   const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
// //   const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
// //   const [priceRange, setPriceRange] = useState<PriceRange>({ min: "", max: "" });
// //   const [selectedLocation, setSelectedLocation] = useState<string>("");
// //   const [selectedCondition, setSelectedCondition] = useState<string>(
// //     fixedCondition || (typeof filters.condition === "string" ? filters.condition : "") || ""
// //   );
// //   const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

// //   const debouncedMinPrice = useDebounce(priceRange.min, 500);
// //   const debouncedMaxPrice = useDebounce(priceRange.max, 500);

// //   // Sync state from URL
// //   useEffect(() => {
// //     const searchParams = new URLSearchParams(location.search);
// //     const categoryId = searchParams.get("categoryId");
// //     const minPrice = searchParams.get("minPrice");
// //     const maxPrice = searchParams.get("maxPrice");
// //     const loc = searchParams.get("location");
// //     const cond = fixedCondition || searchParams.get("condition") || "";

// //     setSelectedCategory(categoryId ? Number(categoryId) : null);
// //     setPriceRange({ min: minPrice || "", max: maxPrice || "" });
// //     setSelectedLocation(loc || "");
// //     setSelectedCondition(cond);

// //     const filterParams: any = {};
// //     if (categoryId) filterParams.categoryId = Number(categoryId);
// //     if (minPrice) filterParams.minPrice = Number(minPrice);
// //     if (maxPrice) filterParams.maxPrice = Number(maxPrice);
// //     if (loc) filterParams.location = loc;
// //     if (cond) filterParams.condition = cond;
// //     dispatch(setFilters(filterParams));
// //   }, [location.search, dispatch, fixedCondition]);

// //   // Debounced price filter
// //   useEffect(() => {
// //     if (debouncedMinPrice !== "" || debouncedMaxPrice !== "") {
// //       const filterObj: any = {};
// //       if (debouncedMinPrice !== "") filterObj.minPrice = Number(debouncedMinPrice);
// //       if (debouncedMaxPrice !== "") filterObj.maxPrice = Number(debouncedMaxPrice);
// //       dispatch(setFilters(filterObj));
// //       updateUrl(filterObj);
// //     }
// //     // eslint-disable-next-line
// //   }, [debouncedMinPrice, debouncedMaxPrice]);

// //   const updateUrl = useCallback(
// //     (params: any) => {
// //       const searchParams = new URLSearchParams(location.search);
// //       if ("categoryId" in params) {
// //         if (params.categoryId) {
// //           searchParams.set("categoryId", String(params.categoryId));
// //         } else {
// //           searchParams.delete("categoryId");
// //         }
// //       }
// //       if ("minPrice" in params)
// //         if (params.minPrice !== undefined && params.minPrice !== "") {
// //           searchParams.set("minPrice", String(params.minPrice));
// //         } else {
// //           searchParams.delete("minPrice");
// //         }
// //       if ("maxPrice" in params) {
// //         if (params.maxPrice !== undefined && params.maxPrice !== "") {
// //           searchParams.set("maxPrice", String(params.maxPrice));
// //         } else {
// //           searchParams.delete("maxPrice");
// //         }
// //       }
// //       if ("location" in params) {
// //         if (params.location) {
// //           searchParams.set("location", params.location);
// //         } else {
// //           searchParams.delete("location");
// //         }
// //       }
// //       if (!fixedCondition && "condition" in params) {
// //         if (params.condition !== undefined) {
// //           searchParams.set("condition", params.condition);
// //         } else {
// //           searchParams.delete("condition");
// //         }
// //       }
// //       if (fixedCondition) searchParams.set("condition", fixedCondition);

// //       navigate(
// //         {
// //           pathname: location.pathname,
// //           search: searchParams.toString(),
// //         },
// //         { replace: true }
// //       );
// //     },
// //     [location, navigate, fixedCondition]
// //   );

// //   const handleCategoryChange = (categoryId: number) => {
// //     const newCategoryId = selectedCategory === categoryId ? null : categoryId;
// //     setSelectedCategory(newCategoryId);
// //     if (typeof newCategoryId === "number") {
// //       dispatch(setFilters({ categoryId: newCategoryId }));
// //     } else {
// //       dispatch(setFilters({}));
// //     }
// //     updateUrl({ categoryId: newCategoryId || undefined });
// //   };

// //   const toggleCategoryExpand = (categoryId: number, e?: React.MouseEvent) => {
// //     if (e) {
// //       e.preventDefault();
// //       e.stopPropagation();
// //     }
// //     setExpandedCategories((prev) =>
// //       prev.includes(categoryId)
// //         ? prev.filter((id) => id !== categoryId)
// //         : [...prev, categoryId]
// //     );
// //   };

// //   const handlePriceChange = (type: "min" | "max", value: string) => {
// //     if (value === "" || /^\d+$/.test(value)) {
// //       setPriceRange((prev) => ({ ...prev, [type]: value }));
// //     }
// //   };

// //   const handleLocationChange = (loc: string) => {
// //     const newLoc = selectedLocation === loc ? "" : loc;
// //     setSelectedLocation(newLoc);
// //     dispatch(setFilters({ location: newLoc || undefined }));
// //     updateUrl({ location: newLoc || undefined });
// //   };

// //   const handleConditionChange = (cond: string) => {
// //     if (fixedCondition) return;
// //     setSelectedCondition(cond);
// //     dispatch(setFilters({ condition: cond }));
// //     updateUrl({ condition: cond });
// //   };

// //   const clearFilters = () => {
// //     setSelectedCategory(null);
// //     setPriceRange({ min: "", max: "" });
// //     setSelectedLocation("");
// //     if (!fixedCondition) setSelectedCondition("");
// //     dispatch(resetFilters());
    
// //     // Apply fixed condition if needed after resetting filters
// //     if (fixedCondition) {
// //       dispatch(setFilters({ condition: fixedCondition }));
// //     }
    
// //     const searchParams = new URLSearchParams(location.search);
// //     if (fixedCondition) {
// //       searchParams.set("condition", fixedCondition);
// //       navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
// //     } else {
// //       navigate(location.pathname, { replace: true });
// //     }
// //     setIsMobileFiltersOpen(false);
// //   };

// //   const applyFilters = () => {
// //     const filterObj: any = {};
// //     if (selectedCategory) filterObj.categoryId = selectedCategory;
// //     if (priceRange.min) filterObj.minPrice = Number(priceRange.min);
// //     if (priceRange.max) filterObj.maxPrice = Number(priceRange.max);
// //     if (selectedLocation) filterObj.location = selectedLocation;
// //     if (!fixedCondition && selectedCondition) filterObj.condition = selectedCondition;
// //     dispatch(setFilters(filterObj));
// //     updateUrl(filterObj);
// //     setIsMobileFiltersOpen(false);
// //   };

// //   const renderCategory = (category: Category, depth = 0) => {
// //     const hasChildren = category.children && category.children.length > 0;
// //     const isExpanded = expandedCategories.includes(category.id);
// //     return (
// //       <div key={category.id} className="flex flex-col">
// //         <div className="flex items-center justify-between">
// //           <div className="flex items-center">
// //             <input
// //               type="checkbox"
// //               id={`category-${category.id}`}
// //               checked={selectedCategory === category.id}
// //               onChange={() => handleCategoryChange(category.id)}
// //               className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
// //               aria-label={`Фільтрувати за категорією ${category.name}`}
// //             />
// //             <label
// //               htmlFor={`category-${category.id}`}
// //               className={`ml-2 text-sm text-gray-700 ${
// //                 depth > 0 ? "font-normal" : "font-medium"
// //               }`}
// //             >
// //               {category.name}
// //               {category._count && (
// //                 <span className="text-gray-400 ml-1">
// //                   ({category._count.listings})
// //                 </span>
// //               )}
// //             </label>
// //           </div>
// //           {hasChildren && (
// //             <button
// //               type="button"
// //               onClick={(e) => toggleCategoryExpand(category.id, e)}
// //               className="text-gray-400 hover:text-gray-600 p-1"
// //               aria-expanded={isExpanded}
// //               aria-label={`${
// //                 isExpanded ? "Згорнути" : "Розгорнути"
// //               } категорію ${category.name}`}
// //             >
// //               {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
// //             </button>
// //           )}
// //         </div>
// //         {hasChildren && isExpanded && (
// //           <div className="ml-6 mt-2 space-y-2">
// //             {category.children?.map((child) => renderCategory(child, depth + 1))}
// //           </div>
// //         )}
// //       </div>
// //     );
// //   };

// //   const renderFilters = () => (
// //     <>
// //       {!fixedCondition && (
// //         <div className="mb-6">
// //           <h3 className="font-medium text-gray-900 mb-3">Стан техніки</h3>
// //           <div className="space-y-2">
// //             {CONDITION_OPTIONS.map((option) => (
// //               <div key={option.value} className="flex items-center">
// //                 <input
// //                   type="radio"
// //                   id={`condition-${option.value}`}
// //                   name="condition"
// //                   value={option.value}
// //                   checked={selectedCondition === option.value}
// //                   onChange={() => handleConditionChange(option.value)}
// //                   className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
// //                 />
// //                 <label
// //                   htmlFor={`condition-${option.value}`}
// //                   className="ml-2 text-sm text-gray-700"
// //                 >
// //                   {option.label}
// //                 </label>
// //               </div>
// //             ))}
// //           </div>
// //         </div>
// //       )}

// //       <div className="mb-6">
// //         <h3 className="font-medium text-gray-900 mb-3">Категорії</h3>
// //         <div className="space-y-2">
// //           {categories.map((category) => renderCategory(category))}
// //         </div>
// //       </div>

// //       <div className="mb-6">
// //         <h3 className="font-medium text-gray-900 mb-3">Ціна</h3>
// //         <div className="flex space-x-2">
// //           <div className="w-1/2">
// //             <label htmlFor="min-price" className="sr-only">
// //               Від
// //             </label>
// //             <input
// //               type="text"
// //               id="min-price"
// //               placeholder="Від"
// //               value={priceRange.min}
// //               onChange={(e) => handlePriceChange("min", e.target.value)}
// //               className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
// //               aria-label="Мінімальна ціна"
// //             />
// //           </div>
// //           <div className="w-1/2">
// //             <label htmlFor="max-price" className="sr-only">
// //               До
// //             </label>
// //             <input
// //               type="text"
// //               id="max-price"
// //               placeholder="До"
// //               value={priceRange.max}
// //               onChange={(e) => handlePriceChange("max", e.target.value)}
// //               className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
// //               aria-label="Максимальна ціна"
// //             />
// //           </div>
// //         </div>
// //       </div>

// //       <div className="mb-6">
// //         <h3 className="font-medium text-gray-900 mb-3">Розташування</h3>
// //         <div className="max-h-48 overflow-y-auto space-y-2">
// //           {LOCATIONS.map((loc) => (
// //             <div key={loc} className="flex items-center">
// //               <input
// //                 type="radio"
// //                 id={`location-${loc}`}
// //                 name="location"
// //                 checked={selectedLocation === loc}
// //                 onChange={() => handleLocationChange(loc)}
// //                 className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
// //                 aria-label={`Вибрати регіон ${loc}`}
// //               />
// //               <label
// //                 htmlFor={`location-${loc}`}
// //                 className="ml-2 text-sm text-gray-700"
// //               >
// //                 {loc}
// //               </label>
// //             </div>
// //           ))}
// //         </div>
// //       </div>
// //     </>
// //   );

// //   // Кнопка "Скинути" неактивна, якщо всі фільтри порожні
// //   const isClearDisabled =
// //     !selectedCategory &&
// //     !priceRange.min &&
// //     !priceRange.max &&
// //     !selectedLocation &&
// //     (!selectedCondition || fixedCondition);

// //   return (
// //     <>
// //       {/* Мобільна кнопка фільтрів */}
// //       <div className="lg:hidden flex justify-between items-center mb-4">
// //         <Button
// //           variant="outline"
// //           onClick={() => setIsMobileFiltersOpen(true)}
// //           icon={<Filter size={20} />}
// //           aria-label="Відкрити фільтри"
// //           aria-expanded={isMobileFiltersOpen}
// //           aria-controls="mobile-filters"
// //         >
// //           Фільтри
// //         </Button>
// //         <Button
// //           variant="ghost"
// //           onClick={clearFilters}
// //           icon={<RefreshCw size={14} />}
// //           className="text-sm text-gray-500 hover:text-green-600"
// //           aria-label="Скинути всі фільтри"
// //           disabled={!!isClearDisabled}
// //         >
// //           Скинути
// //         </Button>
// //       </div>

// //       {/* Мобільні фільтри (оверлей) */}
// //       {isMobileFiltersOpen && (
// //         <div
// //           className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
// //           role="dialog"
// //           aria-modal="true"
// //         >
// //           <div
// //             className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-lg overflow-y-auto"
// //             id="mobile-filters"
// //           >
// //             <div className="p-4">
// //               <div className="flex justify-between items-center mb-4">
// //                 <h2 className="text-lg font-semibold">Фільтри</h2>
// //                 <button
// //                   type="button"
// //                   onClick={() => setIsMobileFiltersOpen(false)}
// //                   className="text-gray-500 hover:text-gray-700 p-1"
// //                   aria-label="Закрити фільтри"
// //                 >
// //                   <X size={20} aria-hidden="true" />
// //                 </button>
// //               </div>
// //               {renderFilters()}
// //               <div className="mt-6 flex space-x-4">
// //                 <Button
// //                   variant="primary"
// //                   onClick={applyFilters}
// //                   className="flex-grow"
// //                   aria-label="Застосувати фільтри"
// //                 >
// //                   Застосувати
// //                 </Button>
// //                 <Button
// //                   variant="outline"
// //                   onClick={clearFilters}
// //                   aria-label="Скинути фільтри"
// //                   disabled={!!isClearDisabled}
// //                 >
// //                   Скинути
// //                 </Button>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {/* Десктопні фільтри */}
// //       <div className="hidden lg:block" aria-label="Фільтри">
// //         <div className="bg-white border border-gray-200 rounded-lg p-4">
// //           <div className="flex justify-between items-center mb-4">
// //             <h2 className="text-lg font-semibold">Фільтри</h2>
// //             <Button
// //               variant="ghost"
// //               size="sm"
// //               onClick={clearFilters}
// //               icon={<RefreshCw size={14} />}
// //               className="text-sm text-gray-500 hover:text-green-600"
// //               aria-label="Скинути всі фільтри"
// //               disabled={!!isClearDisabled}
// //             >
// //               Скинути
// //             </Button>
// //           </div>
// //           {renderFilters()}
// //           <Button
// //             variant="primary"
// //             onClick={applyFilters}
// //             className="w-full mt-6"
// //             aria-label="Застосувати всі фільтри"
// //           >
// //             Застосувати фільтри
// //           </Button>
// //         </div>
// //       </div>
// //     </>
// //   );
// // };

// // export default FilterSidebar;



// // // import React, { useState, useEffect, useCallback, useMemo } from "react";
// // // import { useNavigate, useLocation } from "react-router-dom";
// // // import { useAppDispatch, useAppSelector } from "../../store";
// // // import { setFilters, resetFilters } from "../../store/catalogSlice";
// // // import { ChevronDown, ChevronUp, X, Filter, RefreshCw } from "lucide-react";
// // // import Button from "../common/Button";
// // // import useDebounce from "../../hooks/useDebounce";

// // // // Типи для компонента
// // // interface Category {
// // //   id: number;
// // //   name: string;
// // //   slug: string;
// // //   children?: Category[];
// // //   _count?: {
// // //     listings: number;
// // //   };
// // // }

// // // /**
// // //  * Інтерфейс для діапазону цін
// // //  */
// // // interface PriceRange {
// // //   min: string;
// // //   max: string;
// // // }

// // // /**
// // //  * Інтерфейс для параметрів фільтрації
// // //  */
// // // interface FilterParams {
// // //   categoryId?: number | null;
// // //   minPrice?: number | null;
// // //   maxPrice?: number | null;
// // //   location?: string | null;
// // //   search?: string | null;
// // //   condition?: string | null;
// // //   [key: string]: string | number | null | undefined;
// // // }

// // // interface FilterSidebarProps {
// // //   fixedCondition?: string; // Додатковий параметр для фіксованого значення condition
// // // }

// // // /**
// // //  * Компонент бічної панелі фільтрів
// // //  */
// // // const FilterSidebar: React.FC<FilterSidebarProps> = ({ fixedCondition }) => {
// // //   const dispatch = useAppDispatch();
// // //   const navigate = useNavigate();
// // //   const location = useLocation();

// // //   // Отримання стану з Redux
// // //   const { categories, filters } = useAppSelector((state) => state.catalog);

// // //   // Локальний стан компонента
// // //   const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
// // //   const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
// // //   const [priceRange, setPriceRange] = useState<PriceRange>({
// // //     min: "",
// // //     max: "",
// // //   });
// // //   const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
// // //   const [selectedCondition, setSelectedCondition] = useState<string>(
// // //     fixedCondition || (typeof filters.condition === 'string' ? filters.condition : "") || ""
// // //   );

// // //   // Використання дебаунсингу для цінового діапазону
// // //   const debouncedMinPrice = useDebounce(priceRange.min, 500);
// // //   const debouncedMaxPrice = useDebounce(priceRange.max, 500);

// // //   // Список локацій (регіонів)
// // //   const locations = useMemo<string[]>(
// // //     () => [
// // //       "Київська обл.",
// // //       "Львівська обл.",
// // //       "Одеська обл.",
// // //       "Харківська обл.",
// // //       "Дніпропетровська обл.",
// // //       "Запорізька обл.",
// // //       "Вінницька обл.",
// // //       "Полтавська обл.",
// // //       "Черкаська обл.",
// // //       "Миколаївська обл.",
// // //     ],
// // //     []
// // //   );

// // //   const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

// // //   // Опції для стану обладнання
// // //   const conditionOptions = useMemo(
// // //     () => [
// // //       { value: "", label: "Усі" },
// // //       { value: "new", label: "Нова" },
// // //       { value: "used", label: "Вживана" },
// // //     ],
// // //     []
// // //   );

// // //   /**
// // //    * Оновлення URL з параметрами фільтрації
// // //    */
// // //   const updateUrl = useCallback(
// // //     (params: FilterParams) => {
// // //       // Перевіряємо, чи компонент все ще змонтований
// // //       const searchParams = new URLSearchParams(location.search);

// // //       // Допоміжна функція для оновлення або видалення параметрів
// // //       const updateParam = (
// // //         key: string,
// // //         value: string | number | null | undefined
// // //       ) => {
// // //         if (value === null || value === undefined || value === "") {
// // //           searchParams.delete(key);
// // //         } else {
// // //           searchParams.set(key, String(value));
// // //         }
// // //       };

// // //       // Оновлюємо параметри
// // //       if ("categoryId" in params) updateParam("categoryId", params.categoryId);
// // //       if ("minPrice" in params) updateParam("minPrice", params.minPrice);
// // //       if ("maxPrice" in params) updateParam("maxPrice", params.maxPrice);
// // //       if ("location" in params) updateParam("location", params.location);
// // //       if ("search" in params) updateParam("search", params.search);
      
// // //       // Оновлюємо стан лише якщо він не фіксований
// // //       if ("condition" in params && !fixedCondition) {
// // //         updateParam("condition", params.condition);
// // //       }

// // //       // Збереження пошукового запиту, якщо він є
// // //       const search = searchParams.get("search");
// // //       if (search && !("search" in params)) {
// // //         searchParams.set("search", search);
// // //       }

// // //       // Додаємо фіксований стан, якщо він вказаний
// // //       if (fixedCondition) {
// // //         searchParams.set("condition", fixedCondition);
// // //       }

// // //       navigate(
// // //         {
// // //           pathname: location.pathname,
// // //           search: searchParams.toString(),
// // //         },
// // //         { replace: true }
// // //       );
// // //     },
// // //     [location.pathname, location.search, navigate, fixedCondition]
// // //   );

// // //   /**
// // //    * Розбір параметрів URL при завантаженні та зміні URL
// // //    */
// // //   useEffect(() => {
// // //     const searchParams = new URLSearchParams(location.search);

// // //     const categoryId = searchParams.get("categoryId");
// // //     const minPrice = searchParams.get("minPrice");
// // //     const maxPrice = searchParams.get("maxPrice");
// // //     const locationParam = searchParams.get("location");
// // //     const search = searchParams.get("search");
// // //     const condition = fixedCondition || searchParams.get("condition");

// // //     // Встановлення стану фільтрів з URL
// // //     setSelectedCategory(categoryId ? parseInt(categoryId, 10) : null);
// // //     setPriceRange({
// // //       min: minPrice || "",
// // //       max: maxPrice || "",
// // //     });
// // //     setSelectedLocations(locationParam ? [locationParam] : []);
// // //     setSelectedCondition(condition || "");

// // //     // Створюємо об'єкт фільтрів для Redux
// // //     const filterParams: FilterParams = {};
    
// // //     if (categoryId) filterParams.categoryId = parseInt(categoryId, 10);
// // //     if (minPrice) filterParams.minPrice = parseFloat(minPrice);
// // //     if (maxPrice) filterParams.maxPrice = parseFloat(maxPrice);
// // //     if (locationParam) filterParams.location = locationParam;
// // //     if (search) filterParams.search = search;
// // //     if (condition) filterParams.condition = condition;

// // //     // Оновлюємо Redux лише якщо є фільтри
// // //     dispatch(setFilters(filterParams));
// // //   }, [location.search, dispatch, fixedCondition]);

// // //   /**
// // //    * Ефект для автоматичного застосування цінового діапазону після дебаунсингу
// // //    */
// // //   useEffect(() => {
// // //     if (debouncedMinPrice !== "" || debouncedMaxPrice !== "") {
// // //       const minPrice = debouncedMinPrice !== ""
// // //         ? parseFloat(debouncedMinPrice)
// // //         : undefined;
// // //       const maxPrice = debouncedMaxPrice !== ""
// // //         ? parseFloat(debouncedMaxPrice)
// // //         : undefined;

// // //       if (minPrice !== filters.minPrice || maxPrice !== filters.maxPrice) {
// // //         const filterObj: FilterParams = {};
// // //         if (minPrice !== undefined) filterObj.minPrice = minPrice;
// // //         if (maxPrice !== undefined) filterObj.maxPrice = maxPrice;
        
// // //         dispatch(setFilters(filterObj));
// // //         updateUrl(filterObj);
// // //       }
// // //     }
// // //   }, [
// // //     debouncedMinPrice,
// // //     debouncedMaxPrice,
// // //     filters.minPrice,
// // //     filters.maxPrice,
// // //     dispatch,
// // //     updateUrl,
// // //   ]);

// // //   /**
// // //    * Обробник зміни категорії
// // //    */
// // //   const handleCategoryChange = useCallback(
// // //     (categoryId: number) => {
// // //       const newCategoryId =
// // //         selectedCategory === categoryId ? undefined : categoryId;
// // //       setSelectedCategory(newCategoryId ?? null);

// // //       const filterObj: FilterParams = {};
// // //       if (newCategoryId !== undefined) filterObj.categoryId = newCategoryId;
      
// // //       dispatch(setFilters(filterObj));
// // //       updateUrl(filterObj);
// // //     },
// // //     [selectedCategory, dispatch, updateUrl]
// // //   );

// // //   /**
// // //    * Обробник розгортання/згортання категорії
// // //    */
// // //   const toggleCategoryExpand = useCallback(
// // //     (categoryId: number, event?: React.MouseEvent) => {
// // //       if (event) {
// // //         event.preventDefault();
// // //         event.stopPropagation();
// // //       }

// // //       setExpandedCategories((prev) =>
// // //         prev.includes(categoryId)
// // //           ? prev.filter((id) => id !== categoryId)
// // //           : [...prev, categoryId]
// // //       );
// // //     },
// // //     []
// // //   );

// // //   /**
// // //    * Обробник зміни цінового діапазону
// // //    */
// // //   const handlePriceChange = useCallback(
// // //     (type: "min" | "max", value: string) => {
// // //       // Перевірка на валідне числове значення або порожній рядок
// // //       if (value === "" || /^\d+$/.test(value)) {
// // //         setPriceRange((prev) => ({ ...prev, [type]: value }));
// // //       }
// // //     },
// // //     []
// // //   );

// // //   /**
// // //    * Обробник зміни локації
// // //    */
// // //   const handleLocationChange = useCallback(
// // //     (location: string) => {
// // //       const isCurrentlySelected = selectedLocations.includes(location);
      
// // //       setSelectedLocations((prev) => {
// // //         // Для радіокнопок - якщо локація вже вибрана, знімаємо її вибір, інакше - встановлюємо
// // //         return isCurrentlySelected ? [] : [location];
// // //       });

// // //       // Відразу застосовуємо фільтр локації
// // //       const newLocation = isCurrentlySelected ? undefined : location;
      
// // //       dispatch(setFilters({ location: newLocation }));
// // //       updateUrl({ location: newLocation });
// // //     },
// // //     [selectedLocations, dispatch, updateUrl]
// // //   );

// // //   /**
// // //    * Обробник зміни стану (new/used)
// // //    */
// // //   const handleConditionChange = useCallback(
// // //     (condition: string) => {
// // //       if (fixedCondition) return; // Ігноруємо, якщо стан фіксований
      
// // //       setSelectedCondition(condition);
// // //       dispatch(setFilters({ condition }));
// // //       updateUrl({ condition });
// // //     },
// // //     [dispatch, updateUrl, fixedCondition]
// // //   );

// // //   /**
// // //    * Обробник застосування фільтрів
// // //    */
// // //   const applyFilters = useCallback(() => {
// // //     const minPrice = priceRange.min ? parseFloat(priceRange.min) : undefined;
// // //     const maxPrice = priceRange.max ? parseFloat(priceRange.max) : undefined;
// // //     const location =
// // //       selectedLocations.length > 0 ? selectedLocations[0] : undefined;

// // //     const filterObj: FilterParams = {
// // //       minPrice,
// // //       maxPrice,
// // //       location,
// // //     };
    
// // //     // Додаємо стан, якщо він не фіксований
// // //     if (!fixedCondition && selectedCondition) {
// // //       filterObj.condition = selectedCondition;
// // //     }
    
// // //     dispatch(setFilters(filterObj));
// // //     updateUrl(filterObj);

// // //     setIsMobileFiltersOpen(false);
// // //   }, [
// // //     priceRange, 
// // //     selectedLocations, 
// // //     selectedCondition, 
// // //     dispatch, 
// // //     updateUrl, 
// // //     fixedCondition
// // //   ]);

// // //   /**
// // //    * Обробник очищення фільтрів
// // //    */
// // //   const clearFilters = useCallback(() => {
// // //     setSelectedCategory(null);
// // //     setPriceRange({ min: "", max: "" });
// // //     setSelectedLocations([]);
    
// // //     // Скидаємо стан, якщо він не фіксований
// // //     if (!fixedCondition) {
// // //       setSelectedCondition("");
// // //     }

// // //     // Створюємо базовий об'єкт для скидання фільтрів
// // //     const resetObj: FilterParams = {};
    
// // //     // Якщо стан фіксований, зберігаємо його
// // //     if (fixedCondition) {
// // //       resetObj.condition = fixedCondition;
// // //     }

// // //     dispatch(resetFilters(resetObj));

// // //     // Зберігаємо пошуковий запит, якщо він є
// // //     const searchParams = new URLSearchParams(location.search);
// // //     const search = searchParams.get("search");
    
// // //     // Будуємо новий search параметр
// // //     let newSearch = "";
    
// // //     if (search) {
// // //       newSearch = `search=${search}`;
// // //     }
    
// // //     // Додаємо фіксований стан у URL, якщо він є
// // //     if (fixedCondition) {
// // //       newSearch += (newSearch ? "&" : "") + `condition=${fixedCondition}`;
// // //     }

// // //     navigate(`${location.pathname}${newSearch ? `?${newSearch}` : ""}`, { 
// // //       replace: true 
// // //     });

// // //     setIsMobileFiltersOpen(false);
// // //   }, [dispatch, location.pathname, location.search, navigate, fixedCondition]);

// // //   /**
// // //    * Рекурсивний рендер категорій з підкатегоріями
// // //    */
// // //   const renderCategory = useCallback(
// // //     (category: Category, depth = 0) => {
// // //       const hasChildren = category.children && category.children.length > 0;
// // //       const isExpanded = expandedCategories.includes(category.id);

// // //       return (
// // //         <div key={category.id} className="flex flex-col">
// // //           <div className="flex items-center justify-between">
// // //             <div className="flex items-center">
// // //               <input
// // //                 type="checkbox"
// // //                 id={`category-${category.id}`}
// // //                 checked={selectedCategory === category.id}
// // //                 onChange={() => handleCategoryChange(category.id)}
// // //                 className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
// // //                 aria-label={`Фільтрувати за категорією ${category.name}`}
// // //               />
// // //               <label
// // //                 htmlFor={`category-${category.id}`}
// // //                 className={`ml-2 text-sm text-gray-700 ${
// // //                   depth > 0 ? "font-normal" : "font-medium"
// // //                 }`}
// // //               >
// // //                 {category.name}
// // //                 {category._count && (
// // //                   <span className="text-gray-400 ml-1">
// // //                     ({category._count.listings})
// // //                   </span>
// // //                 )}
// // //               </label>
// // //             </div>

// // //             {hasChildren && (
// // //               <button
// // //                 type="button"
// // //                 onClick={(e) => toggleCategoryExpand(category.id, e)}
// // //                 className="text-gray-400 hover:text-gray-600 p-1"
// // //                 aria-expanded={isExpanded}
// // //                 aria-label={`${
// // //                   isExpanded ? "Згорнути" : "Розгорнути"
// // //                 } категорію ${category.name}`}
// // //               >
// // //                 {isExpanded ? (
// // //                   <ChevronUp size={16} />
// // //                 ) : (
// // //                   <ChevronDown size={16} />
// // //                 )}
// // //               </button>
// // //             )}
// // //           </div>

// // //           {/* Підкатегорії */}
// // //           {hasChildren && isExpanded && (
// // //             <div className={`ml-6 mt-2 space-y-2`}>
// // //               {category.children?.map((child) =>
// // //                 renderCategory(child, depth + 1)
// // //               )}
// // //             </div>
// // //           )}
// // //         </div>
// // //       );
// // //     },
// // //     [
// // //       expandedCategories,
// // //       selectedCategory,
// // //       handleCategoryChange,
// // //       toggleCategoryExpand,
// // //     ]
// // //   );

// // //   /**
// // //    * Рендеринг контенту фільтрів
// // //    */
// // //   const renderFilters = useCallback(
// // //     () => (
// // //       <>
// // //         {/* Стан обладнання (нове/вживане) - відображати, якщо фільтр не фіксований */}
// // //         {!fixedCondition && (
// // //           <div className="mb-6">
// // //             <h3 className="font-medium text-gray-900 mb-3">Стан техніки</h3>
// // //             <div className="space-y-2">
// // //               {conditionOptions.map((option) => (
// // //                 <div key={option.value} className="flex items-center">
// // //                   <input
// // //                     type="radio"
// // //                     id={`condition-${option.value}`}
// // //                     name="condition"
// // //                     value={option.value}
// // //                     checked={selectedCondition === option.value}
// // //                     onChange={() => handleConditionChange(option.value)}
// // //                     className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
// // //                   />
// // //                   <label
// // //                     htmlFor={`condition-${option.value}`}
// // //                     className="ml-2 text-sm text-gray-700"
// // //                   >
// // //                     {option.label}
// // //                   </label>
// // //                 </div>
// // //               ))}
// // //             </div>
// // //           </div>
// // //         )}

// // //         {/* Категорії */}
// // //         <div className="mb-6">
// // //           <h3 className="font-medium text-gray-900 mb-3">Категорії</h3>
// // //           <div className="space-y-2">
// // //             {categories.map((category) => renderCategory(category))}
// // //           </div>
// // //         </div>

// // //         {/* Ціна */}
// // //         <div className="mb-6">
// // //           <h3 className="font-medium text-gray-900 mb-3">Ціна</h3>
// // //           <div className="flex space-x-2">
// // //             <div className="w-1/2">
// // //               <label htmlFor="min-price" className="sr-only">
// // //                 Від
// // //               </label>
// // //               <input
// // //                 type="text"
// // //                 id="min-price"
// // //                 placeholder="Від"
// // //                 value={priceRange.min}
// // //                 onChange={(e) => handlePriceChange("min", e.target.value)}
// // //                 className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
// // //                 aria-label="Мінімальна ціна"
// // //               />
// // //             </div>
// // //             <div className="w-1/2">
// // //               <label htmlFor="max-price" className="sr-only">
// // //                 До
// // //               </label>
// // //               <input
// // //                 type="text"
// // //                 id="max-price"
// // //                 placeholder="До"
// // //                 value={priceRange.max}
// // //                 onChange={(e) => handlePriceChange("max", e.target.value)}
// // //                 className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
// // //                 aria-label="Максимальна ціна"
// // //               />
// // //             </div>
// // //           </div>
// // //         </div>

// // //         {/* Розташування */}
// // //         <div className="mb-6">
// // //           <h3 className="font-medium text-gray-900 mb-3">Розташування</h3>
// // //           <div className="max-h-48 overflow-y-auto space-y-2">
// // //             {locations.map((loc) => (
// // //               <div key={loc} className="flex items-center">
// // //                 <input
// // //                   type="radio"
// // //                   id={`location-${loc}`}
// // //                   name="location"
// // //                   checked={selectedLocations.includes(loc)}
// // //                   onChange={() => handleLocationChange(loc)}
// // //                   className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
// // //                   aria-label={`Вибрати регіон ${loc}`}
// // //                 />
// // //                 <label
// // //                   htmlFor={`location-${loc}`}
// // //                   className="ml-2 text-sm text-gray-700"
// // //                 >
// // //                   {loc}
// // //                 </label>
// // //               </div>
// // //             ))}
// // //           </div>
// // //         </div>
// // //       </>
// // //     ),
// // //     [
// // //       categories,
// // //       locations,
// // //       priceRange,
// // //       selectedLocations,
// // //       selectedCondition,
// // //       renderCategory,
// // //       handlePriceChange,
// // //       handleLocationChange,
// // //       handleConditionChange,
// // //       fixedCondition,
// // //       conditionOptions,
// // //     ]
// // //   );

// // //   return (
// // //     <>
// // //       {/* Мобільна кнопка фільтрів */}
// // //       <div className="lg:hidden flex justify-between items-center mb-4">
// // //         <Button 
// // //           variant="outline" 
// // //           onClick={() => setIsMobileFiltersOpen(true)}
// // //           icon={<Filter size={20} />}
// // //           aria-label="Відкрити фільтри"
// // //           aria-expanded={isMobileFiltersOpen}
// // //           aria-controls="mobile-filters"
// // //         >
// // //           Фільтри
// // //         </Button>

// // //         <Button 
// // //           variant="ghost" 
// // //           onClick={clearFilters}
// // //           icon={<RefreshCw size={14} />}
// // //           className="text-sm text-gray-500 hover:text-green-600"
// // //           aria-label="Скинути всі фільтри"
// // //           disabled={
// // //             !selectedCategory &&
// // //             !priceRange.min &&
// // //             !priceRange.max &&
// // //             selectedLocations.length === 0 &&
// // //             (!selectedCondition || selectedCondition === "")
// // //           }
// // //         >
// // //           Скинути
// // //         </Button>
// // //       </div>

// // //       {/* Мобільні фільтри (оверлей) */}
// // //       {isMobileFiltersOpen && (
// // //         <div
// // //           className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
// // //           role="dialog"
// // //           aria-modal="true"
// // //         >
// // //           <div
// // //             className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-lg overflow-y-auto"
// // //             id="mobile-filters"
// // //           >
// // //             <div className="p-4">
// // //               <div className="flex justify-between items-center mb-4">
// // //                 <h2 className="text-lg font-semibold">Фільтри</h2>
// // //                 <button
// // //                   type="button"
// // //                   onClick={() => setIsMobileFiltersOpen(false)}
// // //                   className="text-gray-500 hover:text-gray-700 p-1"
// // //                   aria-label="Закрити фільтри"
// // //                 >
// // //                   <X size={20} aria-hidden="true" />
// // //                 </button>
// // //               </div>

// // //               {renderFilters()}

// // //               <div className="mt-6 flex space-x-4">
// // //                 <Button
// // //                   variant="primary"
// // //                   onClick={applyFilters}
// // //                   className="flex-grow"
// // //                   aria-label="Застосувати фільтри"
// // //                 >
// // //                   Застосувати
// // //                 </Button>
// // //                 <Button
// // //                   variant="outline"
// // //                   onClick={clearFilters}
// // //                   aria-label="Скинути фільтри"
// // //                   disabled={
// // //                     !selectedCategory &&
// // //                     !priceRange.min &&
// // //                     !priceRange.max &&
// // //                     selectedLocations.length === 0 &&
// // //                     (!selectedCondition || fixedCondition || selectedCondition === "")
// // //                   }
// // //                 >
// // //                   Скинути
// // //                 </Button>
// // //               </div>
// // //             </div>
// // //           </div>
// // //         </div>
// // //       )}

// // //       {/* Десктопні фільтри */}
// // //       <div className="hidden lg:block" aria-label="Фільтри">
// // //         <div className="bg-white border border-gray-200 rounded-lg p-4">
// // //           <div className="flex justify-between items-center mb-4">
// // //             <h2 className="text-lg font-semibold">Фільтри</h2>
// // //             <Button
// // //               variant="ghost"
// // //               size="sm"
// // //               onClick={clearFilters}
// // //               icon={<RefreshCw size={14} />}
// // //               className="text-sm text-gray-500 hover:text-green-600"
// // //               aria-label="Скинути всі фільтри"
// // //               disabled={
// // //                 !selectedCategory &&
// // //                 !priceRange.min &&
// // //                 !priceRange.max &&
// // //                 selectedLocations.length === 0 &&
// // //                 (!selectedCondition || fixedCondition || selectedCondition === "")
// // //               }
// // //             >
// // //               Скинути
// // //             </Button>
// // //           </div>

// // //           {renderFilters()}

// // //           <Button
// // //             variant="primary"
// // //             onClick={applyFilters}
// // //             className="w-full mt-6"
// // //             aria-label="Застосувати всі фільтри"
// // //           >
// // //             Застосувати фільтри
// // //           </Button>
// // //         </div>
// // //       </div>
// // //     </>
// // //   );
// // // };

// // // export default FilterSidebar;



// // // // import { useState, useEffect, useCallback, useMemo } from "react";
// // // // import { useNavigate, useLocation } from "react-router-dom";
// // // // import { useAppDispatch, useAppSelector } from "@/store";
// // // // import { setFilters, resetFilters } from "@/store/catalogSlice";
// // // // import { ChevronDown, ChevronUp, X, Filter, RefreshCw } from "lucide-react";
// // // // import { Category } from "@/types/api";
// // // // import { useDebounce } from "@/hooks";

// // // // /**
// // // //  * Інтерфейс для діапазону цін
// // // //  */
// // // // interface PriceRange {
// // // //   min: string;
// // // //   max: string;
// // // // }

// // // // /**
// // // //  * Інтерфейс для параметрів фільтрації
// // // //  */
// // // // interface FilterParams {
// // // //   categoryId?: number;
// // // //   minPrice?: number;
// // // //   maxPrice?: number;
// // // //   location?: string;
// // // //   search?: string;
// // // // }

// // // // /**
// // // //  * Компонент бічної панелі фільтрів
// // // //  */
// // // // const FilterSidebar = () => {
// // // //   const dispatch = useAppDispatch();
// // // //   const navigate = useNavigate();
// // // //   const location = useLocation();

// // // //   // Отримання стану з Redux
// // // //   const { categories, filters } = useAppSelector((state) => state.catalog);

// // // //   // Локальний стан компонента
// // // //   const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
// // // //   const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
// // // //   const [priceRange, setPriceRange] = useState<PriceRange>({
// // // //     min: "",
// // // //     max: "",
// // // //   });
// // // //   const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

// // // //   // Використання дебаунсингу для цінового діапазону
// // // //   const debouncedMinPrice = useDebounce(priceRange.min, 500);
// // // //   const debouncedMaxPrice = useDebounce(priceRange.max, 500);

// // // //   // Список локацій (регіонів)
// // // //   const locations = useMemo<string[]>(
// // // //     () => [
// // // //       "Київська обл.",
// // // //       "Львівська обл.",
// // // //       "Одеська обл.",
// // // //       "Харківська обл.",
// // // //       "Дніпропетровська обл.",
// // // //       "Запорізька обл.",
// // // //       "Вінницька обл.",
// // // //       "Полтавська обл.",
// // // //       "Черкаська обл.",
// // // //       "Миколаївська обл.",
// // // //     ],
// // // //     [],
// // // //   );

// // // //   const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

// // // //   /**
// // // //    * Оновлення URL з параметрами фільтрації
// // // //    */
// // // //   const updateUrl = useCallback(
// // // //     (params: FilterParams) => {
// // // //       const searchParams = new URLSearchParams(location.search);

// // // //       // Допоміжна функція для оновлення або видалення параметрів
// // // //       const updateParam = (
// // // //         key: string,
// // // //         value: string | number | null | undefined,
// // // //       ) => {
// // // //         if (value === null || value === undefined || value === "") {
// // // //           searchParams.delete(key);
// // // //         } else {
// // // //           searchParams.set(key, String(value));
// // // //         }
// // // //       };

// // // //       if ("categoryId" in params) updateParam("categoryId", params.categoryId);
// // // //       if ("minPrice" in params) updateParam("minPrice", params.minPrice);
// // // //       if ("maxPrice" in params) updateParam("maxPrice", params.maxPrice);
// // // //       if ("location" in params) updateParam("location", params.location);
// // // //       if ("search" in params) updateParam("search", params.search);

// // // //       // Збереження пошукового запиту, якщо він є
// // // //       const search = searchParams.get("search");
// // // //       if (search && !("search" in params)) {
// // // //         searchParams.set("search", search);
// // // //       }

// // // //       navigate(
// // // //         {
// // // //           pathname: location.pathname,
// // // //           search: searchParams.toString(),
// // // //         },
// // // //         { replace: true },
// // // //       );
// // // //     },
// // // //     [location.search, location.pathname, navigate],
// // // //   );

// // // //   /**
// // // //    * Розбір параметрів URL при завантаженні та зміні URL
// // // //    */
// // // //   useEffect(() => {
// // // //     const searchParams = new URLSearchParams(location.search);

// // // //     const categoryId = searchParams.get("categoryId");
// // // //     const minPrice = searchParams.get("minPrice");
// // // //     const maxPrice = searchParams.get("maxPrice");
// // // //     const locationParam = searchParams.get("location");
// // // //     const search = searchParams.get("search");

// // // //     // Встановлення стану фільтрів з URL
// // // //     setSelectedCategory(categoryId ? parseInt(categoryId) : null);
// // // //     setPriceRange({
// // // //       min: minPrice || "",
// // // //       max: maxPrice || "",
// // // //     });
// // // //     setSelectedLocations(locationParam ? [locationParam] : []);

// // // //     // Створюємо об'єкт фільтрів для Redux
// // // //     const filterParams: FilterParams = {
// // // //       categoryId: undefined,
// // // //       minPrice: undefined,
// // // //       maxPrice: undefined,
// // // //       location: undefined,
// // // //       search: undefined,
// // // //     };
// // // //     if (categoryId) filterParams.categoryId = parseInt(categoryId);
// // // //     if (minPrice) filterParams.minPrice = parseFloat(minPrice);
// // // //     if (maxPrice) filterParams.maxPrice = parseFloat(maxPrice);
// // // //     if (locationParam) filterParams.location = locationParam;
// // // //     if (search) filterParams.search = search;

// // // //     // Оновлюємо Redux лише якщо є фільтри
// // // //     if (Object.keys(filterParams).length > 0) {
// // // //       dispatch(setFilters(filterParams));
// // // //     }
// // // //   }, [location.search, dispatch]);

// // // //   /**
// // // //    * Ефект для автоматичного застосування цінового діапазону після дебаунсингу
// // // //    */
// // // //   useEffect(() => {
// // // //     if (debouncedMinPrice || debouncedMaxPrice) {
// // // //       const minPrice = debouncedMinPrice
// // // //         ? parseFloat(debouncedMinPrice)
// // // //         : undefined;
// // // //       const maxPrice = debouncedMaxPrice
// // // //         ? parseFloat(debouncedMaxPrice)
// // // //         : undefined;

// // // //       if (minPrice !== filters.minPrice || maxPrice !== filters.maxPrice) {
// // // //         const filterObj: FilterParams = {};
// // // //         if (minPrice !== undefined) filterObj.minPrice = minPrice;
// // // //         if (maxPrice !== undefined) filterObj.maxPrice = maxPrice;
// // // //         dispatch(setFilters(filterObj));
// // // //         updateUrl(filterObj);
// // // //       }
// // // //     }
// // // //   }, [
// // // //     debouncedMinPrice,
// // // //     debouncedMaxPrice,
// // // //     dispatch,
// // // //     filters.minPrice,
// // // //     filters.maxPrice,
// // // //     updateUrl,
// // // //   ]);

// // // //   /**
// // // //    * Обробник зміни категорії
// // // //    */
// // // //   const handleCategoryChange = useCallback(
// // // //     (categoryId: number) => {
// // // //       const newCategoryId =
// // // //         selectedCategory === categoryId ? undefined : categoryId;
// // // //       setSelectedCategory(newCategoryId ?? null);

// // // //       const filterObj: FilterParams = {};
// // // //       if (newCategoryId !== undefined) filterObj.categoryId = newCategoryId;
// // // //       dispatch(setFilters(filterObj));
// // // //       updateUrl(
// // // //         newCategoryId !== undefined ? { categoryId: newCategoryId } : {},
// // // //       );
// // // //     },
// // // //     [selectedCategory, dispatch, updateUrl],
// // // //   );

// // // //   /**
// // // //    * Обробник розгортання/згортання категорії
// // // //    */
// // // //   const toggleCategoryExpand = useCallback(
// // // //     (categoryId: number, event?: React.MouseEvent) => {
// // // //       if (event) {
// // // //         event.preventDefault();
// // // //         event.stopPropagation();
// // // //       }

// // // //       setExpandedCategories((prev) =>
// // // //         prev.includes(categoryId)
// // // //           ? prev.filter((id) => id !== categoryId)
// // // //           : [...prev, categoryId],
// // // //       );
// // // //     },
// // // //     [],
// // // //   );

// // // //   /**
// // // //    * Обробник зміни цінового діапазону
// // // //    */
// // // //   const handlePriceChange = useCallback(
// // // //     (type: "min" | "max", value: string) => {
// // // //       // Перевірка на валідне числове значення
// // // //       const numValue = value === "" ? "" : value;

// // // //       setPriceRange((prev) => ({ ...prev, [type]: numValue }));
// // // //     },
// // // //     [],
// // // //   );

// // // //   /**
// // // //    * Обробник зміни локації
// // // //    */
// // // //   const handleLocationChange = useCallback(
// // // //     (location: string) => {
// // // //       setSelectedLocations((prev) => {
// // // //         // Для радіокнопок або чекбоксів для вибору регіону
// // // //         // Якщо локація вже вибрана, знімаємо її вибір, інакше - встановлюємо
// // // //         if (prev.includes(location)) {
// // // //           return [];
// // // //         } else {
// // // //           return [location];
// // // //         }
// // // //       });

// // // //       // Відразу застосовуємо фільтр локації
// // // //       const newLocation = selectedLocations.includes(location)
// // // //         ? undefined
// // // //         : location;
// // // //       if (typeof newLocation === "string") {
// // // //         dispatch(setFilters({ location: newLocation }));
// // // //         updateUrl({ location: newLocation });
// // // //       } else {
// // // //         dispatch(setFilters({}));
// // // //         updateUrl({});
// // // //       }
// // // //     },
// // // //     [selectedLocations, dispatch, updateUrl],
// // // //   );

// // // //   /**
// // // //    * Обробник застосування фільтрів
// // // //    */
// // // //   const applyFilters = useCallback(() => {
// // // //     const minPrice = priceRange.min ? parseFloat(priceRange.min) : undefined;
// // // //     const maxPrice = priceRange.max ? parseFloat(priceRange.max) : undefined;
// // // //     const location =
// // // //       selectedLocations.length > 0 ? selectedLocations[0] : undefined;

// // // //     const filterObj = {
// // // //       minPrice: minPrice,
// // // //       maxPrice: maxPrice,
// // // //       location: location,
// // // //     } as FilterParams;
// // // //     dispatch(setFilters(filterObj));
// // // //     updateUrl({ minPrice, maxPrice, location } as FilterParams);

// // // //     setIsMobileFiltersOpen(false);
// // // //   }, [priceRange, selectedLocations, dispatch, updateUrl]);

// // // //   /**
// // // //    * Обробник очищення фільтрів
// // // //    */
// // // //   const clearFilters = useCallback(() => {
// // // //     setSelectedCategory(null);
// // // //     setPriceRange({ min: "", max: "" });
// // // //     setSelectedLocations([]);

// // // //     dispatch(resetFilters());

// // // //     // Зберігаємо пошуковий запит, якщо він є
// // // //     const searchParams = new URLSearchParams(location.search);
// // // //     const search = searchParams.get("search");

// // // //     if (search) {
// // // //       navigate(`${location.pathname}?search=${search}`, { replace: true });
// // // //     } else {
// // // //       navigate(location.pathname, { replace: true });
// // // //     }

// // // //     setIsMobileFiltersOpen(false);
// // // //   }, [dispatch, location.pathname, location.search, navigate]);

// // // //   /**
// // // //    * Рекурсивний рендер категорій з підкатегоріями
// // // //    */
// // // //   const renderCategory = useCallback(
// // // //     (category: Category, depth = 0) => {
// // // //       const hasChildren = category.children && category.children.length > 0;
// // // //       const isExpanded = expandedCategories.includes(category.id);

// // // //       return (
// // // //         <div key={category.id} className="flex flex-col">
// // // //           <div className="flex items-center justify-between">
// // // //             <div className="flex items-center">
// // // //               <input
// // // //                 type="checkbox"
// // // //                 id={`category-${category.id}`}
// // // //                 checked={selectedCategory === category.id}
// // // //                 onChange={() => handleCategoryChange(category.id)}
// // // //                 className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
// // // //                 aria-label={`Фільтрувати за категорією ${category.name}`}
// // // //               />
// // // //               <label
// // // //                 htmlFor={`category-${category.id}`}
// // // //                 className={`ml-2 text-sm text-gray-700 ${depth > 0 ? "font-normal" : "font-medium"}`}
// // // //               >
// // // //                 {category.name}
// // // //                 {category._count && (
// // // //                   <span className="text-gray-400 ml-1">
// // // //                     ({category._count.listings})
// // // //                   </span>
// // // //                 )}
// // // //               </label>
// // // //             </div>

// // // //             {hasChildren && (
// // // //               <button
// // // //                 onClick={(e) => toggleCategoryExpand(category.id, e)}
// // // //                 className="text-gray-400 hover:text-gray-600 p-1"
// // // //                 aria-expanded={isExpanded}
// // // //                 aria-label={`${isExpanded ? "Згорнути" : "Розгорнути"} категорію ${category.name}`}
// // // //               >
// // // //                 {isExpanded ? (
// // // //                   <ChevronUp size={16} />
// // // //                 ) : (
// // // //                   <ChevronDown size={16} />
// // // //                 )}
// // // //               </button>
// // // //             )}
// // // //           </div>

// // // //           {/* Підкатегорії */}
// // // //           {hasChildren && isExpanded && (
// // // //             <div className={`ml-6 mt-2 space-y-2 pl-${depth + 1}`}>
// // // //               {category.children?.map((child) =>
// // // //                 renderCategory(child, depth + 1),
// // // //               )}
// // // //             </div>
// // // //           )}
// // // //         </div>
// // // //       );
// // // //     },
// // // //     [
// // // //       expandedCategories,
// // // //       selectedCategory,
// // // //       handleCategoryChange,
// // // //       toggleCategoryExpand,
// // // //     ],
// // // //   );

// // // //   /**
// // // //    * Рендеринг контенту фільтрів
// // // //    */
// // // //   const renderFilters = useCallback(
// // // //     () => (
// // // //       <>
// // // //         {/* Категорії */}
// // // //         <div className="mb-6">
// // // //           <h3 className="font-medium text-gray-900 mb-3">Категорії</h3>
// // // //           <div className="space-y-2">
// // // //             {categories.map((category) => renderCategory(category))}
// // // //           </div>
// // // //         </div>

// // // //         {/* Ціна */}
// // // //         <div className="mb-6">
// // // //           <h3 className="font-medium text-gray-900 mb-3">Ціна</h3>
// // // //           <div className="flex space-x-2">
// // // //             <div className="w-1/2">
// // // //               <label htmlFor="min-price" className="sr-only">
// // // //                 Від
// // // //               </label>
// // // //               <input
// // // //                 type="number"
// // // //                 id="min-price"
// // // //                 placeholder="Від"
// // // //                 value={priceRange.min}
// // // //                 onChange={(e) => handlePriceChange("min", e.target.value)}
// // // //                 min="0"
// // // //                 className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
// // // //                 aria-label="Мінімальна ціна"
// // // //               />
// // // //             </div>
// // // //             <div className="w-1/2">
// // // //               <label htmlFor="max-price" className="sr-only">
// // // //                 До
// // // //               </label>
// // // //               <input
// // // //                 type="number"
// // // //                 id="max-price"
// // // //                 placeholder="До"
// // // //                 value={priceRange.max}
// // // //                 onChange={(e) => handlePriceChange("max", e.target.value)}
// // // //                 min={priceRange.min || "0"}
// // // //                 className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
// // // //                 aria-label="Максимальна ціна"
// // // //               />
// // // //             </div>
// // // //           </div>
// // // //         </div>

// // // //         {/* Розташування */}
// // // //         <div className="mb-6">
// // // //           <h3 className="font-medium text-gray-900 mb-3">Розташування</h3>
// // // //           <div className="max-h-48 overflow-y-auto space-y-2">
// // // //             {locations.map((loc) => (
// // // //               <div key={loc} className="flex items-center">
// // // //                 <input
// // // //                   type="radio"
// // // //                   id={`location-${loc}`}
// // // //                   name="location"
// // // //                   checked={selectedLocations.includes(loc)}
// // // //                   onChange={() => handleLocationChange(loc)}
// // // //                   className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
// // // //                   aria-label={`Вибрати регіон ${loc}`}
// // // //                 />
// // // //                 <label
// // // //                   htmlFor={`location-${loc}`}
// // // //                   className="ml-2 text-sm text-gray-700"
// // // //                 >
// // // //                   {loc}
// // // //                 </label>
// // // //               </div>
// // // //             ))}
// // // //           </div>
// // // //         </div>
// // // //       </>
// // // //     ),
// // // //     [
// // // //       categories,
// // // //       locations,
// // // //       priceRange,
// // // //       selectedLocations,
// // // //       renderCategory,
// // // //       handlePriceChange,
// // // //       handleLocationChange,
// // // //     ],
// // // //   );

// // // //   return (
// // // //     <>
// // // //       {/* Мобільна кнопка фільтрів */}
// // // //       <div className="lg:hidden flex justify-between items-center mb-4">
// // // //         <button
// // // //           onClick={() => setIsMobileFiltersOpen(true)}
// // // //           className="flex items-center space-x-2 text-gray-700 hover:text-green-600"
// // // //           aria-label="Відкрити фільтри"
// // // //           aria-expanded={isMobileFiltersOpen}
// // // //           aria-controls="mobile-filters"
// // // //         >
// // // //           <Filter size={20} aria-hidden="true" />
// // // //           <span>Фільтри</span>
// // // //         </button>

// // // //         <button
// // // //           onClick={clearFilters}
// // // //           className="flex items-center space-x-1 text-gray-500 hover:text-green-600 text-sm"
// // // //           aria-label="Скинути всі фільтри"
// // // //           disabled={
// // // //             !selectedCategory &&
// // // //             !priceRange.min &&
// // // //             !priceRange.max &&
// // // //             selectedLocations.length === 0
// // // //           }
// // // //         >
// // // //           <RefreshCw size={14} aria-hidden="true" />
// // // //           <span>Скинути</span>
// // // //         </button>
// // // //       </div>

// // // //       {/* Мобільні фільтри (оверлей) */}
// // // //       {isMobileFiltersOpen && (
// // // //         <div
// // // //           className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
// // // //           role="dialog"
// // // //           aria-modal="true"
// // // //         >
// // // //           <div
// // // //             className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-lg overflow-y-auto"
// // // //             id="mobile-filters"
// // // //           >
// // // //             <div className="p-4">
// // // //               <div className="flex justify-between items-center mb-4">
// // // //                 <h2 className="text-lg font-semibold">Фільтри</h2>
// // // //                 <button
// // // //                   onClick={() => setIsMobileFiltersOpen(false)}
// // // //                   className="text-gray-500 hover:text-gray-700 p-1"
// // // //                   aria-label="Закрити фільтри"
// // // //                 >
// // // //                   <X size={20} aria-hidden="true" />
// // // //                 </button>
// // // //               </div>

// // // //               {renderFilters()}

// // // //               <div className="mt-6 flex space-x-4">
// // // //                 <button
// // // //                   onClick={applyFilters}
// // // //                   className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex-grow focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
// // // //                   aria-label="Застосувати фільтри"
// // // //                 >
// // // //                   Застосувати
// // // //                 </button>
// // // //                 <button
// // // //                   onClick={clearFilters}
// // // //                   className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
// // // //                   aria-label="Скинути фільтри"
// // // //                   disabled={
// // // //                     !selectedCategory &&
// // // //                     !priceRange.min &&
// // // //                     !priceRange.max &&
// // // //                     selectedLocations.length === 0
// // // //                   }
// // // //                 >
// // // //                   Скинути
// // // //                 </button>
// // // //               </div>
// // // //             </div>
// // // //           </div>
// // // //         </div>
// // // //       )}

// // // //       {/* Десктопні фільтри */}
// // // //       <div className="hidden lg:block" aria-label="Фільтри">
// // // //         <div className="bg-white border border-gray-200 rounded-lg p-4">
// // // //           <div className="flex justify-between items-center mb-4">
// // // //             <h2 className="text-lg font-semibold">Фільтри</h2>
// // // //             <button
// // // //               onClick={clearFilters}
// // // //               className="text-sm text-gray-500 hover:text-green-600 flex items-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
// // // //               aria-label="Скинути всі фільтри"
// // // //               disabled={
// // // //                 !selectedCategory &&
// // // //                 !priceRange.min &&
// // // //                 !priceRange.max &&
// // // //                 selectedLocations.length === 0
// // // //               }
// // // //             >
// // // //               <RefreshCw size={14} className="mr-1" aria-hidden="true" />
// // // //               Скинути
// // // //             </button>
// // // //           </div>

// // // //           {renderFilters()}

// // // //           <button
// // // //             onClick={applyFilters}
// // // //             className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 mt-6 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
// // // //             aria-label="Застосувати всі фільтри"
// // // //           >
// // // //             Застосувати фільтри
// // // //           </button>
// // // //         </div>
// // // //       </div>
// // // //     </>
// // // //   );
// // // // };

// // // // export default FilterSidebar;
