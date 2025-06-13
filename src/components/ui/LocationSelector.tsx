import React, { useEffect, useRef, useCallback, useState } from "react";
import { useAppSelector } from "../../store";
import { ChevronDown } from "lucide-react";
import axios from "axios";

interface LocationSelectorProps {
  countries: {
    id: number;
    name: string;
    code: string;
    latitude?: number;
    longitude?: number;
  }[];
  data: {
    countryId: string;
    regionId: string;
    communityId: string;
    locationName: string;
    latitude: number;
    longitude: number;
  };
  errors: {
    countryId?: string;
    regionId?: string;
    communityId?: string;
    locationName?: string;
    latitude?: string;
  };
  onChange: (name: string, value: string | number) => void;
  mapLoaded: boolean;
  useCountryCoordinates?: boolean;
}

// Інтерфейс для даних зворотного геокодування від OpenStreetMap
interface GeocodingResult {
  address: {
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    suburb?: string;
    county?: string;
    state?: string;
    country?: string;
    country_code?: string;
    postcode?: string;
  };
  display_name: string;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  countries,
  data,
  errors,
  onChange,
  mapLoaded,
  useCountryCoordinates = false,
}) => {
  const { regions, communities } = useAppSelector((state) => state.locations);

  // References для карти і маркера
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const isInitializedRef = useRef<boolean>(false);

  // Стан для зберігання результатів геокодування
  const [geocodingInProgress, setGeocodingInProgress] = useState(false);
  const [geocodingResult, setGeocodingResult] = useState<{
    region?: string;
    community?: string;
    location?: string;
  } | null>(null);

  // Визначаємо, чи країна - Україна
  const selectedCountry = countries.find(
    (c) => c.id.toString() === data.countryId
  );
  const isUkraine = selectedCountry?.code === "UA";

  // Функція для перевірки валідності координат
  const isValidCoordinate = useCallback((coord: unknown): boolean => {
    return (
      coord !== undefined &&
      coord !== null &&
      !isNaN(Number(coord)) &&
      Number(coord) !== 0
    );
  }, []);

  // Функція для отримання інформації про місцезнаходження за координатами
  const getLocationByCoordinates = useCallback(
    async (lat: number, lng: number) => {
      if (!isValidCoordinate(lat) || !isValidCoordinate(lng)) {
        return;
      }

      setGeocodingInProgress(true);

      try {
        const response = await axios.get<GeocodingResult>(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            headers: { "Accept-Language": "uk" },
          }
        );

        const result = response.data;

        const location =
          result.address.city ||
          result.address.town ||
          result.address.village ||
          result.address.hamlet ||
          result.address.suburb;

        const region = result.address.state;
        const community = result.address.county;

        setGeocodingResult({
          region: region || "",
          community: community || "",
          location: location || "",
        });

        if (location) {
          onChange("locationName", location);
        }

        // Для України: спробуємо знайти відповідні регіон і громаду в наших даних
        if (isUkraine && region) {
          const foundRegion = regions.find(
            (r: { id: number; name: string }) =>
              r.name.toLowerCase().includes(region.toLowerCase()) ||
              region.toLowerCase().includes(r.name.toLowerCase())
          );

          if (foundRegion) {
            onChange("regionId", foundRegion.id.toString());

            if (community && communities.length > 0) {
              const foundCommunity = communities.find(
                (c: { id: number; name: string }) =>
                  c.name.toLowerCase().includes(community.toLowerCase()) ||
                  community.toLowerCase().includes(c.name.toLowerCase())
              );

              if (foundCommunity) {
                onChange("communityId", foundCommunity.id.toString());
              }
            }
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error getting location data from coordinates:", error);
      } finally {
        setGeocodingInProgress(false);
      }
    },
    [isUkraine, isValidCoordinate, onChange, regions, communities]
  );

  // Безпечне оновлення координат, щоб уникнути циклу оновлень
  const updateCoordinates = useCallback(
    async (lat: number, lng: number) => {
      onChange("latitude", lat);
      onChange("longitude", lng);
      getLocationByCoordinates(lat, lng);
    },
    [onChange, getLocationByCoordinates]
  );

  // Очищення карти при демонтажі компонента
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Ініціалізація та налаштування карти
  useEffect(() => {
    if (
      mapLoaded &&
      window.L &&
      document.getElementById("listing-map") &&
      !mapRef.current &&
      !isInitializedRef.current
    ) {
      try {
        const L = window.L;
        isInitializedRef.current = true;

        // Встановлення центру карти
        let center: [number, number] = [48.3794, 31.1656]; // Default Ukraine center

        if (
          useCountryCoordinates &&
          selectedCountry &&
          selectedCountry.latitude &&
          selectedCountry.longitude
        ) {
          center = [selectedCountry.latitude, selectedCountry.longitude];
        }

        mapRef.current = L.map("listing-map").setView(center, 6);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://osm.org/copyright">OSM</a>',
        }).addTo(mapRef.current);

        // Обробник кліку на карті - створення маркера
        const handleMapClick = (e: L.LeafletMouseEvent) => {
          // ВАЖЛИВО: блокуємо дефолтну поведінку!
          if (
            e.originalEvent &&
            typeof e.originalEvent.preventDefault === "function"
          ) {
            e.originalEvent.preventDefault();
          }
          if (
            e.originalEvent &&
            typeof e.originalEvent.stopPropagation === "function"
          ) {
            e.originalEvent.stopPropagation();
          }

          const { lat, lng } = e.latlng;

          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(
              mapRef.current!
            );
            markerRef.current.on("dragend", (event: L.LeafletEvent) => {
              const pos = (event.target as L.Marker).getLatLng();
              updateCoordinates(pos.lat, pos.lng);
            });
          }

          updateCoordinates(lat, lng);
        };

        mapRef.current.on("click", handleMapClick);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error initializing map:", error);
        isInitializedRef.current = false;
      }
    }
  }, [mapLoaded, selectedCountry, useCountryCoordinates, updateCoordinates]);

  // Оновлення центру карти при зміні країни
  useEffect(() => {
    if (mapRef.current && countries.length && data.countryId) {
      try {
        const country = countries.find(
          (c) => c.id.toString() === data.countryId
        );

        let center: [number, number] = [48.3794, 31.1656];
        const zoom = 6;

        if (
          useCountryCoordinates &&
          country &&
          country.latitude &&
          country.longitude
        ) {
          center = [country.latitude, country.longitude];
        }

        mapRef.current.setView(center, zoom);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error updating map center:", error);
      }
    }
  }, [data.countryId, countries, useCountryCoordinates]);

  // Встановлення маркера при зміні координат
  useEffect(() => {
    if (
      mapRef.current &&
      window.L &&
      isValidCoordinate(data.latitude) &&
      isValidCoordinate(data.longitude)
    ) {
      try {
        const L = window.L;
        const lat = Number(data.latitude);
        const lng = Number(data.longitude);

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], {
            draggable: true,
          }).addTo(mapRef.current);

          markerRef.current.on("dragend", (event: L.LeafletEvent) => {
            const latlng = (event.target as L.Marker).getLatLng();
            updateCoordinates(latlng.lat, latlng.lng);
          });
        }

        mapRef.current.setView([lat, lng], 12);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error setting marker:", error);
      }
    }
  }, [data.latitude, data.longitude, isValidCoordinate, updateCoordinates]);

  return (
    <>
      {/* Країна */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Країна для позиціювання на карті *
        </label>
        <div className="relative">
          <select
            id="countryId"
            name="countryId"
            value={data.countryId || ""}
            onChange={(e) => onChange("countryId", e.target.value)}
            className={`appearance-none w-full px-4 py-2 border ${
              errors.countryId ? "border-red-500" : "border-gray-300"
            } rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500`}
          >
            <option value="">Виберіть країну</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown size={18} className="text-gray-400" />
          </div>
        </div>
        {errors.countryId && (
          <p className="mt-1 text-sm text-red-500">{errors.countryId}</p>
        )}
      </div>

      {/* Карта для вибору координат і автоматичного отримання даних */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Вкажіть місцезнаходження на карті *
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Натисніть на карту, щоб вказати точне місцезнаходження. Інформація про регіон та населений пункт буде отримана автоматично.
        </p>
        <div className="w-full h-64 rounded-md border border-gray-300 overflow-hidden">
          <div
            id="listing-map"
            style={{ width: "100%", height: "100%" }}
          />
        </div>

        {isValidCoordinate(data.latitude) && isValidCoordinate(data.longitude) && (
          <div className="text-xs text-gray-500 mt-1">
            Координати: {Number(data.latitude).toFixed(6)}, {Number(data.longitude).toFixed(6)}
          </div>
        )}

        {errors.latitude && (
          <p className="mt-1 text-sm text-red-500">{errors.latitude}</p>
        )}

        {geocodingInProgress && (
          <p className="text-xs text-blue-500 mt-1">
            Отримання даних про місцезнаходження...
          </p>
        )}
      </div>

      {/* Інформація про місцезнаходження */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Дані про місцезнаходження
        </h3>

        <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
          <div className="grid gap-2">
            {/* Область/Регіон */}
            <div className="flex flex-row items-start">
              <span className="text-xs font-medium text-gray-500 w-1/3">Область/Регіон:</span>
              <span className="text-xs text-gray-700">
                {geocodingResult?.region ||
                  (data.regionId &&
                    regions?.find((r: { id: number; name: string }) => r.id.toString() === data.regionId)?.name) ||
                  "-"}
                <input type="hidden" name="regionId" value={data.regionId} />
              </span>
            </div>

            {/* Громада - тільки для України */}
            {isUkraine && (
              <div className="flex flex-row items-start">
                <span className="text-xs font-medium text-gray-500 w-1/3">Громада:</span>
                <span className="text-xs text-gray-700">
                  {geocodingResult?.community ||
                    (data.communityId &&
                      communities?.find((c: { id: number; name: string }) => c.id.toString() === data.communityId)?.name) ||
                    "-"}
                  <input type="hidden" name="communityId" value={data.communityId} />
                </span>
              </div>
            )}

            {/* Населений пункт */}
            <div className="flex flex-row items-start">
              <span className="text-xs font-medium text-gray-500 w-1/3">Населений пункт:</span>
              <div className="w-2/3">
                <input
                  type="text"
                  id="locationName"
                  name="locationName"
                  value={data.locationName}
                  onChange={(e) => onChange("locationName", e.target.value)}
                  placeholder="Введіть або уточніть назву"
                  className={`w-full px-2 py-1 text-xs border ${
                    errors.locationName ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500`}
                />
                {errors.locationName && (
                  <p className="mt-1 text-xs text-red-500">{errors.locationName}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LocationSelector;