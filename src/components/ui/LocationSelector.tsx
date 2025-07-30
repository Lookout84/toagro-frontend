import React, { useEffect, useRef, useCallback, useState } from "react";
import { useAppSelector } from "../../store";
import { ChevronDown } from "lucide-react";
import axios from "axios";
import { useLocationSearch, type LocationSearchResult } from "../../hooks/useLocationSearch";

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
  onMapClick?: (name: string, value: string | number) => void; // Спеціальний обробник для кліків на карті
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
  onMapClick,
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

  // Стан для автодоповнення пошуку
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { results: searchResults, isLoading: isSearching, searchLocations } = useLocationSearch();
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Обробник для зміни значення в полі пошуку
  const handleLocationNameChange = useCallback((value: string) => {
    onChange("locationName", value);
    setSearchQuery(value);
    if (value.length > 2) {
      searchLocations(value);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [onChange, searchLocations]);

  // Обробник для вибору локації з автодоповнення
  const handleLocationSelect = useCallback((location: LocationSearchResult) => {
    onChange("locationName", location.name);
    onChange("latitude", location.coordinates.lat);
    onChange("longitude", location.coordinates.lng);
    setShowDropdown(false);
    setSearchQuery("");
  }, [onChange]);

  // Закриття випадаючого списку при кліці поза ним
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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

  // Спеціальне оновлення координат для кліків на карті
  const updateCoordinatesFromMapClick = useCallback(
    async (lat: number, lng: number) => {
      // Використовуємо спеціальний обробник якщо є, інакше звичайний
      if (onMapClick) {
        onMapClick("latitude", lat);
        onMapClick("longitude", lng);
        // НЕ викликаємо getLocationByCoordinates для збереження ручного вводу
      } else {
        onChange("latitude", lat);
        onChange("longitude", lng);
        // Тільки для звичайного onChange викликаємо геокодування
        getLocationByCoordinates(lat, lng);
      }
    },
    [onChange, onMapClick, getLocationByCoordinates]
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

  // Ініціалізація та налаштування карти з поліпшеною перевіркою
  useEffect(() => {
    const initializeMap = async () => {
      if (!mapLoaded || !window.L || mapRef.current || isInitializedRef.current) {
        return;
      }

      // Чекаємо поки елемент карти буде доступний
      const mapElement = document.getElementById("listing-map");
      if (!mapElement) {
        console.warn("🗺️ Елемент карти ще не готовий, чекаємо...");
        return;
      }

      // Перевіряємо розміри елементу
      const rect = mapElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        console.warn("🗺️ Елемент карти має нульові розміри, чекаємо...");
        return;
      }

      try {
        const L = window.L;
        isInitializedRef.current = true;

        console.log("🗺️ Початок ініціалізації карти...");
        console.log("📐 Розміри елементу карти:", { width: rect.width, height: rect.height });

        // Встановлення центру карти
        let center: [number, number] = [48.3794, 31.1656]; // Default Ukraine center

        if (
          useCountryCoordinates &&
          selectedCountry &&
          selectedCountry.latitude &&
          selectedCountry.longitude
        ) {
          center = [selectedCountry.latitude, selectedCountry.longitude];
          console.log("🌍 Використовуємо координати країни:", center);
        }

        console.log("🎯 Центр карти:", center);

        mapRef.current = L.map("listing-map", {
          zoomControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          touchZoom: true,
          boxZoom: true,
          keyboard: true,
          dragging: true,
          preferCanvas: false,
          attributionControl: true
        }).setView(center, 6);

        console.log("🗺️ Карта створена, додаємо тайли...");

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://osm.org/copyright">OSM</a>',
          maxZoom: 19,
          minZoom: 1
        }).addTo(mapRef.current);

        console.log("🎨 Тайли додані, налаштовуємо розміри...");

        // Множинні спроби invalidateSize для стабільності
        const performInvalidateSize = (attempt: number) => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
            console.log(`� Invalidate size спроба ${attempt}`);
          }
        };

        // Негайно
        performInvalidateSize(1);
        
        // Через 100мс
        setTimeout(() => performInvalidateSize(2), 100);
        
        // Через 300мс
        setTimeout(() => performInvalidateSize(3), 300);
        
        // Через 1000мс (остаточна спроба)
        setTimeout(() => performInvalidateSize(4), 1000);

        // Обробник кліку на карті - створення маркера
        const handleMapClick = (e: L.LeafletMouseEvent) => {
          console.log("🖱️ Клік по карті:", e.latlng);
          
          const { lat, lng } = e.latlng;

          if (markerRef.current && mapRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else if (mapRef.current) {
            markerRef.current = L.marker([lat, lng], { 
              draggable: true 
            }).addTo(mapRef.current);
            
            if (markerRef.current) {
              markerRef.current.on("dragend", (event: L.LeafletEvent) => {
                const pos = (event.target as L.Marker).getLatLng();
                updateCoordinatesFromMapClick(pos.lat, pos.lng);
              });
            }
          }

          updateCoordinatesFromMapClick(lat, lng);
        };

        if (mapRef.current) {
          mapRef.current.on("click", handleMapClick);
        }

        // Додаємо початковий маркер якщо є координати
        if (
          data.latitude &&
          data.longitude &&
          typeof data.latitude === "number" &&
          typeof data.longitude === "number"
        ) {
          if (markerRef.current && mapRef.current) {
            mapRef.current.removeLayer(markerRef.current);
          }

          if (mapRef.current) {
            markerRef.current = L.marker([
              data.latitude,
              data.longitude,
            ]).addTo(mapRef.current);

            mapRef.current.setView(
              [data.latitude, data.longitude],
              13
            );
          }
        }

        console.log("✅ Карта успішно ініціалізована");
      } catch (error) {
        console.error("❌ Помилка ініціалізації карти:", error);
        isInitializedRef.current = false;
      }
    };

    // Викликаємо ініціалізацію
    initializeMap();
  }, [mapLoaded, selectedCountry, useCountryCoordinates, updateCoordinatesFromMapClick, data.latitude, data.longitude]);

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

          if (markerRef.current) {
            markerRef.current.on("dragend", (event: L.LeafletEvent) => {
              const latlng = (event.target as L.Marker).getLatLng();
              updateCoordinatesFromMapClick(latlng.lat, latlng.lng);
            });
          }
        }

        mapRef.current.setView([lat, lng], 12);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error setting marker:", error);
      }
    }
  }, [data.latitude, data.longitude, isValidCoordinate, updateCoordinatesFromMapClick]);

  // Перерахунок розміру карти коли вона стає видимою
  useEffect(() => {
    if (mapRef.current && mapLoaded) {
      const resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) {
          setTimeout(() => {
            mapRef.current?.invalidateSize();
            console.log("🗺️ Карта перерахована через ResizeObserver");
          }, 100);
        }
      });

      const mapElement = document.getElementById("listing-map");
      if (mapElement) {
        resizeObserver.observe(mapElement);
      }

      // Також викликаємо invalidateSize() при першому рендері
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
          console.log("🗺️ Карта перерахована при першому рендері");
        }
      }, 200);

      return () => {
        resizeObserver.disconnect();
      };
    }
    return undefined;
  }, [mapLoaded]);

  // ResizeObserver для автоматичного оновлення карти при зміні розмірів
  useEffect(() => {
    if (!mapRef.current) return;

    const mapElement = document.getElementById("listing-map");
    if (!mapElement) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === mapElement && mapRef.current) {
          console.log("📐 Зміна розміру карти виявлена, оновлюємо...");
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.invalidateSize();
              console.log("🔄 Карта оновлена через ResizeObserver");
            }
          }, 100);
        }
      }
    });

    resizeObserver.observe(mapElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, []); // ResizeObserver doesn't need dependencies

  // Додатковий useEffect для забезпечення того, що карта ініціалізується після рендеру
  useEffect(() => {
    if (mapLoaded && !mapRef.current) {
      const timeout = setTimeout(() => {
        console.log("🕐 Додаткова спроба ініціалізації карти через 500мс");
        const mapElement = document.getElementById("listing-map");
        if (mapElement) {
          const rect = mapElement.getBoundingClientRect();
          console.log("📐 Розміри елементу при додатковій спробі:", { width: rect.width, height: rect.height });
          
          // Примусово викликаємо ре-рендер якщо елемент готовий
          if (rect.width > 0 && rect.height > 0) {
            console.log("🔄 Примусовий ре-рендер для ініціалізації карти");
            // Скидаємо прапор ініціалізації щоб дозволити повторну спробу
            isInitializedRef.current = false;
          }
        }
      }, 500);

      return () => clearTimeout(timeout);
    }
    
    // Повертаємо undefined для випадків коли умова не виконується
    return undefined;
  }, [mapLoaded]);

  // Debug лог стану компонента
  console.log("🔍 LocationSelector render:", {
    mapLoaded,
    hasWindow: typeof window !== "undefined",
    hasL: typeof window !== "undefined" && !!window.L,
    hasMapRef: !!mapRef.current,
    isInitialized: isInitializedRef.current,
    dataCoords: { lat: data.latitude, lng: data.longitude }
  });

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
        <div className="w-full h-64 rounded-md border border-gray-300 overflow-hidden bg-gray-50" style={{ position: 'relative', minHeight: '256px' }}>
          <div
            id="listing-map"
            style={{ 
              width: "100%", 
              height: "100%",
              minHeight: "256px",
              position: "relative",
              zIndex: 1,
              backgroundColor: '#f3f4f6'
            }}
          />
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500" style={{ zIndex: 10 }}>
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-2"></div>
                <p className="text-sm">Завантаження карти...</p>
              </div>
            </div>
          )}
          <style>{`
            #listing-map {
              width: 100% !important;
              height: 100% !important;
              min-height: 256px !important;
              background-color: #f3f4f6 !important;
              border-radius: 6px;
            }
            .leaflet-container {
              width: 100% !important;
              height: 100% !important;
              min-height: 256px !important;
              background-color: #f3f4f6 !important;
              border-radius: 6px !important;
              font: 12px/1.5 "Helvetica Neue", Arial, Helvetica, sans-serif;
            }
            .leaflet-control-container {
              z-index: 1000 !important;
            }
            .leaflet-tile-pane {
              z-index: 100 !important;
            }
            .leaflet-overlay-pane {
              z-index: 400 !important;
            }
            .leaflet-marker-pane {
              z-index: 600 !important;
            }
            .leaflet-popup-pane {
              z-index: 700 !important;
            }
            .leaflet-control-zoom {
              border: none !important;
              border-radius: 4px !important;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
            }
            .leaflet-control-zoom a {
              border-radius: 4px !important;
              color: #374151 !important;
              border: 1px solid #d1d5db !important;
            }
            .leaflet-control-zoom a:hover {
              background-color: #f9fafb !important;
              border-color: #9ca3af !important;
            }
          `}</style>
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
              <div className="w-2/3 relative" ref={dropdownRef}>
                <input
                  type="text"
                  id="locationName"
                  name="locationName"
                  value={data.locationName}
                  onChange={(e) => handleLocationNameChange(e.target.value)}
                  onFocus={() => {
                    if (data.locationName.length > 2) {
                      setSearchQuery(data.locationName);
                      searchLocations(data.locationName);
                      setShowDropdown(true);
                    }
                  }}
                  placeholder="Введіть або уточніть назву"
                  className={`w-full px-2 py-1 text-xs border ${
                    errors.locationName ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500`}
                />
                
                {/* Випадаючий список автодоповнення */}
                {showDropdown && (searchResults.length > 0 || isSearching) && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {isSearching && (
                      <div className="px-3 py-2 text-xs text-gray-500">
                        Пошук...
                      </div>
                    )}
                    
                    {!isSearching && searchResults.map((result, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 text-xs cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                        onClick={() => handleLocationSelect(result)}
                      >
                        <div className="font-medium text-gray-900">{result.name}</div>
                        <div className="text-gray-500 text-[10px] mt-1">
                          {result.region && `${result.region}, `}
                          {result.country}
                        </div>
                      </div>
                    ))}
                    
                    {!isSearching && searchResults.length === 0 && searchQuery.length > 2 && (
                      <div className="px-3 py-2 text-xs text-gray-500">
                        Не знайдено результатів
                      </div>
                    )}
                  </div>
                )}
                
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