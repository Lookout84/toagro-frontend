import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { setFilters, resetFilters } from '../../store/catalogSlice';
import { ChevronDown, ChevronUp, X, Filter, RefreshCw } from 'lucide-react';

interface PriceRange {
  min: string;
  max: string;
}

const FilterSidebar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { categories, filters } = useAppSelector((state) => state.catalog);
  
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: '', max: '' });
  const [locations, setLocations] = useState<string[]>([
    'Київська обл.', 'Львівська обл.', 'Одеська обл.', 'Харківська обл.',
    'Дніпропетровська обл.', 'Запорізька обл.', 'Вінницька обл.',
    'Полтавська обл.', 'Черкаська обл.', 'Миколаївська обл.'
  ]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Парсинг параметрів URL при завантаженні
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    
    const categoryId = searchParams.get('categoryId');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const location = searchParams.get('location');
    const search = searchParams.get('search');
    
    // Встановлення стану фільтрів на основі URL
    setSelectedCategory(categoryId ? parseInt(categoryId) : null);
    setPriceRange({
      min: minPrice || '',
      max: maxPrice || ''
    });
    setSelectedLocations(location ? [location] : []);
    
    // Оновлення Redux стору
    dispatch(setFilters({
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      location: location || undefined,
      search: search || undefined
    }));
  }, [location.search, dispatch]);

  // Обробка зміни категорії
  const handleCategoryChange = (categoryId: number) => {
    // Якщо категорія вже вибрана, знімаємо вибір
    if (selectedCategory === categoryId) {
      setSelectedCategory(null);
      
      // Оновлюємо Redux та URL
      dispatch(setFilters({ categoryId: undefined }));
      updateUrl({ categoryId: null });
    } else {
      setSelectedCategory(categoryId);
      
      // Оновлюємо Redux та URL
      dispatch(setFilters({ categoryId }));
      updateUrl({ categoryId });
    }
  };

  // Розгортання/згортання категорії
  const toggleCategoryExpand = (categoryId: number) => {
    if (expandedCategories.includes(categoryId)) {
      setExpandedCategories(expandedCategories.filter(id => id !== categoryId));
    } else {
      setExpandedCategories([...expandedCategories, categoryId]);
    }
  };

  // Обробка зміни ціни
  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    setPriceRange(prev => ({ ...prev, [type]: value }));
  };

  // Обробка зміни регіону
  const handleLocationChange = (location: string) => {
    if (selectedLocations.includes(location)) {
      setSelectedLocations(selectedLocations.filter(loc => loc !== location));
    } else {
      setSelectedLocations([...selectedLocations, location]);
    }
  };

  // Застосування фільтрів
  const applyFilters = () => {
    const minPrice = priceRange.min ? parseFloat(priceRange.min) : undefined;
    const maxPrice = priceRange.max ? parseFloat(priceRange.max) : undefined;
    const location = selectedLocations.length > 0 ? selectedLocations[0] : undefined;
    
    // Оновлюємо Redux
    dispatch(setFilters({
      minPrice,
      maxPrice,
      location
    }));
    
    // Оновлюємо URL
    updateUrl({
      minPrice: minPrice || null,
      maxPrice: maxPrice || null,
      location: location || null
    });
    
    // Закриваємо мобільні фільтри
    setIsMobileFiltersOpen(false);
  };

  // Скидання всіх фільтрів
  const clearFilters = () => {
    setSelectedCategory(null);
    setPriceRange({ min: '', max: '' });
    setSelectedLocations([]);
    
    // Скидаємо фільтри в Redux
    dispatch(resetFilters());
    
    // Оновлюємо URL - видаляємо всі параметри фільтрації
    navigate(location.pathname);
    
    // Закриваємо мобільні фільтри
    setIsMobileFiltersOpen(false);
  };

  // Оновлення URL з параметрами фільтрації
  const updateUrl = (params: {
    categoryId?: number | null;
    minPrice?: number | null;
    maxPrice?: number | null;
    location?: string | null;
  }) => {
    const searchParams = new URLSearchParams(location.search);
    
    // Оновлюємо параметри
    if (params.categoryId !== undefined) {
      if (params.categoryId === null) {
        searchParams.delete('categoryId');
      } else {
        searchParams.set('categoryId', params.categoryId.toString());
      }
    }
    
    if (params.minPrice !== undefined) {
      if (params.minPrice === null) {
        searchParams.delete('minPrice');
      } else {
        searchParams.set('minPrice', params.minPrice.toString());
      }
    }
    
    if (params.maxPrice !== undefined) {
      if (params.maxPrice === null) {
        searchParams.delete('maxPrice');
      } else {
        searchParams.set('maxPrice', params.maxPrice.toString());
      }
    }
    
    if (params.location !== undefined) {
      if (params.location === null) {
        searchParams.delete('location');
      } else {
        searchParams.set('location', params.location);
      }
    }
    
    // Зберігаємо пошуковий запит, якщо він є
    const search = new URLSearchParams(location.search).get('search');
    if (search) {
      searchParams.set('search', search);
    }
    
    // Оновлюємо URL
    navigate({
      pathname: location.pathname,
      search: searchParams.toString()
    });
  };

  return (
    <>
      {/* Мобільна кнопка фільтра */}
      <div className="lg:hidden flex justify-between items-center mb-4">
        <button 
          onClick={() => setIsMobileFiltersOpen(true)}
          className="flex items-center space-x-2 text-gray-700 hover:text-green-600"
        >
          <Filter size={20} />
          <span>Фільтри</span>
        </button>
        
        <button 
          onClick={clearFilters}
          className="flex items-center space-x-1 text-gray-500 hover:text-green-600 text-sm"
        >
          <RefreshCw size={14} />
          <span>Скинути</span>
        </button>
      </div>
      
      {/* Мобільне вікно фільтрів */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-lg overflow-y-auto">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Фільтри</h2>
                <button 
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Фільтри для мобільної версії */}
              {renderFilters()}
              
              <div className="mt-6 flex space-x-4">
                <button 
                  onClick={applyFilters}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex-grow"
                >
                  Застосувати
                </button>
                <button 
                  onClick={clearFilters}
                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-100"
                >
                  Скинути
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Десктопна версія фільтрів */}
      <div className="hidden lg:block">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Фільтри</h2>
            <button 
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-green-600 flex items-center"
            >
              <RefreshCw size={14} className="mr-1" />
              Скинути
            </button>
          </div>
          
          {renderFilters()}
          
          <button 
            onClick={applyFilters}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 mt-6"
          >
            Застосувати фільтри
          </button>
        </div>
      </div>
    </>
  );
  
  // Функція для рендерингу фільтрів
  function renderFilters() {
    return (
      <>
        {/* Категорії */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Категорії</h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.id} className="flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`category-${category.id}`}
                      checked={selectedCategory === category.id}
                      onChange={() => handleCategoryChange(category.id)}
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <label
                      htmlFor={`category-${category.id}`}
                      className="ml-2 text-sm text-gray-700"
                    >
                      {category.name}
                      {category._count && (
                        <span className="text-gray-400 ml-1">
                          ({category._count.listings})
                        </span>
                      )}
                    </label>
                  </div>
                  
                  {/* Кнопка розгортання, якщо є дочірні категорії */}
                  {category.children && category.children.length > 0 && (
                    <button
                      onClick={() => toggleCategoryExpand(category.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {expandedCategories.includes(category.id) ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>
                  )}
                </div>
                
                {/* Дочірні категорії */}
                {category.children && 
                 category.children.length > 0 && 
                 expandedCategories.includes(category.id) && (
                  <div className="ml-6 mt-2 space-y-2">
                    {category.children.map((child) => (
                      <div key={child.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`category-${child.id}`}
                          checked={selectedCategory === child.id}
                          onChange={() => handleCategoryChange(child.id)}
                          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <label
                          htmlFor={`category-${child.id}`}
                          className="ml-2 text-sm text-gray-700"
                        >
                          {child.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
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
                onChange={(e) => handlePriceChange('min', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
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
                onChange={(e) => handlePriceChange('max', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
        
        {/* Розташування */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Розташування</h3>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {locations.map((location) => (
              <div key={location} className="flex items-center">
                <input
                  type="checkbox"
                  id={`location-${location}`}
                  checked={selectedLocations.includes(location)}
                  onChange={() => handleLocationChange(location)}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label
                  htmlFor={`location-${location}`}
                  className="ml-2 text-sm text-gray-700"
                >
                  {location}
                </label>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }
};

export default FilterSidebar;