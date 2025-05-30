import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import {
  fetchCategories,
  fetchCategoryBySlug,
  fetchListings,
  setFilters,
  setCurrentPage,
  Listing,
} from "../store/catalogSlice";
import FilterSidebar from "../components/ui/FilterSidebar";
import ListingCard from "../components/ui/ListingCard";
import {
  Grid,
  List,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight,
  Search,
  Scale,
  X,
} from "lucide-react";

// Типи для сортування
interface SortOption {
  field: 'createdAt' | 'price' | 'views';
  order: 'asc' | 'desc';
}

// Типи для фільтрів
interface UrlFilters {
  search?: string;
  category?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  sortBy?: 'createdAt' | 'price' | 'views';
  sortOrder?: 'asc' | 'desc';
  page?: number;
}

const CatalogPage: React.FC = () => {
  const { categorySlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { categories, currentCategory, listings, filters, meta, status, error } =
    useAppSelector((state) => state.catalog);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSort, setSelectedSort] = useState<SortOption>({ 
    field: 'createdAt', 
    order: 'desc' 
  });
  const [compareList, setCompareList] = useState<Listing[]>([]);
  const [compareMode, setCompareMode] = useState(false);

  // Мемоізований заголовок сторінки
  const pageTitle = useMemo(() => {
    if (currentCategory) {
      return currentCategory.name;
    }
    if (filters.search) {
      return `Результати пошуку: ${filters.search}`;
    }
    return "Каталог техніки та запчастин";
  }, [currentCategory, filters.search]);

  // Мемоізована перевірка чи є оголошення в списку порівняння
  const isInCompareList = useCallback((id: number) => {
    return compareList.some((item) => item.id === id);
  }, [compareList]);

  // Тип для локації
  interface LocationType {
    settlement?: string;
    community?: { name?: string };
    region?: { name?: string };
    country?: { name?: string };
  }

  // Форматування локації
const renderLocation = useCallback((locationObj: LocationType | undefined) => {
  if (!locationObj) return "Місцезнаходження не вказано";
  
  // Перевіряємо чи це рядок
  if (typeof locationObj === "string") return locationObj;
  
  // Інакше це об'єкт
  const parts = [
    locationObj.settlement,
    locationObj.community?.name,
    locationObj.region?.name,
    locationObj.country?.name,
  ].filter(Boolean);
  
  return parts.length > 0 ? parts.join(", ") : "Місцезнаходження не вказано";
}, []);


  // const renderLocation = useCallback((locationObj: LocationType | undefined) => {
  //   if (!locationObj) return "";
  //   const parts = [
  //     locationObj.settlement,
  //     locationObj.community?.name,
  //     locationObj.region?.name,
  //     locationObj.country?.name,
  //   ].filter(Boolean);
  //   return parts.join(", ");
  // }, []);

  // Завантаження даних при монтуванні та зміні параметрів
  useEffect(() => {
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }

    if (categorySlug && currentCategory?.slug !== categorySlug) {
      dispatch(fetchCategoryBySlug(categorySlug));
    }

    const searchParams = new URLSearchParams(location.search);
    const urlFilters: UrlFilters = {};

    searchParams.forEach((value, key) => {
      switch (key) {
        case 'search':
          urlFilters.search = value;
          setSearchTerm(value);
          break;
        case 'category':
          urlFilters.category = value;
          break;
        case 'categoryId':
          urlFilters.categoryId = parseInt(value || '0');
          break;
        case 'minPrice':
          urlFilters.minPrice = parseFloat(value || '0');
          break;
        case 'maxPrice':
          urlFilters.maxPrice = parseFloat(value || '0');
          break;
        case 'location':
          urlFilters.location = value;
          break;
        case 'sortBy':
          if (['createdAt', 'price', 'views'].includes(value)) {
            urlFilters.sortBy = value as 'createdAt' | 'price' | 'views';
            if (searchParams.has('sortOrder')) {
              urlFilters.sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc';
              setSelectedSort({
                field: value as 'createdAt' | 'price' | 'views',
                order: urlFilters.sortOrder as 'asc' | 'desc',
              });
            }
          }
          break;
        case 'page':
          urlFilters.page = parseInt(value || '1');
          break;
      }
    });

    if (Object.keys(urlFilters).length > 0) {
      dispatch(setFilters(urlFilters as any));
    }
  }, [dispatch, categorySlug, categories.length, location.search, currentCategory?.slug]);

  // Завантаження оголошень при зміні фільтрів
  useEffect(() => {
    dispatch(fetchListings(filters));
  }, [dispatch, filters]);

  // Зміна сторінки з оновленням URL
  const handlePageChange = useCallback((page: number) => {
    dispatch(setCurrentPage(page));
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('page', page.toString());
    navigate({
      pathname: location.pathname,
      search: searchParams.toString(),
    }, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [dispatch, location.pathname, location.search, navigate]);

  // Зміна сортування
  const handleSortChange = useCallback((field: 'createdAt' | 'price' | 'views') => {
    const order = selectedSort.field === field && selectedSort.order === 'desc' ? 'asc' : 'desc';
    const newSort: SortOption = { field, order: order as 'asc' | 'desc' };

    setSelectedSort(newSort);
    dispatch(setFilters({ sortBy: field, sortOrder: order }));

    const searchParams = new URLSearchParams(location.search);
    searchParams.set('sortBy', field);
    searchParams.set('sortOrder', order);
    navigate({
      pathname: location.pathname,
      search: searchParams.toString(),
    }, { replace: true });
  }, [dispatch, location.pathname, location.search, navigate, selectedSort]);

  // Пошук
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSearchTerm = searchTerm.trim();

    dispatch(setFilters({ search: trimmedSearchTerm, page: 1 }));

    const searchParams = new URLSearchParams(location.search);
    if (trimmedSearchTerm) {
      searchParams.set('search', trimmedSearchTerm);
    } else {
      searchParams.delete('search');
    }
    searchParams.set('page', '1');
    navigate({
      pathname: location.pathname,
      search: searchParams.toString(),
    }, { replace: true });
  }, [dispatch, location.pathname, location.search, navigate, searchTerm]);

  // Додавання/видалення зі списку порівняння
  const handleToggleCompare = useCallback((listing: Listing, isSelected: boolean) => {
    if (isSelected) {
      if (compareList.length < 3) {
        setCompareList([...compareList, listing]);
      } else {
        alert("Ви можете порівняти максимум 3 позиції");
      }
    } else {
      setCompareList(compareList.filter((item) => item.id !== listing.id));
    }
  }, [compareList]);

  // Очищення списку порівняння
  const clearCompareList = useCallback(() => {
    setCompareList([]);
    setCompareMode(false);
  }, []);

  // Компонент пагінації
  const Pagination = useMemo(() => {
    if (!meta || meta.pages <= 1) return null;

    return (
      <div className="flex justify-center mt-8">
        <nav className="flex items-center space-x-2" aria-label="Пагінація">
          <button
            onClick={() => handlePageChange(meta.page - 1)}
            disabled={meta.page === 1}
            aria-label="Попередня сторінка"
            className={`w-10 h-10 rounded-md flex items-center justify-center ${
              meta.page === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <ChevronLeft size={20} />
          </button>

          {Array.from({ length: meta.pages }, (_, i) => i + 1)
            .filter((page) => (
              page === 1 || page === meta.pages || Math.abs(page - meta.page) <= 2
            ))
            .map((page, index, array) => {
              const showEllipsis = index > 0 && array[index - 1] !== page - 1;
              return (
                <React.Fragment key={page}>
                  {showEllipsis && <span className="text-gray-500">...</span>}
                  <button
                    onClick={() => handlePageChange(page)}
                    aria-label={`Сторінка ${page}`}
                    aria-current={page === meta.page ? 'page' : undefined}
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

          <button
            onClick={() => handlePageChange(meta.page + 1)}
            disabled={meta.page === meta.pages}
            aria-label="Наступна сторінка"
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
    );
  }, [handlePageChange, meta]);

  // Компонент панелі порівняння
  const ComparePanel = useMemo(() => {
    if (compareList.length === 0 || !compareMode) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-gray-900">Порівняння товарів</h3>
          <button
            onClick={clearCompareList}
            aria-label="Закрити порівняння"
            className="text-gray-500 hover:text-red-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-wrap gap-4">
          {compareList.map((listing) => (
            <div
              key={listing.id}
              className="relative flex items-center p-2 bg-gray-50 rounded-md"
            >
              <img
                src={listing.images[0] || "https://via.placeholder.com/50"}
                alt={listing.title}
                className="w-10 h-10 object-cover rounded-md mr-2"
                loading="lazy"
              />
              <span className="text-sm text-gray-700">
                {listing.title}
              </span>
              <button
                onClick={() => handleToggleCompare(listing, false)}
                aria-label={`Видалити ${listing.title} з порівняння`}
                className="ml-2 text-gray-400 hover:text-red-600"
              >
                <X size={16} />
              </button>
            </div>
          ))}

          <div className="mt-4 w-full">
            <button
              onClick={() => navigate("/profile/compare", {
                state: { listings: compareList },
              })}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              disabled={compareList.length < 2}
              aria-disabled={compareList.length < 2}
            >
              Порівняти вибрані позиції
            </button>
          </div>
        </div>
      </div>
    );
  }, [clearCompareList, compareList, compareMode, handleToggleCompare, navigate]);

  // Компонент результатів пошуку
  const SearchResults = useMemo(() => {
    if (status === 'loading') {
      return (
        <div
          className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-3 gap-6' : 'grid-cols-1 gap-4'}`}
        >
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
      );
    }

    if (listings.length > 0) {
      return (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          {listings.map((listing) => (
            <div
              key={listing.id}
              className={
                viewMode === 'list'
                  ? 'bg-white border border-gray-200 rounded-lg overflow-hidden flex'
                  : ''
              }
            >
              {viewMode === 'list' ? (
                <>
                  <div className="w-1/3 relative">
                    <img
                      src={
                        listing.images[0] ||
                        'https://via.placeholder.com/300x200?text=Немає+фото'
                      }
                      alt={listing.title}
                      className="object-cover w-full h-full"
                      loading="lazy"
                    />
                    <button
                      onClick={() => handleToggleCompare(listing, !isInCompareList(listing.id))}
                      aria-label={`${isInCompareList(listing.id) ? 'Видалити з' : 'Додати до'} порівняння`}
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
                    <p className="text-gray-600 mb-2 line-clamp-2">
                      {listing.description}
                    </p>
                    <div className="flex items-center text-gray-600 text-sm mb-2">
                      <span>{typeof listing.location === "string" ? listing.location : renderLocation(listing.location)}</span>
                      <span className="mx-2">•</span>
                      <span>
                        {new Date(listing.createdAt).toLocaleDateString('uk-UA')}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
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
      );
    }

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          На жаль, за вашим запитом нічого не знайдено
        </h3>
        <p className="text-gray-600 mb-4">
          Спробуйте змінити параметри пошуку або фільтри
        </p>
        <button
          onClick={() => {
            dispatch(setFilters({}));
            navigate('/catalog');
          }}
          className="text-green-600 hover:text-green-700"
        >
          Скинути всі фільтри
        </button>
      </div>
    );
  }, [status, listings, viewMode, handleToggleCompare, isInCompareList, renderLocation, dispatch, navigate]);

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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {pageTitle}
            </h1>
            {currentCategory?.description && (
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
                    aria-label="Пошук в каталозі"
                  />
                  <button
                    type="submit"
                    aria-label="Виконати пошук"
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
                  <span className="text-sm text-gray-600 hidden md:inline">
                    Сортувати:
                  </span>
                  <button
                    onClick={() => handleSortChange('createdAt')}
                    aria-label="Сортувати за датою"
                    className={`px-3 py-1 rounded-md text-sm flex items-center ${
                      selectedSort.field === 'createdAt'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    За датою
                    {selectedSort.field === 'createdAt' &&
                      (selectedSort.order === 'desc' ? (
                        <SortDesc size={16} className="ml-1" />
                      ) : (
                        <SortAsc size={16} className="ml-1" />
                      ))}
                  </button>
                  <button
                    onClick={() => handleSortChange('price')}
                    aria-label="Сортувати за ціною"
                    className={`px-3 py-1 rounded-md text-sm flex items-center ${
                      selectedSort.field === 'price'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    За ціною
                    {selectedSort.field === 'price' &&
                      (selectedSort.order === 'desc' ? (
                        <SortDesc size={16} className="ml-1" />
                      ) : (
                        <SortAsc size={16} className="ml-1" />
                      ))}
                  </button>
                </div>

                {/* Вид відображення */}
                <div className="flex space-x-1 border border-gray-200 rounded-md">
                  <button
                    onClick={() => setViewMode('grid')}
                    aria-label="Сітковий вигляд"
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
                    aria-label="Список"
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
                  aria-label="Режим порівняння"
                  className={`px-3 py-2 rounded-md text-sm flex items-center ${
                    compareMode
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  disabled={compareList.length === 0}
                  aria-disabled={compareList.length === 0}
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

          {/* Відображення помилок */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Панель порівняння */}
          {ComparePanel}

          {/* Результати та інформація про кількість */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-600">
              Знайдено {meta?.total ?? 0} оголошень
            </p>
            {meta?.pages > 1 && (
              <p className="text-gray-600">
                Сторінка {meta?.page} з {meta?.pages}
              </p>
            )}
          </div>

          {/* Список оголошень */}
          {SearchResults}

          {/* Пагінація */}
          {Pagination}
        </div>
      </div>
    </div>
  );
};

export default React.memo(CatalogPage);


// import React, { useEffect, useState } from "react";
// import { useParams, useLocation, useNavigate } from "react-router-dom";
// import { useAppDispatch, useAppSelector } from "../store";
// import {
//   fetchCategories,
//   fetchCategoryBySlug,
//   fetchListings,
//   setFilters,
//   setCurrentPage,
//   Listing,
// } from "../store/catalogSlice";
// import FilterSidebar from "../components/ui/FilterSidebar";
// import ListingCard from "../components/ui/ListingCard";
// import {
//   Grid,
//   List,
//   SortAsc,
//   SortDesc,
//   ChevronLeft,
//   ChevronRight,
//   Search,
//   Scale,
//   X,
// } from "lucide-react";

// const CatalogPage = () => {
//   const { categorySlug } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();
//   const dispatch = useAppDispatch();

//   const { categories, currentCategory, listings, filters, meta, status } =
//     useAppSelector((state) => state.catalog);

//   const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedSort, setSelectedSort] = useState<{
//     field: "createdAt" | "price" | "views";
//     order: "asc" | "desc";
//   }>({ field: "createdAt", order: "desc" });
//   const [compareList, setCompareList] = useState<Listing[]>([]);
//   const [compareMode, setCompareMode] = useState(false);

//   // Початкове завантаження даних та встановлення фільтрів з URL
//   useEffect(() => {
//     if (categories.length === 0) {
//       dispatch(fetchCategories());
//     }

//     if (
//       categorySlug &&
//       (!currentCategory || currentCategory.slug !== categorySlug)
//     ) {
//       dispatch(fetchCategoryBySlug(categorySlug));
//     }

//     const searchParams = new URLSearchParams(location.search);
//     const urlFilters: any = {};

//     if (searchParams.has("search")) {
//       urlFilters.search = searchParams.get("search");
//       setSearchTerm(urlFilters.search);
//     }

//     if (searchParams.has("category")) {
//       urlFilters.category = searchParams.get("category");
//     }

//     if (searchParams.has("categoryId")) {
//       urlFilters.categoryId = parseInt(searchParams.get("categoryId") || "0");
//     }

//     if (searchParams.has("minPrice")) {
//       urlFilters.minPrice = parseFloat(searchParams.get("minPrice") || "0");
//     }

//     if (searchParams.has("maxPrice")) {
//       urlFilters.maxPrice = parseFloat(searchParams.get("maxPrice") || "0");
//     }

//     if (searchParams.has("location")) {
//       urlFilters.location = searchParams.get("location");
//     }

//     if (searchParams.has("sortBy")) {
//       urlFilters.sortBy = searchParams.get("sortBy");

//       if (searchParams.has("sortOrder")) {
//         urlFilters.sortOrder = searchParams.get("sortOrder");

//         setSelectedSort({
//           field: urlFilters.sortBy as any,
//           order: urlFilters.sortOrder as any,
//         });
//       }
//     }

//     if (searchParams.has("page")) {
//       urlFilters.page = parseInt(searchParams.get("page") || "1");
//     }

//     if (Object.keys(urlFilters).length > 0) {
//       dispatch(setFilters(urlFilters));
//     }
//   }, [
//     dispatch,
//     categorySlug,
//     categories.length,
//     location.search,
//     currentCategory,
//   ]);

//   useEffect(() => {
//     dispatch(fetchListings(filters));
//   }, [dispatch, filters]);

//   const handlePageChange = (page: number) => {
//     dispatch(setCurrentPage(page));
//     const searchParams = new URLSearchParams(location.search);
//     searchParams.set("page", page.toString());
//     navigate({
//       pathname: location.pathname,
//       search: searchParams.toString(),
//     });
//     window.scrollTo({ top: 0, behavior: "smooth" });
//   };

//   const handleSortChange = (field: "createdAt" | "price" | "views") => {
//     const order =
//       selectedSort.field === field && selectedSort.order === "desc"
//         ? "asc"
//         : "desc";

//     setSelectedSort({ field, order });

//     dispatch(setFilters({ sortBy: field, sortOrder: order }));

//     const searchParams = new URLSearchParams(location.search);
//     searchParams.set("sortBy", field);
//     searchParams.set("sortOrder", order);
//     navigate({
//       pathname: location.pathname,
//       search: searchParams.toString(),
//     });
//   };

//   const handleSearch = (e: React.FormEvent) => {
//     e.preventDefault();

//     dispatch(setFilters({ search: searchTerm, page: 1 }));

//     const searchParams = new URLSearchParams(location.search);
//     if (searchTerm) {
//       searchParams.set("search", searchTerm);
//     } else {
//       searchParams.delete("search");
//     }
//     searchParams.set("page", "1");
//     navigate({
//       pathname: location.pathname,
//       search: searchParams.toString(),
//     });
//   };

//   const handleToggleCompare = (listing: Listing, isSelected: boolean) => {
//     if (isSelected) {
//       if (compareList.length < 3) {
//         setCompareList([...compareList, listing]);
//       } else {
//         alert("Ви можете порівняти максимум 3 позиції");
//       }
//     } else {
//       setCompareList(compareList.filter((item) => item.id !== listing.id));
//     }
//   };

//   const clearCompareList = () => {
//     setCompareList([]);
//     setCompareMode(false);
//   };

//   const getPageTitle = () => {
//     if (currentCategory) {
//       return currentCategory.name;
//     }
//     if (filters.search) {
//       return `Результати пошуку: ${filters.search}`;
//     }
//     return "Каталог техніки та запчастин";
//   };

//   const isInCompareList = (id: number) => {
//     return compareList.some((item) => item.id === id);
//   };

//   // --- Додано: функція для форматування location ---
//   const renderLocation = (locationObj: any) => {
//     if (!locationObj) return "";
//     // settlement, community?.name, region?.name, country?.name
//     const parts = [
//       locationObj.settlement,
//       locationObj.community?.name,
//       locationObj.region?.name,
//       locationObj.country?.name,
//     ].filter(Boolean);
//     return parts.join(", ");
//   };

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <div className="flex flex-col lg:flex-row gap-8">
//         {/* Бічна панель з фільтрами */}
//         <aside className="lg:w-1/4">
//           <FilterSidebar />
//         </aside>

//         {/* Основний контент */}
//         <div className="lg:w-3/4">
//           {/* Заголовок та інформація про категорію */}
//           <div className="mb-6">
//             <h1 className="text-2xl font-bold text-gray-900 mb-2">
//               {getPageTitle()}
//             </h1>
//             {currentCategory && currentCategory.description && (
//               <p className="text-gray-600">{currentCategory.description}</p>
//             )}
//           </div>

//           {/* Панель пошуку та фільтрації */}
//           <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
//             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//               {/* Форма пошуку */}
//               <form onSubmit={handleSearch} className="md:w-1/3">
//                 <div className="relative">
//                   <input
//                     type="text"
//                     placeholder="Пошук в каталозі..."
//                     className="w-full py-2 px-4 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                   />
//                   <button
//                     type="submit"
//                     className="absolute right-3 top-2.5 text-gray-400 hover:text-green-500"
//                   >
//                     <Search size={20} />
//                   </button>
//                 </div>
//               </form>

//               {/* Елементи управління */}
//               <div className="flex items-center space-x-4">
//                 {/* Сортування */}
//                 <div className="flex items-center space-x-2">
//                   <span className="text-sm text-gray-600 hidden md:inline">
//                     Сортувати:
//                   </span>
//                   <button
//                     onClick={() => handleSortChange("createdAt")}
//                     className={`px-3 py-1 rounded-md text-sm flex items-center ${
//                       selectedSort.field === "createdAt"
//                         ? "bg-green-100 text-green-700"
//                         : "bg-gray-100 text-gray-700 hover:bg-gray-200"
//                     }`}
//                   >
//                     За датою
//                     {selectedSort.field === "createdAt" &&
//                       (selectedSort.order === "desc" ? (
//                         <SortDesc size={16} className="ml-1" />
//                       ) : (
//                         <SortAsc size={16} className="ml-1" />
//                       ))}
//                   </button>
//                   <button
//                     onClick={() => handleSortChange("price")}
//                     className={`px-3 py-1 rounded-md text-sm flex items-center ${
//                       selectedSort.field === "price"
//                         ? "bg-green-100 text-green-700"
//                         : "bg-gray-100 text-gray-700 hover:bg-gray-200"
//                     }`}
//                   >
//                     За ціною
//                     {selectedSort.field === "price" &&
//                       (selectedSort.order === "desc" ? (
//                         <SortDesc size={16} className="ml-1" />
//                       ) : (
//                         <SortAsc size={16} className="ml-1" />
//                       ))}
//                   </button>
//                 </div>

//                 {/* Вид відображення */}
//                 <div className="flex space-x-1 border border-gray-200 rounded-md">
//                   <button
//                     onClick={() => setViewMode("grid")}
//                     className={`p-2 ${
//                       viewMode === "grid"
//                         ? "bg-green-100 text-green-700"
//                         : "bg-white text-gray-700 hover:bg-gray-100"
//                     }`}
//                   >
//                     <Grid size={20} />
//                   </button>
//                   <button
//                     onClick={() => setViewMode("list")}
//                     className={`p-2 ${
//                       viewMode === "list"
//                         ? "bg-green-100 text-green-700"
//                         : "bg-white text-gray-700 hover:bg-gray-100"
//                     }`}
//                   >
//                     <List size={20} />
//                   </button>
//                 </div>

//                 {/* Кнопка порівняння */}
//                 <button
//                   onClick={() => setCompareMode(!compareMode)}
//                   className={`px-3 py-2 rounded-md text-sm flex items-center ${
//                     compareMode
//                       ? "bg-green-600 text-white"
//                       : "bg-gray-100 text-gray-700 hover:bg-gray-200"
//                   }`}
//                   disabled={compareList.length === 0}
//                 >
//                   <Scale size={16} className="mr-1" />
//                   <span className="hidden md:inline">Порівняти</span>
//                   {compareList.length > 0 && (
//                     <span className="ml-1 bg-green-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
//                       {compareList.length}
//                     </span>
//                   )}
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* Панель порівняння */}
//           {compareList.length > 0 && compareMode && (
//             <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="font-medium text-gray-900">
//                   Порівняння товарів
//                 </h3>
//                 <button
//                   onClick={clearCompareList}
//                   className="text-gray-500 hover:text-red-600"
//                 >
//                   <X size={20} />
//                 </button>
//               </div>

//               <div className="flex flex-wrap gap-4">
//                 {compareList.map((listing) => (
//                   <div
//                     key={listing.id}
//                     className="relative flex items-center p-2 bg-gray-50 rounded-md"
//                   >
//                     <img
//                       src={
//                         listing.images[0] || "https://via.placeholder.com/50"
//                       }
//                       alt={listing.title}
//                       className="w-10 h-10 object-cover rounded-md mr-2"
//                     />
//                     <span className="text-sm text-gray-700">
//                       {listing.title}
//                     </span>
//                     <button
//                       onClick={() => handleToggleCompare(listing, false)}
//                       className="ml-2 text-gray-400 hover:text-red-600"
//                     >
//                       <X size={16} />
//                     </button>
//                   </div>
//                 ))}

//                 <div className="mt-4 w-full">
//                   <button
//                     onClick={() =>
//                       navigate("/profile/compare", {
//                         state: { listings: compareList },
//                       })
//                     }
//                     className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
//                     disabled={compareList.length < 2}
//                   >
//                     Порівняти вибрані позиції
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Результати та інформація про кількість */}
//           <div className="flex justify-between items-center mb-4">
//             <p className="text-gray-600">
//               Знайдено {meta?.total ?? 0} оголошень
//             </p>
//             {meta?.pages > 1 && (
//               <p className="text-gray-600">
//                 Сторінка {meta?.page} з {meta?.pages}
//               </p>
//             )}
//           </div>
//           {/* Список оголошень */}
//           {status === "loading" ? (
//             <div
//               className={`grid ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-3 gap-6" : "grid-cols-1 gap-4"}`}
//             >
//               {Array(9)
//                 .fill(null)
//                 .map((_, index) => (
//                   <div
//                     key={index}
//                     className={`bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse ${
//                       viewMode === "list" ? "flex" : ""
//                     }`}
//                   >
//                     <div
//                       className={`${
//                         viewMode === "list"
//                           ? "w-1/3 bg-gray-200"
//                           : "aspect-w-16 aspect-h-10 bg-gray-200"
//                       }`}
//                     ></div>
//                     <div className="p-4 flex-1">
//                       <div className="h-4 bg-gray-200 rounded mb-2"></div>
//                       <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
//                       <div className="h-6 bg-gray-200 rounded mb-2 w-1/2"></div>
//                       <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
//                       <div className="h-4 bg-gray-200 rounded w-1/2"></div>
//                     </div>
//                   </div>
//                 ))}
//             </div>
//           ) : listings.length > 0 ? (
//             <div
//               className={
//                 viewMode === "grid"
//                   ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
//                   : "space-y-4"
//               }
//             >
//               {listings.map((listing) => (
//                 <div
//                   key={listing.id}
//                   className={
//                     viewMode === "list"
//                       ? "bg-white border border-gray-200 rounded-lg overflow-hidden flex"
//                       : ""
//                   }
//                 >
//                   {viewMode === "list" ? (
//                     <>
//                       <div className="w-1/3 relative">
//                         <img
//                           src={
//                             listing.images[0] ||
//                             "https://via.placeholder.com/300x200?text=Немає+фото"
//                           }
//                           alt={listing.title}
//                           className="object-cover w-full h-full"
//                         />
//                         <button
//                           onClick={() =>
//                             handleToggleCompare(
//                               listing,
//                               !isInCompareList(listing.id)
//                             )
//                           }
//                           className={`absolute top-2 right-2 p-2 rounded-full ${
//                             isInCompareList(listing.id)
//                               ? "bg-green-500 text-white"
//                               : "bg-white text-gray-700 hover:bg-gray-100"
//                           } shadow transition-colors z-10`}
//                         >
//                           <Scale size={18} />
//                         </button>
//                       </div>
//                       <div className="p-4 flex-1 flex flex-col">
//                         <h3 className="text-lg font-semibold text-gray-900 mb-2">
//                           {listing.title}
//                         </h3>
//                         <p className="text-xl font-bold text-gray-900 mb-2">
//                           {new Intl.NumberFormat("uk-UA", {
//                             style: "currency",
//                             currency: "UAH",
//                             minimumFractionDigits: 0,
//                             maximumFractionDigits: 0,
//                           }).format(listing.price)}
//                         </p>
//                         <p className="text-gray-600 mb-2 line-clamp-2">
//                           {listing.description}
//                         </p>
//                         <div className="flex items-center text-gray-600 text-sm mb-2">
//                           <span>
//                             {renderLocation(listing.location)}
//                           </span>
//                           <span className="mx-2">•</span>
//                           <span>
//                             {new Date(listing.createdAt).toLocaleDateString(
//                               "uk-UA"
//                             )}
//                           </span>
//                         </div>
//                       </div>
//                     </>
//                   ) : (
//                     <ListingCard
//                       listing={listing}
//                       compareEnabled={true}
//                       onToggleCompare={handleToggleCompare}
//                       isSelected={isInCompareList(listing.id)}
//                     />
//                   )}
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
//               <h3 className="text-lg font-semibold text-gray-900 mb-2">
//                 На жаль, за вашим запитом нічого не знайдено
//               </h3>
//               <p className="text-gray-600 mb-4">
//                 Спробуйте змінити параметри пошуку або фільтри
//               </p>
//               <button
//                 onClick={() => {
//                   dispatch(setFilters({}));
//                   navigate("/catalog");
//                 }}
//                 className="text-green-600 hover:text-green-700"
//               >
//                 Скинути всі фільтри
//               </button>
//             </div>
//           )}

//           {/* Пагінація */}
//           {meta?.pages > 1 && (
//             <div className="flex justify-center mt-8">
//               <nav className="flex items-center space-x-2">
//                 {/* Кнопка попередньої сторінки */}
//                 <button
//                   onClick={() => handlePageChange(meta.page - 1)}
//                   disabled={meta.page === 1}
//                   className={`w-10 h-10 rounded-md flex items-center justify-center ${
//                     meta.page === 1
//                       ? "text-gray-400 cursor-not-allowed"
//                       : "text-gray-700 hover:bg-gray-100"
//                   }`}
//                 >
//                   <ChevronLeft size={20} />
//                 </button>

//                 {/* Номери сторінок */}
//                 {Array.from({ length: meta.pages }, (_, i) => i + 1)
//                   .filter((page) => {
//                     return (
//                       page === 1 ||
//                       page === meta.pages ||
//                       Math.abs(page - meta.page) <= 2
//                     );
//                   })
//                   .map((page, index, array) => {
//                     const showEllipsis =
//                       index > 0 && array[index - 1] !== page - 1;

//                     return (
//                       <React.Fragment key={page}>
//                         {showEllipsis && (
//                           <span className="text-gray-500">...</span>
//                         )}
//                         <button
//                           onClick={() => handlePageChange(page)}
//                           className={`w-10 h-10 rounded-md flex items-center justify-center ${
//                             page === meta.page
//                               ? "bg-green-600 text-white"
//                               : "text-gray-700 hover:bg-gray-100"
//                           }`}
//                         >
//                           {page}
//                         </button>
//                       </React.Fragment>
//                     );
//                   })}

//                 {/* Кнопка наступної сторінки */}
//                 <button
//                   onClick={() => handlePageChange(meta.page + 1)}
//                   disabled={meta.page === meta.pages}
//                   className={`w-10 h-10 rounded-md flex items-center justify-center ${
//                     meta.page === meta.pages
//                       ? "text-gray-400 cursor-not-allowed"
//                       : "text-gray-700 hover:bg-gray-100"
//                   }`}
//                 >
//                   <ChevronRight size={20} />
//                 </button>
//               </nav>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CatalogPage;