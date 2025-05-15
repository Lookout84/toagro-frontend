import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store";
import { fetchListings, Listing } from "../store/catalogSlice";
import ListingCard from "../components/ui/ListingCard";
import Loader from "../components/common/Loader";
import Pagination from "../components/common/Pagination";
import { Filter, Settings } from "lucide-react";
import Button from "../components/common/Button";
import MobileFilterDrawer from "../components/ui/MobileFilterDrawer";
import CatalogFilters from "../components/ui/CatalogFilters";
import useMediaQuery from "../hooks/useMediaQuery";
import Card from "../components/common/Card";

const UsedListingsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { categories } = useAppSelector((state) => state.catalog);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Параметри фільтрації з фіксованим значенням condition = "used"
  const [filters, setFilters] = useState({
    condition: "used", // Фіксований фільтр для вживаної техніки
    categoryId: "",
    minPrice: "",
    maxPrice: "",
    location: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Завантаження даних з фільтрами
  useEffect(() => {
    const loadListings = async () => {
      setIsLoading(true);
      try {
        // Підготовка параметрів для запиту
        const fetchParams: any = {
          ...filters,
          page: currentPage,
          limit: 12,
        };
        
        // Перетворення categoryId у число, якщо воно не порожнє
        if (filters.categoryId) {
          fetchParams.categoryId = typeof filters.categoryId === "string" 
            ? parseInt(filters.categoryId, 10) 
            : filters.categoryId;
        }

        const result = await dispatch(fetchListings(fetchParams)).unwrap();

        setListings(result.listings || []);
        setTotalPages(result.meta?.pages || 1);
      } catch (error) {
        console.error("Помилка завантаження вживаної техніки:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadListings();
  }, [dispatch, filters, currentPage]);

  // Обробка зміни фільтрів із збереженням фіксованого condition
  const handleFilterChange = (newFilters: any) => {
    setFilters({ 
      ...newFilters, 
      condition: "used" // Обов'язково зберігаємо умову "вживана техніка"
    });
    setCurrentPage(1); // При зміні фільтрів повертаємось на першу сторінку
  };

  // Обробка зміни сторінки
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Перемикання відображення фільтрів на мобільних
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8 p-6">
        <header className="mb-4 flex items-center">
          <div className="bg-blue-100 rounded-full p-3 mr-4">
            <Settings className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Вживана техніка</h1>
            <p className="text-gray-600 mt-1">
              Широкий вибір перевіреної вживаної сільськогосподарської техніки від перевірених продавців
            </p>
          </div>
        </header>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Фільтри - для десктопу */}
          {!isMobile && (
            <div className="w-full md:w-1/4 lg:w-1/5">
              <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-4">
                <h2 className="font-semibold text-lg mb-4">Фільтри</h2>
                <CatalogFilters 
                  filters={filters} 
                  onFilterChange={handleFilterChange} 
                  categories={categories}
                  showCondition={false} // Не показуємо вибір стану, бо він зафіксований
                />
              </div>
            </div>
          )}

          {/* Основний вміст */}
          <div className="w-full md:w-3/4 lg:w-4/5">
            {/* Мобільні фільтри */}
            {isMobile && (
              <div className="mb-4">
                <Button 
                  onClick={toggleFilters}
                  variant="outline"
                  icon={<Filter size={16} />}
                  className="w-full"
                >
                  Фільтри
                </Button>
                
                <MobileFilterDrawer 
                  isOpen={showFilters}
                  onClose={() => setShowFilters(false)} 
                  title="Фільтри"
                >
                  <CatalogFilters 
                    filters={filters} 
                    onFilterChange={handleFilterChange} 
                    categories={categories}
                    showCondition={false}
                  />
                </MobileFilterDrawer>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader />
              </div>
            ) : listings.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <h3 className="text-xl font-semibold mb-2">Нічого не знайдено</h3>
                <p className="text-gray-600">
                  Спробуйте змінити параметри пошуку або перевірте пізніше
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
                
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <Pagination 
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UsedListingsPage;