import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Scale, MapPin, Calendar } from "lucide-react";
import { Listing } from "../store/catalogSlice";
import { formatDate } from "../utils/formatters";
import { formatCurrency } from "../utils/currencyFormatter";

interface ListingCardProps {
  listing: Listing;
  compareEnabled?: boolean;
  onToggleCompare?: (listing: Listing, isSelected: boolean) => void;
  isSelected?: boolean;
}

const ListingCard = ({
  listing,
  compareEnabled = false,
  onToggleCompare,
  isSelected = false,
}: ListingCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);

  // Форматування location
  const renderLocation = (locationObj: any) => {
  if (!locationObj) return "Місце не вказано";
  if (typeof locationObj === "string") return locationObj;
  const parts = [
    locationObj.settlement ?? "",
    locationObj.community?.name ?? "",
    locationObj.region?.name ?? "",
    locationObj.country?.name ?? "",
  ]
    .filter((part) => typeof part === "string" && part.trim().length > 0);
  return parts.length ? parts.join(", ") : "Місце не вказано";
};

const formatLocation = (location: any) => {
  if (!location) return "Місцезнаходження не вказано";
  
  if (typeof location === "string") return location;
  
  const parts = [
    location.settlement,
    location.community?.name,
    location.region?.name, 
    location.country?.name
  ].filter(Boolean);
  
  return parts.length > 0 ? parts.join(", ") : "Місцезнаходження не вказано";
};
  // Обробник кліку на кнопку "В обране"
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite((prev) => !prev);
  };

  // Обробник кліку на кнопку "Порівняти"
  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleCompare) {
      onToggleCompare(listing, !isSelected);
    }
  };

  // Безпечне отримання URL зображення
  const getImageUrl = () => {
    if (!listing.images || listing.images.length === 0) {
      return "https://via.placeholder.com/300x200?text=Немає+фото";
    }
    // Явно вказуємо тип для елемента зображення
    const firstImage = listing.images[0] as
      | string
      | { url?: string; path?: string; src?: string };
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
        <p className="text-xl font-bold text-gray-900 mb-2">
          {listing.price !== undefined && listing.price !== null
            ? (() => {
                const numericPrice =
                  typeof listing.price === "string"
                    ? parseFloat(listing.price)
                    : listing.price;
                
                console.log("💰 Форматування ціни для оголошення", listing.id, ":", numericPrice, "валюта:", listing.currency);
                
                const formattedPrice = formatCurrency(numericPrice, { 
                  currency: listing.currency || "UAH" 
                });
                
                console.log("📄 Результат formatCurrency:", formattedPrice);
                return formattedPrice;
              })()
            : "Ціна не вказана"}
          <span className="ml-2 text-xs text-gray-500">
            {listing.priceType === "BRUTTO"
              ? "(з ПДВ)"
              : listing.priceType === "NETTO"
              ? "(без ПДВ)"
              : ""}
          </span>
        </p>
        <p className="text-gray-600 mb-3 text-sm line-clamp-2">
          {listing.description || "Опис відсутній"}
        </p>
        <div className="flex flex-col space-y-1 text-sm text-gray-500">
          <div className="flex items-center">
            <MapPin size={14} className="mr-1" />
            <span>{formatLocation(renderLocation(listing.location))}</span>
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