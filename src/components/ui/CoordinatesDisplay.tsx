import React from 'react';

interface CoordinatesDisplayProps {
  useMyLocation: boolean;
  userLatitude: number | null;
  userLongitude: number | null;
  productLatitude: number | undefined;
  productLongitude: number | undefined;
  isLoadingLocation: boolean;
  onUseMyLocationToggle: (checked: boolean) => void;
  onRequestGeolocation: () => void;
}

const CoordinatesDisplay: React.FC<CoordinatesDisplayProps> = ({
  useMyLocation,
  userLatitude,
  userLongitude,
  productLatitude,
  productLongitude,
  isLoadingLocation,
  onUseMyLocationToggle,
  onRequestGeolocation,
}) => {
  const hasUserCoords = userLatitude !== undefined && userLongitude !== undefined;
  const hasProductCoords = productLatitude !== undefined && productLongitude !== undefined;
  const coordsDiffer = hasUserCoords && hasProductCoords && 
    (userLatitude !== productLatitude || userLongitude !== productLongitude);

  return (
    <div className="space-y-4">
      {/* Перемикач "Використовувати моє місцезнаходження" */}
      <div className="flex items-center space-x-2">
        <input
          id="useMyLocation"
          type="checkbox"
          checked={useMyLocation}
          onChange={(e) => onUseMyLocationToggle(e.target.checked)}
          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
        />
        <label
          htmlFor="useMyLocation"
          className="block text-sm text-gray-900"
        >
          Використовувати моє місцезнаходження
        </label>
        {isLoadingLocation && (
          <div className="flex items-center text-blue-600">
            <svg className="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-xs">Визначення...</span>
          </div>
        )}
      </div>
      
      {/* Повідомлення про режим роботи */}
      {!useMyLocation && (
        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
          💡 Виберіть місце розташування товару на карті нижче (координати товару можуть відрізнятися від вашого місцезнаходження)
        </div>
      )}
      
      {useMyLocation && hasUserCoords && (
        <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
          ✅ Ваше місцезнаходження визначено автоматично і використовується як локація товару
        </div>
      )}
      
      {useMyLocation && !hasUserCoords && !isLoadingLocation && (
        <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded-md">
          <div className="flex items-center justify-between">
            <span>⚠️ Не вдалося визначити ваше місцезнаходження.</span>
            <button
              type="button"
              onClick={onRequestGeolocation}
              className="ml-2 px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Спробувати ще раз
            </button>
          </div>
        </div>
      )}
      
      {/* Показуємо різницю між координатами користувача і товару */}
      {!useMyLocation && coordsDiffer && (
        <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
          📍 Місцезнаходження товару відрізняється від вашого місцезнаходження
        </div>
      )}
    </div>
  );
};

export default CoordinatesDisplay;
