import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { 
  fetchCategories, 
  fetchCategoryBySlug, 
  fetchListings, 
  setFilters, 
  setCurrentPage, 
  Listing 
} from '../store/catalogSlice';
import FilterSidebar from '../components/ui/FilterSidebar';
import ListingCard from '../components/ui/ListingCard';
import { 
  Grid, 
  List, 
  SortAsc, 
  SortDesc, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Scale,
  X
} from 'lucide-react';

const CatalogPage = () => {
  const { categorySlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { 
    categories, 
    currentCategory, 
    listings, 
    filters, 
    meta, 
    status 
  } = useAppSelector((state) => state.catalog);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSort, setSelectedSort] = useState<{
    field: 'createdAt' | 'price' | 'views';
    order: 'asc' | 'desc';
  }>({ field: 'createdAt', order: 'desc' });
  const [compareList, setCompareList] = useState<Listing[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  
  // Початкове завантаження даних та встановлення фільтрів з URL
  useEffect(() => {
    // Завантаження категорій, якщо вони ще не завантажені
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }
    
    // Завантаження категорії за slug, якщо вказано
    if (categorySlug && (!currentCategory || currentCategory.slug !== categorySlug)) {
      dispatch(fetchCategoryBySlug(categorySlug));
    }
    
    // Парсинг параметрів URL
    const searchParams = new URLSearchParams(location.search);
    const urlFilters: any = {};
    
    // Перевірка кожного можливого параметра фільтра
    if (searchParams.has('search')) {
      urlFilters.search = searchParams.get('search');
      setSearchTerm(urlFilters.search);
    }
    
    if (searchParams.has('category')) {
      urlFilters.category = searchParams.get('category');
    }
    
    if (searchParams.has('categoryId')) {
      urlFilters.categoryId = parseInt(searchParams.get('categoryId') || '0');
    }
    
    if (searchParams.has('minPrice')) {
      urlFilters.minPrice = parseFloat(searchParams.get('minPrice') || '0');
    }
    
    if (searchParams.has('maxPrice')) {
      urlFilters.maxPrice = parseFloat(searchParams.get('maxPrice') || '0');
    }
    
    if (searchParams.has('location')) {
      urlFilters.location = searchParams.get('location');
    }
    
    if (searchParams.has('sortBy')) {
      urlFilters.sortBy = searchParams.get('sortBy');
      
      if (searchParams.has('sortOrder')) {
        urlFilters.sortOrder = searchParams.get('sortOrder');
        
        setSelectedSort({
          field: urlFilters.sortBy as any,
          order: urlFilters.sortOrder as any
        });
      }
    }
    
    if (searchParams.has('page')) {
      urlFilters.page = parseInt(searchParams.get('page') || '1');
    }
    
    // Встановлення фільтрів з URL, тільки якщо вони є
    if (Object.keys(urlFilters).length > 0) {
      dispatch(setFilters(urlFilters));
    }
  }, [dispatch, categorySlug, categories.length, location.search, currentCategory]);
  
  // Завантаження оголошень при зміні фільтрів
  useEffect(() => {
    dispatch(fetchListings(filters));
  }, [dispatch, filters]);
  
  // Функція для зміни сторінки пагінації
  const handlePageChange = (page: number) => {
    dispatch(setCurrentPage(page));
    
    // Оновлення URL
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('page', page.toString());
    navigate({
      pathname: location.pathname,
      search: searchParams.toString()
    });
    
    // Прокрутка до верху сторінки
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Функція для зміни сортування
  const handleSortChange = (field: 'createdAt' | 'price' | 'views') => {
    // Якщо вибрано те саме поле, змінюємо порядок сортування
    const order = 
      selectedSort.field === field && selectedSort.order === 'desc' 
        ? 'asc' 
        : 'desc';
    
    setSelectedSort({ field, order });
    
    // Оновлення Redux та URL
    dispatch(setFilters({ sortBy: field, sortOrder: order }));
    
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('sortBy', field);
    searchParams.set('sortOrder', order);
    navigate({
      pathname: location.pathname,
      search: searchParams.toString()
    });
  };
  
  // Функція для виконання пошуку
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Оновлення Redux та URL
    dispatch(setFilters({ search: searchTerm, page: 1 }));
    
    const searchParams = new URLSearchParams(location.search);
    if (searchTerm) {
      searchParams.set('search', searchTerm);
    } else {
      searchParams.delete('search');
    }
    searchParams.set('page', '1');
    navigate({
      pathname: location.pathname,
      search: searchParams.toString()
    });
  };
  
  // Функція для додавання/видалення оголошення для порівняння
  const handleToggleCompare = (listing: Listing, isSelected: boolean) => {
    if (isSelected) {
      // Перевіряємо, чи не перевищено ліміт на 3 оголошення
      if (compareList.length < 3) {
        setCompareList([...compareList, listing]);
      } else {
        alert('Ви можете порівняти максимум 3 позиції');
      }
    } else {
      setCompareList(compareList.filter(item => item.id !== listing.id));
    }
  };
  
  // Функція для видалення всіх оголошень з порівняння
  const clearCompareList = () => {
    setCompareList([]);
    setCompareMode(false);
  };
  
  // Побудова заголовка сторінки
  const getPageTitle = () => {
    if (currentCategory) {
      return currentCategory.name;
    }
    
    if (filters.search) {
      return `Результати пошуку: ${filters.search}`;
    }
    
    return 'Каталог техніки та запчастин';
  };
  
  // Перевірка, чи оголошення вже додано до порівняння
  const isInCompareList = (id: number) => {
    return compareList.some(item => item.id === id);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Бічна панель з фільтрами */}
        <aside className="lg:w-1/4">
          <FilterSidebar />
        </aside>
        
        {/* Основний контент */}
        <div className="lg:w-3/4">
          {/* Заголовок та інформація про категорію */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{getPageTitle()}</h1>
            {currentCategory && currentCategory.description && (
              <p className="text-gray-600">{currentCategory.description}</p>
            )}
          </div>
          
          {/* Панель пошуку та фільтрації */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Форма пошуку */}
              <form onSubmit={handleSearch} className="md:w-1/3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Пошук в каталозі..."
                    className="w-full py-2 px-4 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button 
                    type="submit" 
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-green-500"
                  >
                    <Search size={20} />
                  </button>
                </div>
              </form>
              
              {/* Елементи управління */}
              <div className="flex items-center space-x-4">
                {/* Сортування */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 hidden md:inline">Сортувати:</span>
                  <button
                    onClick={() => handleSortChange('createdAt')}
                    className={`px-3 py-1 rounded-md text-sm flex items-center ${
                      selectedSort.field === 'createdAt' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    За датою
                    {selectedSort.field === 'createdAt' && (
                      selectedSort.order === 'desc' ? <SortDesc size={16} className="ml-1" /> : <SortAsc size={16} className="ml-1" />
                    )}
                  </button>
                  <button
                    onClick={() => handleSortChange('price')}
                    className={`px-3 py-1 rounded-md text-sm flex items-center ${
                      selectedSort.field === 'price' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    За ціною
                    {selectedSort.field === 'price' && (
                      selectedSort.order === 'desc' ? <SortDesc size={16} className="ml-1" /> : <SortAsc size={16} className="ml-1" />
                    )}
                  </button>
                </div>
                
                {/* Вид відображення */}
                <div className="flex space-x-1 border border-gray-200 rounded-md">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${
                      viewMode === 'grid' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Grid size={20} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${
                      viewMode === 'list' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <List size={20} />
                  </button>
                </div>
                
                {/* Кнопка порівняння */}
                <button
                  onClick={() => setCompareMode(!compareMode)}
                  className={`px-3 py-2 rounded-md text-sm flex items-center ${
                    compareMode
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  disabled={compareList.length === 0}
                >
                  <Scale size={16} className="mr-1" />
                  <span className="hidden md:inline">Порівняти</span>
                  {compareList.length > 0 && (
                    <span className="ml-1 bg-green-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {compareList.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Панель порівняння */}
          {compareList.length > 0 && compareMode && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-900">Порівняння товарів</h3>
                <button 
                  onClick={clearCompareList}
                  className="text-gray-500 hover:text-red-600"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex flex-wrap gap-4">
                {compareList.map(listing => (
                  <div key={listing.id} className="relative flex items-center p-2 bg-gray-50 rounded-md">
                    <img 
                      src={listing.images[0] || 'https://via.placeholder.com/50'} 
                      alt={listing.title}
                      className="w-10 h-10 object-cover rounded-md mr-2"
                    />
                    <span className="text-sm text-gray-700">{listing.title}</span>
                    <button 
                      onClick={() => handleToggleCompare(listing, false)}
                      className="ml-2 text-gray-400 hover:text-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                
                <div className="mt-4 w-full">
                  <button
                    onClick={() => navigate('/profile/compare', { state: { listings: compareList } })}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    disabled={compareList.length < 2}
                  >
                    Порівняти вибрані позиції
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Результати та інформація про кількість */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-600">
              Знайдено {meta.total} оголошень
            </p>
            {meta.pages > 1 && (
              <p className="text-gray-600">
                Сторінка {meta.page} з {meta.pages}
              </p>
            )}
          </div>
          
          {/* Список оголошень */}
          {status === 'loading' ? (
            // Заглушки для відображення під час завантаження
            <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-3 gap-6' : 'grid-cols-1 gap-4'}`}>
              {Array(9).fill(null).map((_, index) => (
                <div
                  key={index}
                  className={`bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse ${
                    viewMode === 'list' ? 'flex' : ''
                  }`}
                >
                  <div 
                    className={`${
                      viewMode === 'list' 
                        ? 'w-1/3 bg-gray-200'
                        : 'aspect-w-16 aspect-h-10 bg-gray-200'
                    }`}
                  ></div>
                  <div className="p-4 flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                    <div className="h-6 bg-gray-200 rounded mb-2 w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length > 0 ? (
            // Відображення оголошень
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-4'
            }>
              {listings.map(listing => (
                <div 
                  key={listing.id}
                  className={viewMode === 'list' ? 'bg-white border border-gray-200 rounded-lg overflow-hidden flex' : ''}
                >
                  {viewMode === 'list' ? (
                    // Вигляд списком
                    <>
                      <div className="w-1/3 relative">
                        <img
                          src={listing.images[0] || 'https://via.placeholder.com/300x200?text=Немає+фото'}
                          alt={listing.title}
                          className="object-cover w-full h-full"
                        />
                        {/* Кнопка додавання до порівняння */}
                        <button
                          onClick={() => handleToggleCompare(listing, !isInCompareList(listing.id))}
                          className={`absolute top-2 right-2 p-2 rounded-full ${
                            isInCompareList(listing.id)
                              ? 'bg-green-500 text-white' 
                              : 'bg-white text-gray-700 hover:bg-gray-100'
                          } shadow transition-colors z-10`}
                        >
                          <Scale size={18} />
                        </button>
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {listing.title}
                        </h3>
                        <p className="text-xl font-bold text-gray-900 mb-2">
                          {new Intl.NumberFormat('uk-UA', {
                            style: 'currency',
                            currency: 'UAH',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(listing.price)}
                        </p>
                        <p className="text-gray-600 mb-2 line-clamp-2">{listing.description}</p>
                        <div className="flex items-center text-gray-600 text-sm mb-2">
                          <span>{listing.location}</span>
                          <span className="mx-2">•</span>
                          <span>{new Date(listing.createdAt).toLocaleDateString('uk-UA')}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    // Вигляд сіткою
                    <ListingCard 
                      listing={listing} 
                      compareEnabled={true}
                      onToggleCompare={handleToggleCompare}
                      isSelected={isInCompareList(listing.id)}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Повідомлення, якщо немає оголошень
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">На жаль, за вашим запитом нічого не знайдено</h3>
              <p className="text-gray-600 mb-4">Спробуйте змінити параметри пошуку або фільтри</p>
              <button 
                onClick={() => {
                  dispatch(resetFilters());
                  navigate('/catalog');
                }}
                className="text-green-600 hover:text-green-700"
              >
                Скинути всі фільтри
              </button>
            </div>
          )}
          
          {/* Пагінація */}
          {meta.pages > 1 && (
            <div className="flex justify-center mt-8">
              <nav className="flex items-center space-x-2">
                {/* Кнопка попередньої сторінки */}
                <button
                  onClick={() => handlePageChange(meta.page - 1)}
                  disabled={meta.page === 1}
                  className={`w-10 h-10 rounded-md flex items-center justify-center ${
                    meta.page === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <ChevronLeft size={20} />
                </button>
                
                {/* Номери сторінок */}
                {Array.from({ length: meta.pages }, (_, i) => i + 1)
                  .filter(page => {
                    // Показувати тільки сторінки в діапазоні 2 від поточної та першу/останню
                    return (
                      page === 1 ||
                      page === meta.pages ||
                      Math.abs(page - meta.page) <= 2
                    );
                  })
                  .map((page, index, array) => {
                    // Додаємо візуальний роздільник, якщо є пропуски
                    const showEllipsis = index > 0 && array[index - 1] !== page - 1;
                    
                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && (
                          <span className="text-gray-500">...</span>
                        )}
                        <button
                          onClick={() => handlePageChange(page)}
                          className={`w-10 h-10 rounded-md flex items-center justify-center ${
                            page === meta.page
                              ? 'bg-green-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
                
                {/* Кнопка наступної сторінки */}
                <button
                  onClick={() => handlePageChange(meta.page + 1)}
                  disabled={meta.page === meta.pages}
                  className={`w-10 h-10 rounded-md flex items-center justify-center ${
                    meta.page === meta.pages
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <ChevronRight size={20} />
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CatalogPage;