import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store';
import { fetchCategories } from '../store/catalogSlice';
import { fetchBrands } from '../store/brandSlice';
import { countriesAPI } from '../api/apiClient';
import LocationWithMap from '../components/ui/LocationWithMap';

// Додайте це до глобальних типів
declare global {
  interface Window {
    L: typeof import("leaflet");
  }
}

interface FormData {
  title: string;
  description: string;
  categoryId: string;
  countryId: string;
  regionId: string;
  communityId: string;
  locationName: string;
  latitude: number | undefined;
  longitude: number | undefined;
  useMyLocation: boolean;
}

const CreateListingPageV2 = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [countries, setCountries] = useState<
    {
      id: number;
      name: string;
      code: string;
      latitude?: number;
      longitude?: number;
    }[]
  >([]);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    categoryId: "",
    countryId: "",
    regionId: "",
    communityId: "",
    locationName: "",
    latitude: undefined,
    longitude: undefined,
    useMyLocation: true,
  });

  const [mapLoaded, setMapLoaded] = useState(false);

  // Завантаження базових даних
  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchBrands());
    
    countriesAPI.getAll().then((res) => {
      setCountries(res.data.data || []);
    });
  }, [dispatch]);

  // Динамічне підключення Leaflet
  useEffect(() => {
    if (!mapLoaded && typeof window !== "undefined") {
      const leafletCss = document.createElement("link");
      leafletCss.rel = "stylesheet";
      leafletCss.href = "https://unpkg.com/leaflet/dist/leaflet.css";
      document.head.appendChild(leafletCss);

      const leafletScript = document.createElement("script");
      leafletScript.src = "https://unpkg.com/leaflet/dist/leaflet.js";
      leafletScript.async = true;
      leafletScript.onload = () => setMapLoaded(true);
      document.body.appendChild(leafletScript);
    }
  }, [mapLoaded]);

  // Обробка змін полів
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Обробка змін локації
  const handleLocationChange = (field: string, value: string | number) => {
    console.log('🔄 Location change:', field, value);
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Створення оголошення (Нова система локації)
      </h1>

      <form autoComplete="off">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ліва колонка */}
          <div className="space-y-6">
            {/* Назва */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Назва оголошення *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Наприклад: Трактор John Deere 6155M, 2020"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Опис */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Опис *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Детальний опис товару"
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          {/* Права колонка */}
          <div className="space-y-6">
            {/* Нова система локації */}
            <LocationWithMap
              countries={countries}
              value={{
                countryId: formData.countryId,
                regionId: formData.regionId,
                communityId: formData.communityId,
                locationName: formData.locationName,
                ...(formData.latitude !== undefined && { latitude: formData.latitude }),
                ...(formData.longitude !== undefined && { longitude: formData.longitude }),
                useMyLocation: formData.useMyLocation,
              }}
              onChange={handleLocationChange}
              mapLoaded={mapLoaded}
              showDebugInfo={true} // Включаємо debug для тестування
            />
          </div>
        </div>

        {/* Дії */}
        <div className="mt-8 flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Скасувати
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Тестування нової системи
          </button>
        </div>

        {/* Debug інформація */}
        <div className="mt-8 bg-gray-100 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Debug: Поточний стан форми</h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
      </form>
    </div>
  );
};

export default CreateListingPageV2;
