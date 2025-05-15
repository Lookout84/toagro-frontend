import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import { fetchCategories, fetchListings, Listing, Category } from "../store/catalogSlice";
import ListingCard from "../components/ui/ListingCard";
import { ChevronRight, Tractor, Settings, Tag, Combine } from "lucide-react";

const HomePage = () => {
  const dispatch = useAppDispatch();
  const { categories } = useAppSelector((state) => state.catalog);
  const [popularListings, setPopularListings] = useState<Listing[]>([]);
  const [newListings, setNewListings] = useState<Listing[]>([]);

  // Завантаження даних при першому рендері
  useEffect(() => {
    // Завантаження категорій
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }

    // Завантаження популярних оголошень (сортування за переглядами)
    dispatch(fetchListings({ sortBy: "views", sortOrder: "desc", limit: 4 }))
      .unwrap()
      .then((result) => {
        setPopularListings(result.listings);
      });

    // Завантаження нових оголошень
    dispatch(
      fetchListings({ sortBy: "createdAt", sortOrder: "desc", limit: 8 })
    )
      .unwrap()
      .then((result) => {
        setNewListings(result.listings);
      });
  }, [dispatch, categories.length]);

  function getCategoryIcon(slug: string): import("react").ReactNode {
    switch (slug) {
      case "tractors":
        return <Tractor size={24} />;
      case "combines":
        return <Combine size={24} />;
      case "reapers":
        return <Settings size={24} />;
      case "seeders":
        return <Tag size={24} />;
      default:
        // Fallback icon for other categories
        return <Tag size={24} />;
    }
  }
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Головний банер */}
      <div className="bg-gradient-to-r from-green-50 to-white rounded-xl p-8 mb-12">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Знайдіть надійну техніку для вашого господарства
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            ToAgro — найбільший маркетплейс сільськогосподарської техніки та
            запчастин в Україні
          </p>
          <div className="flex space-x-4">
            <Link
              to="/catalog"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Знайти техніку
            </Link>
            <Link
              to="/listings/create"
              className="border-2 border-green-600 text-green-600 px-6 py-3 rounded-lg hover:bg-green-50 transition-colors"
            >
              Продати техніку
            </Link>
          </div>
        </div>
      </div>

      {/* Категорії */}

      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Категорії</h2>
          <Link
            to="/catalog"
            className="text-green-600 hover:text-green-700 flex items-center"
          >
            Всі категорії <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.length > 0
            ? categories
                .slice(0, 4)
                .map((category: Category) => (
                  <Link
                    key={category.id}
                    to={`/catalog?category=${category.slug}`}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:border-green-500 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-4">
                        {getCategoryIcon(category.slug)}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {category.name}
                      </h3>
                    </div>
                    <p className="text-gray-600">{category.description}</p>
                  </Link>
                ))
            : // Показуємо плейсхолдери під час завантаження
              Array(4)
                .fill(null)
                .map((_, index: number) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse"
                  >
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                      <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
        </div>
      </div>
      {/* Популярні оголошення */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Популярні пропозиції
          </h2>
          <Link
            to="/catalog?sortBy=views&sortOrder=desc"
            className="text-green-600 hover:text-green-700 flex items-center"
          >
            Дивитися всі <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularListings.length > 0
            ? popularListings.map((listing) => {
                console.log("Listing in card:", listing);
                return <ListingCard key={listing.id} listing={listing} />;
              })
              
            : // Заглушки для відображення під час завантаження
              Array(4)
                .fill(null)
                .map((_, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse"
                  >
                    <div className="aspect-w-16 aspect-h-10 bg-gray-200"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                      <div className="h-6 bg-gray-200 rounded mb-2 w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
        </div>
      </div>

      {/* Нові оголошення */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Нові пропозиції</h2>
          <Link
            to="/catalog?sortBy=createdAt&sortOrder=desc"
            className="text-green-600 hover:text-green-700 flex items-center"
          >
            Дивитися всі <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {newListings.length > 0
            ? newListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))
            : // Заглушки для відображення під час завантаження
              Array(8)
                .fill(null)
                .map((_, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse"
                  >
                    <div className="aspect-w-16 aspect-h-10 bg-gray-200"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                      <div className="h-6 bg-gray-200 rounded mb-2 w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
        </div>
      </div>

      {/* Переваги розділ */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          Чому варто вибрати ToAgro
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 10c0 6.667-9 12-9 12s-9-5.333-9-12a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Найбільший вибір в Україні
            </h3>
            <p className="text-gray-600">
              Тисячі оголошень сільськогосподарської техніки та запчастин від
              перевірених продавців
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Безпечні угоди
            </h3>
            <p className="text-gray-600">
              Перевірені продавці, безпечні платежі та система рейтингів для
              вашого спокою
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Спільнота фермерів
            </h3>
            <p className="text-gray-600">
              Приєднуйтесь до спільноти фермерів та аграріїв - разом ми сильніші
            </p>
          </div>
        </div>
      </div>

      {/* Закликаючий до дії блок */}
      <div className="bg-green-600 text-white rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">
          Готові продати свою техніку?
        </h2>
        <p className="text-lg mb-6">
          Розмістіть оголошення безкоштовно та знайдіть покупця швидко!
        </p>
        <Link
          to="/listings/create"
          className="inline-block bg-white text-green-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium"
        >
          Розмістити оголошення
        </Link>
      </div>
    </div>
  );
};

export default HomePage;

{
  /* Категорії */
}
{
  /* <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Категорії</h2>
          <Link
            to="/catalog"
            className="text-green-600 hover:text-green-700 flex items-center"
          >
            Всі категорії <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to="/catalog?category=tractors"
            className="bg-white border border-gray-200 rounded-lg p-6 hover:border-green-500 hover:shadow-md transition-all"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-4">
                <Tractor size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Трактори</h3>
            </div>
            <p className="text-gray-600">
              Нові та вживані трактори провідних виробників
            </p>
          </Link>

          <Link
            to="/catalog?category=harvesters"
            className="bg-white border border-gray-200 rounded-lg p-6 hover:border-green-500 hover:shadow-md transition-all"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-4">
                <TrendingUp size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Комбайни</h3>
            </div>
            <p className="text-gray-600">
              Зернозбиральні та інші комбайни для вашого господарства
            </p>
          </Link>

          <Link
            to="/catalog?category=parts"
            className="bg-white border border-gray-200 rounded-lg p-6 hover:border-green-500 hover:shadow-md transition-all"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-4">
                <Settings size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Запчастини
              </h3>
            </div>
            <p className="text-gray-600">
              Оригінальні та аналогові запчастини для сільгосптехніки
            </p>
          </Link>

          <Link
            to="/catalog?category=tillage"
            className="bg-white border border-gray-200 rounded-lg p-6 hover:border-green-500 hover:shadow-md transition-all"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-4">
                <Tag size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Ґрунтообробка
              </h3>
            </div>
            <p className="text-gray-600">
              Плуги, культиватори та інша техніка для обробки ґрунту
            </p>
          </Link>
        </div>
      </div> */
}

{
  /* <div className="mb-12">
  <div className="flex justify-between items-center mb-6">
    <h2 className="text-2xl font-bold text-gray-900">Категорії</h2>
    <Link
      to="/catalog"
      className="text-green-600 hover:text-green-700 flex items-center"
    >
      Всі категорії <ChevronRight size={16} />
    </Link>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {categories.length > 0 ? (
      categories.slice(0, 4).map((category) => (
        <Link
          key={category.id}
          to={`/catalog?category=${category.slug}`}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:border-green-500 hover:shadow-md transition-all"
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-4">
              {getCategoryIcon(category.slug)}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
          </div>
          <p className="text-gray-600">
            {category.description}
          </p>
        </Link>
      ))
    ) : (
      // Показуємо плейсхолдери під час завантаження
      Array(4)
        .fill(null)
        .map((_, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
              <div className="h-5 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))
    )}
  </div>
</div> */
}
