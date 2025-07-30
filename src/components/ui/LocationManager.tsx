import React, { useEffect } from 'react';
import { MapPin, RefreshCw, Settings } from 'lucide-react';
import { useLocationManager, LocationCoordinates } from '../../hooks/useLocationManagerV2';

interface Countries {
  id: number;
  name: string;
  code: string;
  latitude?: number;
  longitude?: number;
}

interface LocationManagerProps {
  countries: Countries[];
  value: {
    countryId: string;
    regionId: string;
    communityId: string;
    locationName: string;
    latitude?: number;
    longitude?: number;
    useMyLocation?: boolean;
  };
  onChange: (field: string, value: string | number) => void;
  onCoordinatesChange?: (coords: LocationCoordinates) => void;
  autoRequestLocation?: boolean;
  showDebugInfo?: boolean;
}

const LocationManager: React.FC<LocationManagerProps> = ({
  countries,
  value,
  onChange,
  onCoordinatesChange,
  autoRequestLocation = true,
  showDebugInfo = false,
}) => {
  const locationManager = useLocationManager(countries, {
    current: {
      countryId: value.countryId,
      locationName: value.locationName,
      ...(value.latitude && value.longitude && {
        coordinates: {
          latitude: value.latitude,
          longitude: value.longitude,
        }
      }),
    },
    useUserLocationByDefault: value.useMyLocation ?? true,
  });

  const { state, actions, coordinates, isLocationReady, hasManualInput } = locationManager;

  // Автоматичний запит геолокації при завантаженні
  useEffect(() => {
    if (autoRequestLocation && countries.length > 0 && !coordinates) {
      actions.requestBrowserLocation();
    }
  }, [autoRequestLocation, countries.length, coordinates, actions]);

  // Синхронізація змін з зовнішньою формою
  useEffect(() => {
    if (state.current.countryId && state.current.countryId !== value.countryId) {
      onChange('countryId', state.current.countryId);
    }
  }, [state, value, onChange]);

  useEffect(() => {
    if (state.current.locationName && state.current.locationName !== value.locationName) {
      onChange('locationName', state.current.locationName);
    }
  }, [state, value, onChange]);

  useEffect(() => {
    if (coordinates && onCoordinatesChange) {
      onCoordinatesChange(coordinates);
    }
  }, [coordinates, onCoordinatesChange]);

  // Обробники подій
  const handleManualLocationChange = (newLocationName: string) => {
    actions.setManualField('locationName', newLocationName);
    onChange('locationName', newLocationName);
  };

  const handleManualCountryChange = (countryId: string) => {
    actions.setManualField('countryId', countryId);
    onChange('countryId', countryId);
  };

  const handleUseMyLocationToggle = () => {
    const newValue = !state.useUserLocationByDefault;
    actions.setUseUserLocationByDefault(newValue);
    onChange('useMyLocation', newValue ? 'true' : 'false');
    
    if (newValue && !state.isLoadingBrowserLocation) {
      actions.requestBrowserLocation();
    }
  };

  // Можливо використаємо пізніше для додаткової функціональності
  // const handleMapClick = (coords: LocationCoordinates) => {
  //   actions.setCoordinatesFromMap(coords);
  //   if (onCoordinatesChange) {
  //     onCoordinatesChange(coords);
  //   }
  // };

  const handleForceGeocode = () => {
    if (coordinates) {
      actions.forceGeocode(coordinates);
    }
  };

  return (
    <div className="space-y-4">
      {/* Заголовок секції */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-green-600" />
          Місцезнаходження товару
        </h3>
        
        {showDebugInfo && (
          <button
            type="button"
            onClick={() => actions.setPreserveManualInput(!state.preserveManualInput)}
            className={`p-2 rounded-md text-sm flex items-center ${
              state.preserveManualInput 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700'
            }`}
            title={`Збереження ручного вводу: ${state.preserveManualInput ? 'Увімкнено' : 'Вимкнено'}`}
          >
            <Settings className="w-4 h-4 mr-1" />
            {state.preserveManualInput ? 'Захист ON' : 'Захист OFF'}
          </button>
        )}
      </div>

      {/* Контроли геолокації */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={state.useUserLocationByDefault}
              onChange={handleUseMyLocationToggle}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Використовувати моє місцезнаходження
            </span>
          </label>
          
          <button
            type="button"
            onClick={() => actions.requestBrowserLocation()}
            disabled={state.isLoadingBrowserLocation}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${state.isLoadingBrowserLocation ? 'animate-spin' : ''}`} />
            {state.isLoadingBrowserLocation ? 'Отримання...' : 'Оновити'}
          </button>
        </div>

        {/* Статус геолокації */}
        <div className="text-sm text-gray-600">
          {state.isLoadingBrowserLocation && (
            <div className="flex items-center text-blue-600">
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Отримання вашого місцезнаходження...
            </div>
          )}
          
          {isLocationReady && (
            <div className="flex items-center text-green-600">
              <MapPin className="w-4 h-4 mr-2" />
              Координати: {coordinates?.latitude.toFixed(6)}, {coordinates?.longitude.toFixed(6)}
            </div>
          )}
          
          {state.isGeocodingInProgress && (
            <div className="flex items-center text-orange-600">
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Визначення адреси...
            </div>
          )}
        </div>
      </div>

      {/* Поля вводу */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Країна */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Країна *
          </label>
          <div className="relative">
            <select
              value={value.countryId}
              onChange={(e) => handleManualCountryChange(e.target.value)}
              className="appearance-none w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Виберіть країну</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
            {state.sources.country?.type === 'geocoding' && (
              <div className="absolute right-8 top-2 text-xs text-green-600" title="Автоматично визначено">
                🌍
              </div>
            )}
          </div>
        </div>

        {/* Населений пункт */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Населений пункт *
          </label>
          <div className="relative">
            <input
              type="text"
              value={value.locationName}
              onChange={(e) => handleManualLocationChange(e.target.value)}
              placeholder="Введіть назву населеного пункту"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            />
            {state.sources.locationName?.type === 'geocoding' && (
              <div className="absolute right-2 top-2 text-xs text-green-600" title="Автоматично визначено">
                🌍
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Індикатори автоматично заповнених полів */}
      {(state.sources.country?.type === 'geocoding' || state.sources.locationName?.type === 'geocoding') && (
        <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Автоматично заповнено на основі геолокації:</span>
          </div>
          <ul className="mt-1 ml-6 text-xs">
            {state.sources.country?.type === 'geocoding' && <li>• Країна</li>}
            {state.sources.locationName?.type === 'geocoding' && <li>• Населений пункт</li>}
          </ul>
          <p className="mt-2 text-xs text-gray-600">
            Ви можете змінити ці дані вручну, якщо вони неточні.
          </p>
        </div>
      )}

      {/* Захист від перезапису */}
      {hasManualInput && state.preserveManualInput && (
        <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Захист ручного вводу активний</span>
          </div>
          <p className="mt-1 text-xs">
            Поля, які ви ввели вручну, не будуть автоматично перезаписані геолокацією.
          </p>
          {coordinates && (
            <button
              type="button"
              onClick={handleForceGeocode}
              className="mt-2 text-xs underline hover:no-underline"
            >
              Примусово оновити з поточних координат
            </button>
          )}
        </div>
      )}

      {/* Debug інформація */}
      {showDebugInfo && (
        <div className="bg-gray-100 p-3 rounded-md text-xs">
          <details>
            <summary className="cursor-pointer font-medium">Debug інформація</summary>
            <div className="mt-2 space-y-1">
              <div><strong>Координати:</strong> {coordinates ? `${coordinates.latitude}, ${coordinates.longitude}` : 'Немає'}</div>
              <div><strong>Джерело координат:</strong> {state.sources.coordinates?.type || 'Немає'}</div>
              <div><strong>Джерело країни:</strong> {state.sources.country?.type || 'Немає'}</div>
              <div><strong>Джерело населеного пункту:</strong> {state.sources.locationName?.type || 'Немає'}</div>
              <div><strong>Захист ручного вводу:</strong> {state.preserveManualInput ? 'Так' : 'Ні'}</div>
              <div><strong>Геокодування:</strong> {state.isGeocodingInProgress ? 'В процесі' : 'Завершено'}</div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default LocationManager;
