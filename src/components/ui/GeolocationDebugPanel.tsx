import React from 'react';
import { useAppDispatch } from '../../store';
import { fetchRegions } from '../../store/locationSlice';
import { countriesAPI } from '../../api/apiClient';

interface GeolocationDebugPanelProps {
  formData: {
    useMyLocation: boolean;
    userLatitude: number | null;
    userLongitude: number | null;
    latitude: number | undefined;
    longitude: number | undefined;
    countryId: string;
    regionId: string;
    locationName: string;
  };
  countries: Array<{
    id: number;
    name: string;
    code: string;
    latitude?: number;
    longitude?: number;
  }>;
  onLocationChange: (name: string, value: string | number) => void;
  processGeocodeAddress: (
    address: Record<string, string>,
    countries: Array<{ id: number; name: string; code: string; latitude?: number; longitude?: number }>
  ) => { country: { id: number; name: string; code: string; latitude?: number; longitude?: number }; locationName: string; regionName: string } | null;
  onForceGeocodeUpdate?: (lat: number, lng: number) => void;
}

const GeolocationDebugPanel: React.FC<GeolocationDebugPanelProps> = ({
  formData,
  countries,
  onLocationChange,
  processGeocodeAddress,
  onForceGeocodeUpdate
}) => {
  const dispatch = useAppDispatch();
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!isDevelopment) {
    return null;
  }

  const handleGeolocationTest = () => {
    console.log("Тест геолокації вручну");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => console.log("Тест успішний:", pos.coords),
        (err) => console.error("Тест неуспішний:", err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  const handleShowFormState = () => {
    console.log("Поточний стан форми:", {
      useMyLocation: formData.useMyLocation,
      userCoords: [formData.userLatitude, formData.userLongitude],
      productCoords: [formData.latitude, formData.longitude],
      country: formData.countryId,
      region: formData.regionId,
      location: formData.locationName
    });
  };

  const handleMapTest = () => {
    // Симуляція вибору координат на карті
    const testLat = 49.8397 + (Math.random() - 0.5) * 0.01; // Тернопіль +/- невелика відстань
    const testLng = 25.9332 + (Math.random() - 0.5) * 0.01;
    
    console.log("🗺️ Симуляція вибору координат на карті:", { lat: testLat, lng: testLng });
    
    // Викликаємо функцію так, як її викликає карта
    onLocationChange("latitude", testLat);
    onLocationChange("longitude", testLng);
    
    console.log("Координати товару оновлені. useMyLocation повинен стати false");
  };

  const handleShowCountries = () => {
    console.log("=== КРАЇНИ В БАЗІ ===");
    console.log("Кількість країн:", countries.length);
    countries.forEach((country, index) => {
      console.log(`${index + 1}. ID: ${country.id}, Name: "${country.name}", Code: "${country.code}"`);
    });
    console.log("Шукаємо код 'ua' серед:", countries.map(c => `"${c.code}"`));
    
    // Знаходимо Україну
    const ukraine = countries.find(c => 
      c.code?.toLowerCase() === 'ua' || 
      c.name?.toLowerCase().includes('україн') ||
      c.name?.toLowerCase().includes('ukraine')
    );
    console.log("Знайдена Україна:", ukraine);
  };

  const handleTestRegions = () => {
    if (formData.countryId) {
      console.log(`=== ТЕСТ ЗАВАНТАЖЕННЯ РЕГІОНІВ для країни ${formData.countryId} ===`);
      dispatch(fetchRegions(formData.countryId))
        .unwrap()
        .then((regions) => {
          console.log("✅ Регіони успішно завантажені:", regions);
        })
        .catch((error) => {
          console.error("❌ Помилка завантаження регіонів:", error);
        });
    } else {
      console.warn("Країна не вибрана. Спочатку виберіть країну.");
    }
  };

  const handleTestAPI = async () => {
    console.log("=== ТЕСТ API ENDPOINTS ===");
    
    // Тест загального списку країн
    try {
      const countriesResponse = await countriesAPI.getAll();
      console.log("✅ Країни:", countriesResponse.data);
    } catch (error) {
      console.error("❌ Помилка завантаження країн:", error);
    }
    
    // Тест загального списку регіонів (без countryId)
    try {
      const regionsResponse = await fetch('http://localhost:5000/api/regions');
      if (regionsResponse.ok) {
        const regionsData = await regionsResponse.json();
        console.log("✅ Всі регіони:", regionsData);
      } else {
        console.error("❌ Помилка завантаження всіх регіонів:", regionsResponse.status);
      }
    } catch (error) {
      console.error("❌ Помилка запиту всіх регіонів:", error);
    }
    
    // Тест конкретного endpoint'у для країни
    if (formData.countryId) {
      try {
        const response = await fetch(`http://localhost:5000/api/regions/by-country/${formData.countryId}`);
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Регіони для країни ${formData.countryId}:`, data);
        } else {
          console.error(`❌ Помилка 404 для країни ${formData.countryId}:`, response.status, response.statusText);
        }
      } catch (error) {
        console.error(`❌ Помилка запиту регіонів для країни ${formData.countryId}:`, error);
      }
    }
  };

  const handleShowRegions = () => {
    const state = (window as unknown as { store?: { getState: () => { locations?: { regions?: { id: number | string; name: string }[] } } } })?.store?.getState();
    const regions = state?.locations?.regions || [];
    console.log("=== РЕГІОНИ В СТОРІ ===");
    console.log("Кількість регіонів:", regions.length);
    console.log("Список регіонів:", regions.map((r: { id: number | string; name: string }) => `${r.id}: ${r.name}`));
  };

  const handleTestAddress = () => {
    if (formData.userLatitude && formData.userLongitude) {
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${formData.userLatitude}&lon=${formData.userLongitude}&zoom=18&addressdetails=1`
      )
        .then((res) => res.json())
        .then((result) => {
          console.log("=== ТЕСТ ОБРОБКИ АДРЕСИ ===");
          console.log("Сира адреса:", result.address);
          const processed = processGeocodeAddress(result.address || {}, countries);
          console.log("Оброблена адреса:", processed);
        });
    }
  };

  const handleForceUpdate = () => {
    if (formData.userLatitude && formData.userLongitude && onForceGeocodeUpdate) {
      console.log("=== ФОРСОВАНЕ ОНОВЛЕННЯ ГЕОЛОКАЦІЇ ===");
      console.log("Перезаписуємо всі дані на основі геолокації");
      onForceGeocodeUpdate(formData.userLatitude, formData.userLongitude);
    }
  };

  const handleClearForm = () => {
    console.log("=== ОЧИЩЕННЯ ФОРМИ ===");
    onLocationChange("countryId", "");
    onLocationChange("locationName", "");
  };

  const handleFillTestData = () => {
    console.log("=== ЗАПОВНЕННЯ ТЕСТОВИМИ ДАНИМИ ===");
    
    // Знайдемо Україну в списку країн
    const ukraine = countries.find(c => 
      c.code?.toLowerCase() === 'ua' || 
      c.name?.toLowerCase().includes('україн') ||
      c.name?.toLowerCase().includes('ukraine')
    );
    
    if (ukraine) {
      console.log("Знайдена Україна:", ukraine);
      onLocationChange("countryId", String(ukraine.id));
    } else {
      console.warn("Україну не знайдено, використовуємо першу країну");
      console.log("Доступні країни:", countries);
      if (countries.length > 0 && countries[0]) {
        onLocationChange("countryId", String(countries[0].id));
      }
    }
    
    onLocationChange("locationName", "Тестове місто");
  };

  return (
    <div className="bg-gray-50 p-3 rounded-md">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <button
          type="button"
          onClick={handleGeolocationTest}
          className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          🧪 Тест геолокації
        </button>
        
        <button
          type="button"
          onClick={handleShowFormState}
          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          📊 Показати стан
        </button>
        
        <button
          type="button"
          onClick={handleMapTest}
          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
        >
          🗺️ Тест карти
        </button>
        
        <button
          type="button"
          onClick={handleShowCountries}
          className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
        >
          🏴 Показати країни
        </button>
        
        <button
          type="button"
          onClick={handleTestRegions}
          className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
        >
          🗺️ Тест регіонів
        </button>
        
        <button
          type="button"
          onClick={handleTestAPI}
          className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          🔧 Тест API
        </button>
        
        <button
          type="button"
          onClick={handleShowRegions}
          className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          📍 Показати регіони
        </button>
        
        <button
          type="button"
          onClick={handleTestAddress}
          className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          🌍 Тест адреси
        </button>
        
        {formData.userLatitude && formData.userLongitude && (
          <button
            type="button"
            onClick={handleForceUpdate}
            className="px-3 py-1 text-xs bg-red-700 text-white rounded hover:bg-red-800"
          >
            🔄 Перезаписати дані
          </button>
        )}
        
        <button
          type="button"
          onClick={handleClearForm}
          className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          🗑️ Очистити
        </button>
        
        <button
          type="button"
          onClick={handleFillTestData}
          className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
        >
          📝 Тестові дані
        </button>
      </div>
      
      <div className="text-xs text-gray-600">
        <div>Користувач: {formData.userLatitude ? `${formData.userLatitude.toFixed(4)}, ${formData.userLongitude?.toFixed(4)}` : 'не визначено'}</div>
        <div>Товар: {formData.latitude ? `${formData.latitude.toFixed(4)}, ${formData.longitude?.toFixed(4)}` : 'не визначено'}</div>
        <div>Режим: {formData.useMyLocation ? '🔗 Як у користувача' : '🎯 Окремо для товару'}</div>
        <div>Країна: {formData.countryId || 'не вибрано'} | Регіон: {formData.regionId || 'не вибрано'}</div>
        <div>Місто: {formData.locationName || 'не визначено'}</div>
      </div>
    </div>
  );
};

export default GeolocationDebugPanel;
