import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Scale, MapPin, Calendar } from 'lucide-react';
import { Listing } from '../../store/catalogSlice';

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
  isSelected = false 
}: ListingCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uk-UA');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Зображення */}
      <div className="relative aspect-w-16 aspect-h-10">
        <img
          src={listing.images[0] || 'https://via.placeholder.com/300x200?text=Немає+фото'}
          alt={listing.title}
          className="object-cover w-full h-full"
        />
        
        {/* Кнопки дій (в обране, порівняти) */}
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          <button
            onClick={handleFavoriteClick}
            className={`p-2 rounded-full ${
              isFavorite
                ? 'bg-red-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            } shadow transition-colors`}
          >
            <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
          </button>
          
          {compareEnabled && (
            <button
              onClick={handleCompareClick}
              className={`p-2 rounded-full ${
                isSelected
                  ? 'bg-green-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
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
          {listing.title}
        </h3>
        
        <p className="text-xl font-bold text-gray-900 mb-2">
          {formatPrice(listing.price)}
        </p>
        
        <p className="text-gray-600 mb-3 text-sm line-clamp-2">
          {listing.description}
        </p>
        
        <div className="flex flex-col space-y-1 text-sm text-gray-500">
          <div className="flex items-center">
            <MapPin size={14} className="mr-1" />
            <span>{listing.location}</span>
          </div>
          
          <div className="flex items-center">
            <Calendar size={14} className="mr-1" />
            <span>{formatDate(listing.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ListingCard;