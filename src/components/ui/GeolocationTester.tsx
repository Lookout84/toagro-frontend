import React from 'react';
import { useGeolocation } from '../../hooks/useGeolocation';

interface GeolocationTesterProps {
  onLocationReceived?: (lat: number, lng: number) => void;
}

const GeolocationTester: React.FC<GeolocationTesterProps> = ({ onLocationReceived }) => {
  const geolocation = useGeolocation();

  const handleRequestLocation = () => {
    console.log("🧪 Тестер: Запит геолокації...");
    geolocation.requestLocation();
  };

  React.useEffect(() => {
    if (geolocation.state.userLatitude && geolocation.state.userLongitude) {
      console.log("🧪 Тестер: Геолокація отримана:", {
        lat: geolocation.state.userLatitude,
        lng: geolocation.state.userLongitude
      });
      
      if (onLocationReceived) {
        onLocationReceived(geolocation.state.userLatitude, geolocation.state.userLongitude);
      }
    }
  }, [geolocation.state.userLatitude, geolocation.state.userLongitude, onLocationReceived]);

  if (geolocation.state.error) {
    console.log("🧪 Тестер: Помилка геолокації:", geolocation.state.error);
  }

  return (
    <div className="p-4 border border-blue-300 bg-blue-50 rounded-md">
      <h3 className="text-sm font-medium text-blue-800 mb-2">🧪 Тестер геолокації</h3>
      
      <div className="space-y-2">
        <div className="text-xs">
          <strong>Статус:</strong> {geolocation.state.loading ? "Завантаження..." : "Готово"}
        </div>
        
        <div className="text-xs">
          <strong>Координати:</strong> 
          {geolocation.state.userLatitude && geolocation.state.userLongitude ? (
            <span className="text-green-600 ml-1">
              {geolocation.state.userLatitude.toFixed(6)}, {geolocation.state.userLongitude.toFixed(6)}
            </span>
          ) : (
            <span className="text-gray-500 ml-1">Не отримані</span>
          )}
        </div>
        
        {geolocation.state.error && (
          <div className="text-xs text-red-600">
            <strong>Помилка:</strong> {geolocation.state.error.message}
          </div>
        )}
        
        <button
          onClick={handleRequestLocation}
          disabled={geolocation.state.loading}
          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {geolocation.state.loading ? "Завантаження..." : "Запросити геолокацію"}
        </button>
      </div>
    </div>
  );
};

export default GeolocationTester;
