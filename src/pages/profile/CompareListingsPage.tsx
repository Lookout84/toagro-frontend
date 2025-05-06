import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Scale, ArrowLeft } from "lucide-react";
import { Listing } from "../../types/api";
import Card from "../../components/common/Card";

const CompareListingsPage = () => {
  const location = useLocation();
  const [compareListings, setCompareListings] = useState<Listing[]>([]);

  // Get listings for comparison from navigation state
  useEffect(() => {
    if (location.state?.listings) {
      setCompareListings(location.state.listings);
    }
  }, [location.state]);

  // Format price in UAH
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uk-UA", {
      style: "currency",
      currency: "UAH",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("uk-UA");
  };

  if (compareListings.length < 2) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Scale size={48} className="text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Порівняння товарів
          </h2>
          <p className="text-gray-600 mb-4">
            Для порівняння необхідно вибрати щонайменше 2 товари
          </p>
          <Link
            to="/catalog"
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Перейти до каталогу
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-0">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Scale className="mr-2" size={24} />
            Порівняння товарів ({compareListings.length})
          </h2>
          <Link
            to="/catalog"
            className="text-gray-600 hover:text-green-600 flex items-center"
          >
            <ArrowLeft size={18} className="mr-1" />
            До каталогу
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700 w-1/4">
                Характеристика
              </th>
              {compareListings.map((listing) => (
                <th
                  key={listing.id}
                  className="text-left py-3 px-4 font-semibold text-gray-700"
                >
                  {listing.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Images */}
            <tr className="border-b border-gray-200">
              <td className="py-3 px-4 font-medium text-gray-700">Фото</td>
              {compareListings.map((listing) => (
                <td key={`${listing.id}-image`} className="py-3 px-4">
                  <img
                    src={
                      listing.images[0] ||
                      "https://via.placeholder.com/100?text=Немає+фото"
                    }
                    alt={listing.title}
                    className="w-24 h-24 object-cover rounded-md"
                  />
                </td>
              ))}
            </tr>

            {/* Price */}
            <tr className="border-b border-gray-200">
              <td className="py-3 px-4 font-medium text-gray-700">Ціна</td>
              {compareListings.map((listing) => (
                <td
                  key={`${listing.id}-price`}
                  className="py-3 px-4 font-bold text-gray-900"
                >
                  {formatPrice(listing.price)}
                </td>
              ))}
            </tr>

            {/* Category */}
            <tr className="border-b border-gray-200">
              <td className="py-3 px-4 font-medium text-gray-700">
                Категорія
              </td>
              {compareListings.map((listing) => (
                <td key={`${listing.id}-category`} className="py-3 px-4">
                  {listing.category}
                </td>
              ))}
            </tr>

            {/* Location */}
            <tr className="border-b border-gray-200">
              <td className="py-3 px-4 font-medium text-gray-700">
                Місцезнаходження
              </td>
              {compareListings.map((listing) => (
                <td key={`${listing.id}-location`} className="py-3 px-4">
                  {listing.location}
                </td>
              ))}
            </tr>

            {/* Published date */}
            <tr className="border-b border-gray-200">
              <td className="py-3 px-4 font-medium text-gray-700">
                Дата публікації
              </td>
              {compareListings.map((listing) => (
                <td key={`${listing.id}-date`} className="py-3 px-4">
                  {formatDate(listing.createdAt)}
                </td>
              ))}
            </tr>

            {/* Description */}
            <tr className="border-b border-gray-200">
              <td className="py-3 px-4 font-medium text-gray-700">Опис</td>
              {compareListings.map((listing) => (
                <td key={`${listing.id}-description`} className="py-3 px-4">
                  <p className="line-clamp-3 text-sm text-gray-600">
                    {listing.description}
                  </p>
                  <Link
                    to={`/listings/${listing.id}`}
                    className="text-green-600 hover:text-green-700 text-sm mt-1 inline-block"
                  >
                    Детальніше
                  </Link>
                </td>
              ))}
            </tr>

            {/* Seller */}
            <tr className="border-b border-gray-200">
              <td className="py-3 px-4 font-medium text-gray-700">
                Продавець
              </td>
              {compareListings.map((listing) => (
                <td key={`${listing.id}-seller`} className="py-3 px-4">
                  {listing.user.name}
                </td>
              ))}
            </tr>

            {/* View button */}
            <tr>
              <td className="py-3 px-4"></td>
              {compareListings.map((listing) => (
                <td key={`${listing.id}-action`} className="py-3 px-4">
                  <Link
                    to={`/listings/${listing.id}`}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors inline-block"
                  >
                    Переглянути
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default CompareListingsPage;