import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store";
import { fetchListings, Listing } from "../store/catalogSlice";
import ListingCard from "../components/ui/ListingCard";
import Loader from "../components/common/Loader";
import Pagination from "../components/common/Pagination";
import { Filter, Tractor } from "lucide-react";
import Button from "../components/common/Button";
import MobileFilterDrawer from "../components/ui/MobileFilterDrawer";
import useMediaQuery from "../hooks/useMediaQuery";
import Card from "../components/common/Card";
import FilterSidebar from "../components/ui/FilterSidebar";

const NewListingsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { listings, meta, status } = useAppSelector((state) => state.catalog);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Завантаження даних при зміні сторінки або фільтрів
  useEffect(() => {
    dispatch(fetchListings({ page: currentPage, limit: 12, condition: "new" }));
  }, [dispatch, currentPage]);

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
          <div className="bg-green-100 rounded-full p-3 mr-4">
            <Tractor className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Нова техніка</h1>
            <p className="text-gray-600 mt-1">
              Знайдіть нову сільськогосподарську техніку від офіційних дилерів та приватних продавців
            </p>
          </div>
        </header>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Фільтри - для десктопу */}
          {!isMobile && (
            <div className="w-full md:w-1/4 lg:w-1/5">
              <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-4">
                <h2 className="font-semibold text-lg mb-4">Фільтри</h2>
                <FilterSidebar fixedCondition="new" />
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
                  <FilterSidebar fixedCondition="new" />
                </MobileFilterDrawer>
              </div>
            )}

            {status === "loading" ? (
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
                  {listings.map((listing: Listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>

                {meta?.pages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <Pagination
                      currentPage={meta.page}
                      totalPages={meta.pages}
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

export default NewListingsPage;