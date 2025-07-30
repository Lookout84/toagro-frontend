import React, { useEffect, useRef, useCallback, useState } from 'react';
import LocationManager from './LocationManager';
import { LocationCoordinates } from '../../hooks/useLocationManagerV2';

interface Countries {
  id: number;
  name: string;
  code: string;
  latitude?: number;
  longitude?: number;
}

interface LocationWithMapProps {
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
  mapLoaded: boolean;
  errors?: {
    countryId?: string;
    regionId?: string;
    communityId?: string;
    locationName?: string;
    latitude?: string;
  };
  showDebugInfo?: boolean;
}

const LocationWithMap: React.FC<LocationWithMapProps> = ({
  countries,
  value,
  onChange,
  mapLoaded,
  errors,
  showDebugInfo = false,
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const [isMapReady, setIsMapReady] = useState(false);

  // Валідація координат
  const isValidCoordinate = useCallback((coord: unknown): boolean => {
    return (
      coord !== undefined &&
      coord !== null &&
      !isNaN(Number(coord)) &&
      Number(coord) !== 0
    );
  }, []);

  // Обробка кліку на карті
  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    if (e.originalEvent && typeof e.originalEvent.preventDefault === "function") {
      e.originalEvent.preventDefault();
    }
    if (e.originalEvent && typeof e.originalEvent.stopPropagation === "function") {
      e.originalEvent.stopPropagation();
    }

    const { lat, lng } = e.latlng;
    
    // Оновлюємо маркер
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else if (mapRef.current && window.L) {
      markerRef.current = window.L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);
      if (markerRef.current) {
        markerRef.current.on("dragend", (event: L.LeafletEvent) => {
          const pos = (event.target as L.Marker).getLatLng();
          onChange('latitude', pos.lat);
          onChange('longitude', pos.lng);
        });
      }
    }

    // Оновлюємо координати в формі
    onChange('latitude', lat);
    onChange('longitude', lng);
  }, [onChange]);

  // Ініціалізація карти
  useEffect(() => {
    if (
      mapLoaded &&
      window.L &&
      document.getElementById("location-with-map") &&
      !mapRef.current &&
      !isInitializedRef.current
    ) {
      try {
        const L = window.L;
        isInitializedRef.current = true;

        // Встановлення центру карти
        let center: [number, number] = [48.3794, 31.1656]; // Default Ukraine center

        // Використовуємо координати країни якщо є
        const selectedCountry = countries.find(c => c.id.toString() === value.countryId);
        if (selectedCountry && selectedCountry.latitude && selectedCountry.longitude) {
          center = [selectedCountry.latitude, selectedCountry.longitude];
        }

        mapRef.current = L.map("location-with-map").setView(center, 6);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://osm.org/copyright">OSM</a>',
        }).addTo(mapRef.current);

        // Обробник кліку на карті
        if (mapRef.current) {
          mapRef.current.on("click", handleMapClick);
        }

        setIsMapReady(true);
      } catch (error) {
        console.error("Error initializing map:", error);
        isInitializedRef.current = false;
      }
    }
  }, [mapLoaded, handleMapClick, countries, value.countryId]);

  // Оновлення центру карти при зміні країни
  useEffect(() => {
    if (mapRef.current && countries.length && value.countryId) {
      try {
        const country = countries.find(c => c.id.toString() === value.countryId);
        let center: [number, number] = [48.3794, 31.1656];
        const zoom = 6;

        if (country && country.latitude && country.longitude) {
          center = [country.latitude, country.longitude];
        }

        mapRef.current.setView(center, zoom);
      } catch (error) {
        console.error("Error updating map center:", error);
      }
    }
  }, [value.countryId, countries]);

  // Встановлення маркера при зміні координат
  useEffect(() => {
    if (
      mapRef.current &&
      window.L &&
      isValidCoordinate(value.latitude) &&
      isValidCoordinate(value.longitude)
    ) {
      try {
        const L = window.L;
        const lat = Number(value.latitude);
        const lng = Number(value.longitude);

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], {
            draggable: true,
          }).addTo(mapRef.current);

          if (markerRef.current) {
            markerRef.current.on("dragend", (event: L.LeafletEvent) => {
              const latlng = (event.target as L.Marker).getLatLng();
              onChange('latitude', latlng.lat);
              onChange('longitude', latlng.lng);
            });
          }
        }

        mapRef.current.setView([lat, lng], 12);
      } catch (error) {
        console.error("Error setting marker:", error);
      }
    }
  }, [value.latitude, value.longitude, isValidCoordinate, onChange]);

  // Обробка змін координат від LocationManager
  const handleCoordinatesChange = useCallback((coords: LocationCoordinates) => {
    onChange('latitude', coords.latitude);
    onChange('longitude', coords.longitude);
  }, [onChange]);

  // Очищення карти при демонтажі
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Location Manager */}
      <LocationManager
        countries={countries}
        value={value}
        onChange={onChange}
        onCoordinatesChange={handleCoordinatesChange}
        showDebugInfo={showDebugInfo}
      />

      {/* Карта */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Вкажіть точне місцезнаходження на карті *
        </label>
        <p className="text-sm text-gray-500 mb-3">
          Натисніть на карту, щоб вказати точне місцезнаходження. Маркер можна перетягувати.
        </p>
        <div className="w-full h-64 rounded-md border border-gray-300 overflow-hidden">
          <div
            id="location-with-map"
            style={{ width: "100%", height: "100%" }}
          />
        </div>

        {isValidCoordinate(value.latitude) && isValidCoordinate(value.longitude) && (
          <div className="text-xs text-gray-500 mt-1">
            Координати: {Number(value.latitude).toFixed(6)}, {Number(value.longitude).toFixed(6)}
          </div>
        )}

        {errors?.latitude && (
          <p className="mt-1 text-sm text-red-500">{errors.latitude}</p>
        )}
      </div>

      {/* Статус карти */}
      {!mapLoaded && (
        <div className="text-sm text-gray-500">
          Завантаження карти...
        </div>
      )}

      {mapLoaded && !isMapReady && (
        <div className="text-sm text-orange-500">
          Ініціалізація карти...
        </div>
      )}
    </div>
  );
};

export default LocationWithMap;
