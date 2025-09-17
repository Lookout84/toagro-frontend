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

  // Форматування location відповідно до CreateListingPage
  const renderLocation = (locationObj: unknown) => {
    if (!locationObj) return "Місце не вказано";
    
    if (typeof locationObj === "string") return locationObj;
    
    // Обробка різних форматів локації відповідно до CreateListingPage
    const parts = [];
    
    if (typeof locationObj === "object" && locationObj !== null) {
      const location = locationObj as Record<string, unknown>;
      
      // Спочатку додаємо settlement/locationName
      if (typeof location.settlement === "string") {
        parts.push(location.settlement);
      } else if (typeof location.locationName === "string") {
        parts.push(location.locationName);
      } else if (typeof location.name === "string") {
        parts.push(location.name);
      }
      
      // Потім регіон/область
      if (location.region) {
        if (typeof location.region === 'object' && location.region !== null && 
            typeof (location.region as Record<string, unknown>).name === 'string') {
          parts.push((location.region as Record<string, unknown>).name);
        } else if (typeof location.region === 'string') {
          parts.push(location.region);
        }
      }
      
      // Потім країну
      if (location.country) {
        if (typeof location.country === 'object' && location.country !== null && 
            typeof (location.country as Record<string, unknown>).name === 'string') {
          parts.push((location.country as Record<string, unknown>).name);
        } else if (typeof location.country === 'string') {
          parts.push(location.country);
        }
      }
    }
    
    const result = parts.filter((part) => typeof part === "string" && part.trim().length > 0);
    return result.length ? result.join(", ") : "Місце не вказано";
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
            {listing.vatIncluded !== undefined && (
              <span className="ml-1">
                {listing.vatIncluded ? "(ПДВ включено)" : "(ПДВ не включено)"}
              </span>
            )}
          </span>
        </p>
        <p className="text-gray-600 mb-3 text-sm line-clamp-2">
          {listing.description || "Опис відсутній"}
        </p>
        {/* Відображення стану товару */}
        {listing.condition && (
          <div className="mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {listing.condition.toLowerCase() === "new" || listing.condition === "NEW" ? "Нова" : "Вживана"}
            </span>
          </div>
        )}
        <div className="flex flex-col space-y-1 text-sm text-gray-500">
          <div className="flex items-center">
            <MapPin size={14} className="mr-1" />
            <span>{renderLocation(listing.location)}</span>
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