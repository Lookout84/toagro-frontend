import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Scale, MapPin, Calendar } from "lucide-react";
import { Listing } from "../store/catalogSlice";
import { formatDate } from "../utils/formatters";
// import { formatPriceWithSymbol } from "../utils/formatters";

interface ListingCardProps {
  listing: Listing;
  compareEnabled?: boolean;
  onToggleCompare?: (listing: Listing, isSelected: boolean) => void;
  isSelected?: boolean;
}

console.log("!!! ListingCard module loaded");
const ListingCard = ({
  listing,
  compareEnabled = false,
  onToggleCompare,
  isSelected = false,
}: ListingCardProps) => {
  console.log("Listing in card:", listing);
  const [isFavorite, setIsFavorite] = useState(false);

  // Додано логування для відладки
  console.log("Listing data in card:", listing);
  console.log("Price:", listing.price, "Currency:", listing.currency);

  // Обробник кліку на кнопку "В обране"
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  // Обробник кліку на кнопку "Порівняти"
  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleCompare) {
      onToggleCompare(listing, !isSelected);
    }
  };

  // Тип для можливих форматів зображення
  type ListingImage = string | { url?: string; path?: string; src?: string };

  // Безпечне отримання URL зображення
  const getImageUrl = () => {
    if (!listing.images || listing.images.length === 0) {
      return "https://via.placeholder.com/300x200?text=Немає+фото";
    }

    const firstImage = listing.images[0] as ListingImage;

    if (typeof firstImage === "string") {
      return firstImage;
    } else if (firstImage && typeof firstImage === "object") {
      return (
        firstImage.url ||
        firstImage.path ||
        firstImage.src ||
        "https://via.placeholder.com/300x200?text=Формат+не+підтримується"
      );
    }
    return "https://via.placeholder.com/300x200?text=Немає+фото";
  };

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Зображення */}
      <div className="relative aspect-w-16 aspect-h-10">
        <img
          src={getImageUrl()}
          alt={listing.title || "Оголошення"}
          className="object-cover w-full h-full"
          onError={(e) => {
            e.currentTarget.src =
              "https://via.placeholder.com/300x200?text=Помилка+завантаження";
          }}
        />

        {/* Кнопки дій */}
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          <button
            onClick={handleFavoriteClick}
            className={`p-2 rounded-full ${
              isFavorite
                ? "bg-red-500 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            } shadow transition-colors`}
          >
            <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
          </button>

          {compareEnabled && (
            <button
              onClick={handleCompareClick}
              className={`p-2 rounded-full ${
                isSelected
                  ? "bg-green-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              } shadow transition-colors`}
            >
              <Scale size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Інформація про оголошення */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {listing.title || "Оголошення без назви"}
        </h3>

        {/* Виправлено відображення ціни з валютою, завжди використовуємо currency з бази даних */}
        <p className="text-xl font-bold text-gray-900 mb-2">
          {listing.price !== undefined && listing.price !== null
            ? (() => {
                const numericPrice =
                  typeof listing.price === "string"
                    ? parseFloat(listing.price)
                    : listing.price;
                const formattedPrice = new Intl.NumberFormat("uk-UA").format(
                  numericPrice
                );
                const normalizedCurrency = (listing.currency || "UAH")
                  .toUpperCase()
                  .trim();
                let currencySymbol = "₴";
                if (normalizedCurrency === "USD") currencySymbol = "$";
                else if (normalizedCurrency === "EUR") currencySymbol = "€";
                const result = `${formattedPrice} ${currencySymbol}`;
                console.log(
                  "Rendered price:",
                  result,
                  "currency:",
                  listing.currency
                );
                return result;
              })()
            : "Ціна не вказана"}
        </p>
        <p className="text-gray-600 mb-3 text-sm line-clamp-2">
          {listing.description || "Опис відсутній"}
        </p>

        <div className="flex flex-col space-y-1 text-sm text-gray-500">
          <div className="flex items-center">
            <MapPin size={14} className="mr-1" />
            <span>{listing.location || "Місце не вказано"}</span>
          </div>

          <div className="flex items-center">
            <Calendar size={14} className="mr-1" />
            <span>
              {listing.createdAt
                ? formatDate(listing.createdAt)
                : "Дата не вказана"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ListingCard;
