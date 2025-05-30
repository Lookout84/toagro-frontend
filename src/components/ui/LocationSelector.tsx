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
  const { regions, communities, status: locationStatus } = useAppSelector(
    (state) => state.locations
  );

  // References для карти і маркера
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
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
  const isValidCoordinate = useCallback((coord: any): boolean => {
    return (
      coord !== undefined && 
      coord !== null && 
      !isNaN(Number(coord)) && 
      Number(coord) !== 0
    );
  }, []);

  // Функція для отримання інформації про місцезнаходження за координатами
  const getLocationByCoordinates = useCallback(async (lat: number, lng: number) => {
    if (!isValidCoordinate(lat) || !isValidCoordinate(lng)) {
      return;
    }
    
    setGeocodingInProgress(true);
    
    try {
      console.log("Attempting to get location data from coordinates:", { lat, lng });
      
      // Використовуємо OpenStreetMap Nominatim API для зворотного геокодування
      const response = await axios.get<GeocodingResult>(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: { 'Accept-Language': 'uk' } // Отримати результати українською
        }
      );
      
      const result = response.data;
      console.log("Geocoding result:", result);
      
      // Отримуємо назву населеного пункту
      const location = 
        result.address.city || 
        result.address.town || 
        result.address.village || 
        result.address.hamlet || 
        result.address.suburb;
      
      // Отримуємо регіон/область
      const region = result.address.state;
      
      // Отримуємо громаду/район для України (може бути у county)
      const community = result.address.county;
      
      console.log("Extracted data from geocoding:", { 
        location, 
        region,
        community,
      });
      
      // Зберігаємо результати геокодування у стані
      setGeocodingResult({
        region: region || '',
        community: community || '',
        location: location || '',
      });
      
      // Встановлюємо назву населеного пункту
      if (location) {
        onChange("locationName", location);
      }
      
      // !! ВАЖЛИВО - НЕ ОНОВЛЮЄМО КРАЇНУ З ГЕОДАНИХ !!
      
      // Для України: спробуємо знайти відповідні регіон і громаду в наших даних
      if (isUkraine && region) {
        // Шукаємо регіон за назвою
        const foundRegion = regions.find((r: any) => 
          r.name.toLowerCase().includes(region.toLowerCase()) || 
          region.toLowerCase().includes(r.name.toLowerCase())
        );
        
        if (foundRegion) {
          console.log("Found matching region:", foundRegion);
          onChange("regionId", foundRegion.id.toString());
          
          // Якщо знайшли регіон і є громада, спробуємо знайти громаду
          if (community && communities.length > 0) {
            const foundCommunity = communities.find((c: any) => 
              c.name.toLowerCase().includes(community.toLowerCase()) ||
              community.toLowerCase().includes(c.name.toLowerCase())
            );
            
            if (foundCommunity) {
              console.log("Found matching community:", foundCommunity);
              onChange("communityId", foundCommunity.id.toString());
            }
          }
        }
      }
      
    } catch (error) {
      console.error("Error getting location data from coordinates:", error);
    } finally {
      setGeocodingInProgress(false);
    }
  }, [isUkraine, isValidCoordinate, onChange, regions, communities]);

  // Безпечне оновлення координат, щоб уникнути циклу оновлень
  const updateCoordinates = useCallback(async (lat: number, lng: number) => {
    // Використання setTimeout щоб уникнути проблем з синхронним оновленням стану
    setTimeout(() => {
      console.log("Updating coordinates:", { lat, lng });
      onChange("latitude", lat);
      onChange("longitude", lng);
      
      // Отримуємо дані про місцезнаходження за координатами
      getLocationByCoordinates(lat, lng);
    }, 0);
  }, [onChange, getLocationByCoordinates]);

  // Ініціалізація карти - виконується лише один раз
  useEffect(() => {
    // Очищення карти при демонтажі компонента
    return () => {
      if (mapRef.current) {
        console.log("Cleaning up map on unmount");
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
        let center = [48.3794, 31.1656]; // Default Ukraine center
        
        // Використовуємо координати з моделі Country якщо доступні
        if (useCountryCoordinates && selectedCountry && 
            selectedCountry.latitude && selectedCountry.longitude) {
          center = [selectedCountry.latitude, selectedCountry.longitude];
        }
        
        console.log("Initializing map with center:", center);
        mapRef.current = L.map("listing-map").setView(center, 6);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://osm.org/copyright">OSM</a>',
        }).addTo(mapRef.current);

        // Обробник кліку на карті - створення маркера
        const handleMapClick = (e: any) => {
          const { lat, lng } = e.latlng;
          
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(
              mapRef.current
            );
            // Обробник переміщення маркера
            markerRef.current.on("dragend", (event: any) => {
              const pos = event.target.getLatLng();
              updateCoordinates(pos.lat, pos.lng);
            });
          }
          
          updateCoordinates(lat, lng);
        };

        // Додавання обробника кліку
        mapRef.current.on("click", handleMapClick);
        
        console.log("Map initialized successfully");
      } catch (error) {
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
        
        let center = [48.3794, 31.1656]; // Default Ukraine center
        const zoom = 6;
        
        // Використовуємо координати з моделі Country якщо доступні
        if (useCountryCoordinates && country && 
            country.latitude && country.longitude) {
          center = [country.latitude, country.longitude];
        }
        
        console.log("Updating map center for country:", country?.name);
        mapRef.current.setView(center, zoom);
      } catch (error) {
        console.error("Error updating map center:", error);
      }
    }
  }, [data.countryId, countries, useCountryCoordinates]);

  // Встановлення маркера при зміні координат
  useEffect(() => {
    if (mapRef.current && window.L && isValidCoordinate(data.latitude) && isValidCoordinate(data.longitude)) {
      try {
        const L = window.L;
        const lat = Number(data.latitude);
        const lng = Number(data.longitude);
        
        console.log("Setting marker with coordinates:", lat, lng);
        
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], {
            draggable: true,
          }).addTo(mapRef.current);
          
          // Обробник переміщення маркера
          markerRef.current.on("dragend", (event: any) => {
            const latlng = event.target.getLatLng();
            updateCoordinates(latlng.lat, latlng.lng);
          });
        }
        
        // Центруємо карту на маркері
        mapRef.current.setView([lat, lng], 12);
      } catch (error) {
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
            {/* Область/Регіон - відображається з геоданих */}
            <div className="flex flex-row items-start">
              <span className="text-xs font-medium text-gray-500 w-1/3">Область/Регіон:</span>
              <span className="text-xs text-gray-700">
                {geocodingResult?.region || (data.regionId && regions?.find((r: any) => r.id.toString() === data.regionId)?.name) || "-"}
                
                {/* Прихований input для збереження regionId */}
                <input type="hidden" 
                  name="regionId" 
                  value={data.regionId} 
                />
              </span>
            </div>
            
            {/* Громада - відображається тільки для України */}
            {isUkraine && (
              <div className="flex flex-row items-start">
                <span className="text-xs font-medium text-gray-500 w-1/3">Громада:</span>
                <span className="text-xs text-gray-700">
                  {geocodingResult?.community || (data.communityId && communities?.find((c: any) => c.id.toString() === data.communityId)?.name) || "-"}
                  
                  {/* Прихований input для збереження communityId */}
                  <input type="hidden" 
                    name="communityId" 
                    value={data.communityId} 
                  />
                </span>
              </div>
            )}
            
            {/* Населений пункт - можна редагувати */}
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


// import React, { useEffect, useRef, useCallback, useState } from "react";
// import { useAppSelector } from "../../store";
// import { ChevronDown } from "lucide-react";
// import axios from "axios";

// interface LocationSelectorProps {
//   countries: {
//     id: number;
//     name: string;
//     code: string;
//     latitude?: number;
//     longitude?: number;
//   }[];
//   data: {
//     countryId: string;
//     regionId: string;
//     communityId: string;
//     locationName: string;
//     latitude: number;
//     longitude: number;
//   };
//   errors: {
//     countryId?: string;
//     regionId?: string;
//     communityId?: string;
//     locationName?: string;
//     latitude?: string;
//   };
//   onChange: (name: string, value: string | number) => void;
//   mapLoaded: boolean;
//   useCountryCoordinates?: boolean;
// }

// // Інтерфейс для даних зворотного геокодування від OpenStreetMap
// interface GeocodingResult {
//   address: {
//     city?: string;
//     town?: string;
//     village?: string;
//     hamlet?: string;
//     suburb?: string;
//     county?: string;
//     state?: string;
//     country?: string;
//     country_code?: string;
//     postcode?: string;
//   };
//   display_name: string;
// }

// const LocationSelector: React.FC<LocationSelectorProps> = ({
//   countries,
//   data,
//   errors,
//   onChange,
//   mapLoaded,
//   useCountryCoordinates = false,
// }) => {
//   const { regions, communities, status: locationStatus } = useAppSelector(
//     (state) => state.locations
//   );

//   // References для карти і маркера
//   const mapRef = useRef<any>(null);
//   const markerRef = useRef<any>(null);
//   const isInitializedRef = useRef<boolean>(false);
  
//   // Стан для зберігання результатів геокодування
//   const [geocodingInProgress, setGeocodingInProgress] = useState(false);
//   const [geocodingResult, setGeocodingResult] = useState<{
//     region?: string;
//     community?: string;
//     location?: string;
//   } | null>(null);

//   // Визначаємо, чи країна - Україна
//   const selectedCountry = countries.find(
//     (c) => c.id.toString() === data.countryId
//   );
//   const isUkraine = selectedCountry?.code === "UA";

//   // Функція для перевірки валідності координат
//   const isValidCoordinate = useCallback((coord: any): boolean => {
//     return (
//       coord !== undefined && 
//       coord !== null && 
//       !isNaN(Number(coord)) && 
//       Number(coord) !== 0
//     );
//   }, []);

//   // Функція для отримання інформації про місцезнаходження за координатами
//   const getLocationByCoordinates = useCallback(async (lat: number, lng: number) => {
//     if (!isValidCoordinate(lat) || !isValidCoordinate(lng)) {
//       return;
//     }
    
//     setGeocodingInProgress(true);
    
//     try {
//       console.log("Attempting to get location data from coordinates:", { lat, lng });
      
//       // Використовуємо OpenStreetMap Nominatim API для зворотного геокодування
//       const response = await axios.get<GeocodingResult>(
//         `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
//         {
//           headers: { 'Accept-Language': 'uk' } // Отримати результати українською
//         }
//       );
      
//       const result = response.data;
//       console.log("Geocoding result:", result);
      
//       // Отримуємо назву населеного пункту
//       const location = 
//         result.address.city || 
//         result.address.town || 
//         result.address.village || 
//         result.address.hamlet || 
//         result.address.suburb;
      
//       // Отримуємо регіон/область
//       const region = result.address.state;
      
//       // Отримуємо громаду/район для України (може бути у county)
//       const community = result.address.county;
      
//       // Отримуємо країну
//       const countryName = result.address.country;
//       const countryCode = result.address.country_code?.toUpperCase();
      
//       console.log("Extracted data from geocoding:", { 
//         location, 
//         region,
//         community,
//         countryName,
//         countryCode 
//       });
      
//       // Зберігаємо результати геокодування у стані
//       setGeocodingResult({
//         region: region || '',
//         community: community || '',
//         location: location || '',
//       });
      
//       // Встановлюємо назву населеного пункту
//       if (location) {
//         onChange("locationName", location);
//       }
      
//       // Знаходимо країну в списку доступних країн
//       if (countryCode) {
//         const foundCountry = countries.find(c => c.code === countryCode.toUpperCase());
        
//         if (foundCountry && (!data.countryId || data.countryId === "")) {
//           console.log("Setting country from geocoding:", foundCountry);
//           onChange("countryId", foundCountry.id.toString());
//         }
//       }
      
//       // Для України: спробуємо знайти відповідні регіон і громаду в наших даних
//       if (isUkraine && region) {
//         // Шукаємо регіон за назвою
//         const foundRegion = regions.find((r: any) => 
//           r.name.toLowerCase().includes(region.toLowerCase()) || 
//           region.toLowerCase().includes(r.name.toLowerCase())
//         );
        
//         if (foundRegion) {
//           console.log("Found matching region:", foundRegion);
//           onChange("regionId", foundRegion.id.toString());
          
//           // Якщо знайшли регіон і є громада, спробуємо знайти громаду
//           if (community && communities.length > 0) {
//             const foundCommunity = communities.find((c: any) => 
//               c.name.toLowerCase().includes(community.toLowerCase()) ||
//               community.toLowerCase().includes(c.name.toLowerCase())
//             );
            
//             if (foundCommunity) {
//               console.log("Found matching community:", foundCommunity);
//               onChange("communityId", foundCommunity.id.toString());
//             }
//           }
//         }
//       }
      
//     } catch (error) {
//       console.error("Error getting location data from coordinates:", error);
//     } finally {
//       setGeocodingInProgress(false);
//     }
//   }, [countries, data.countryId, isUkraine, isValidCoordinate, onChange, regions, communities]);

//   // Безпечне оновлення координат, щоб уникнути циклу оновлень
//   const updateCoordinates = useCallback(async (lat: number, lng: number) => {
//     // Використання setTimeout щоб уникнути проблем з синхронним оновленням стану
//     setTimeout(() => {
//       console.log("Updating coordinates:", { lat, lng });
//       onChange("latitude", lat);
//       onChange("longitude", lng);
      
//       // Отримуємо дані про місцезнаходження за координатами
//       getLocationByCoordinates(lat, lng);
//     }, 0);
//   }, [onChange, getLocationByCoordinates]);

//   // Ініціалізація карти - виконується лише один раз
//   useEffect(() => {
//     // Очищення карти при демонтажі компонента
//     return () => {
//       if (mapRef.current) {
//         console.log("Cleaning up map on unmount");
//         mapRef.current.remove();
//         mapRef.current = null;
//         markerRef.current = null;
//       }
//     };
//   }, []);

//   // Ініціалізація та налаштування карти
//   useEffect(() => {
//     if (
//       mapLoaded &&
//       window.L &&
//       document.getElementById("listing-map") &&
//       !mapRef.current &&
//       !isInitializedRef.current
//     ) {
//       try {
//         const L = window.L;
//         isInitializedRef.current = true;
        
//         // Встановлення центру карти
//         let center = [48.3794, 31.1656]; // Default Ukraine center
        
//         // Використовуємо координати з моделі Country якщо доступні
//         if (useCountryCoordinates && selectedCountry && 
//             selectedCountry.latitude && selectedCountry.longitude) {
//           center = [selectedCountry.latitude, selectedCountry.longitude];
//         }
        
//         console.log("Initializing map with center:", center);
//         mapRef.current = L.map("listing-map").setView(center, 6);

//         L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//           attribution: '&copy; <a href="https://osm.org/copyright">OSM</a>',
//         }).addTo(mapRef.current);

//         // Обробник кліку на карті - створення маркера
//         const handleMapClick = (e: any) => {
//           const { lat, lng } = e.latlng;
          
//           if (markerRef.current) {
//             markerRef.current.setLatLng([lat, lng]);
//           } else {
//             markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(
//               mapRef.current
//             );
//             // Обробник переміщення маркера
//             markerRef.current.on("dragend", (event: any) => {
//               const pos = event.target.getLatLng();
//               updateCoordinates(pos.lat, pos.lng);
//             });
//           }
          
//           updateCoordinates(lat, lng);
//         };

//         // Додавання обробника кліку
//         mapRef.current.on("click", handleMapClick);
        
//         console.log("Map initialized successfully");
//       } catch (error) {
//         console.error("Error initializing map:", error);
//         isInitializedRef.current = false;
//       }
//     }
//   }, [mapLoaded, selectedCountry, useCountryCoordinates, updateCoordinates]);

//   // Оновлення центру карти при зміні країни
//   useEffect(() => {
//     if (mapRef.current && countries.length && data.countryId) {
//       try {
//         const country = countries.find(
//           (c) => c.id.toString() === data.countryId
//         );
        
//         let center = [48.3794, 31.1656]; // Default Ukraine center
//         const zoom = 6;
        
//         // Використовуємо координати з моделі Country якщо доступні
//         if (useCountryCoordinates && country && 
//             country.latitude && country.longitude) {
//           center = [country.latitude, country.longitude];
//         }
        
//         console.log("Updating map center for country:", country?.name);
//         mapRef.current.setView(center, zoom);
//       } catch (error) {
//         console.error("Error updating map center:", error);
//       }
//     }
//   }, [data.countryId, countries, useCountryCoordinates]);

//   // Встановлення маркера при зміні координат
//   useEffect(() => {
//     if (mapRef.current && window.L && isValidCoordinate(data.latitude) && isValidCoordinate(data.longitude)) {
//       try {
//         const L = window.L;
//         const lat = Number(data.latitude);
//         const lng = Number(data.longitude);
        
//         console.log("Setting marker with coordinates:", lat, lng);
        
//         if (markerRef.current) {
//           markerRef.current.setLatLng([lat, lng]);
//         } else {
//           markerRef.current = L.marker([lat, lng], {
//             draggable: true,
//           }).addTo(mapRef.current);
          
//           // Обробник переміщення маркера
//           markerRef.current.on("dragend", (event: any) => {
//             const latlng = event.target.getLatLng();
//             updateCoordinates(latlng.lat, latlng.lng);
//           });
//         }
        
//         // Центруємо карту на маркері
//         mapRef.current.setView([lat, lng], 12);
//       } catch (error) {
//         console.error("Error setting marker:", error);
//       }
//     }
//   }, [data.latitude, data.longitude, isValidCoordinate, updateCoordinates]);

//   return (
//     <>
//       {/* Країна */}
//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-1">
//           Країна *
//         </label>
//         <div className="relative">
//           <select
//             id="countryId"
//             name="countryId"
//             value={data.countryId || ""}
//             onChange={(e) => onChange("countryId", e.target.value)}
//             className={`appearance-none w-full px-4 py-2 border ${
//               errors.countryId ? "border-red-500" : "border-gray-300"
//             } rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500`}
//           >
//             <option value="">Виберіть країну</option>
//             {countries.map((country) => (
//               <option key={country.id} value={country.id}>
//                 {country.name}
//               </option>
//             ))}
//           </select>
//           <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
//             <ChevronDown size={18} className="text-gray-400" />
//           </div>
//         </div>
//         {errors.countryId && (
//           <p className="mt-1 text-sm text-red-500">{errors.countryId}</p>
//         )}
//       </div>

//       {/* Карта для вибору координат і автоматичного отримання даних */}
//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-1">
//           Вкажіть місцезнаходження на карті *
//         </label>
//         <p className="text-xs text-gray-500 mb-2">
//           Натисніть на карту, щоб вказати точне місцезнаходження. Інформація про регіон та населений пункт буде отримана автоматично.
//         </p>
//         <div className="w-full h-64 rounded-md border border-gray-300 overflow-hidden">
//           <div
//             id="listing-map"
//             style={{ width: "100%", height: "100%" }}
//           />
//         </div>
        
//         {isValidCoordinate(data.latitude) && isValidCoordinate(data.longitude) && (
//           <div className="text-xs text-gray-500 mt-1">
//             Координати: {Number(data.latitude).toFixed(6)}, {Number(data.longitude).toFixed(6)}
//           </div>
//         )}
        
//         {errors.latitude && (
//           <p className="mt-1 text-sm text-red-500">{errors.latitude}</p>
//         )}
        
//         {geocodingInProgress && (
//           <p className="text-xs text-blue-500 mt-1">
//             Отримання даних про місцезнаходження...
//           </p>
//         )}
//       </div>

//       {/* Інформація про місцезнаходження */}
//       <div>
//         <h3 className="text-sm font-medium text-gray-700 mb-2">
//           Дані про місцезнаходження
//         </h3>
        
//         <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
//           <div className="grid gap-2">
//             {/* Область/Регіон - відображається з геоданих */}
//             <div className="flex flex-row items-start">
//               <span className="text-xs font-medium text-gray-500 w-1/3">Область/Регіон:</span>
//               <span className="text-xs text-gray-700">
//                 {geocodingResult?.region || (data.regionId && regions?.find((r: any) => r.id.toString() === data.regionId)?.name) || "-"}
                
//                 {/* Прихований input для збереження regionId */}
//                 <input type="hidden" 
//                   name="regionId" 
//                   value={data.regionId} 
//                 />
//               </span>
//             </div>
            
//             {/* Громада - відображається тільки для України */}
//             {isUkraine && (
//               <div className="flex flex-row items-start">
//                 <span className="text-xs font-medium text-gray-500 w-1/3">Громада:</span>
//                 <span className="text-xs text-gray-700">
//                   {geocodingResult?.community || (data.communityId && communities?.find((c: any) => c.id.toString() === data.communityId)?.name) || "-"}
                  
//                   {/* Прихований input для збереження communityId */}
//                   <input type="hidden" 
//                     name="communityId" 
//                     value={data.communityId} 
//                   />
//                 </span>
//               </div>
//             )}
            
//             {/* Населений пункт - можна редагувати */}
//             <div className="flex flex-row items-start">
//               <span className="text-xs font-medium text-gray-500 w-1/3">Населений пункт:</span>
//               <div className="w-2/3">
//                 <input
//                   type="text"
//                   id="locationName"
//                   name="locationName"
//                   value={data.locationName}
//                   onChange={(e) => onChange("locationName", e.target.value)}
//                   placeholder="Введіть або уточніть назву"
//                   className={`w-full px-2 py-1 text-xs border ${
//                     errors.locationName ? "border-red-500" : "border-gray-300"
//                   } rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500`}
//                 />
//                 {errors.locationName && (
//                   <p className="mt-1 text-xs text-red-500">{errors.locationName}</p>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default LocationSelector;


// // import React, { useEffect, useRef, useCallback, useState } from "react";
// // import { useAppSelector } from "../../store";
// // import { ChevronDown } from "lucide-react";
// // import axios from "axios";

// // interface LocationSelectorProps {
// //   countries: {
// //     id: number;
// //     name: string;
// //     code: string;
// //     latitude?: number;
// //     longitude?: number;
// //   }[];
// //   data: {
// //     countryId: string;
// //     regionId: string;
// //     communityId: string;
// //     locationName: string;
// //     latitude: number;
// //     longitude: number;
// //   };
// //   errors: {
// //     countryId?: string;
// //     regionId?: string;
// //     communityId?: string;
// //     locationName?: string;
// //     latitude?: string;
// //   };
// //   onChange: (name: string, value: string | number) => void;
// //   mapLoaded: boolean;
// //   useCountryCoordinates?: boolean;
// // }

// // // Інтерфейс для даних зворотного геокодування від OpenStreetMap
// // interface GeocodingResult {
// //   address: {
// //     city?: string;
// //     town?: string;
// //     village?: string;
// //     hamlet?: string;
// //     suburb?: string;
// //     county?: string;
// //     state?: string;
// //     country?: string;
// //     country_code?: string;
// //   };
// //   display_name: string;
// // }

// // const LocationSelector: React.FC<LocationSelectorProps> = ({
// //   countries,
// //   data,
// //   errors,
// //   onChange,
// //   mapLoaded,
// //   useCountryCoordinates = false,
// // }) => {
// //   const { regions, communities, status: locationStatus } = useAppSelector(
// //     (state) => state.locations
// //   );

// //   // References для карти і маркера
// //   const mapRef = useRef<any>(null);
// //   const markerRef = useRef<any>(null);
// //   const isInitializedRef = useRef<boolean>(false);
  
// //   // Стан для зберігання результатів геокодування
// //   const [geocodingInProgress, setGeocodingInProgress] = useState(false);

// //   // Визначаємо, чи країна - Україна
// //   const selectedCountry = countries.find(
// //     (c) => c.id.toString() === data.countryId
// //   );
// //   const isUkraine = selectedCountry?.code === "UA";

// //   // Функція для перевірки валідності координат
// //   const isValidCoordinate = useCallback((coord: any): boolean => {
// //     return (
// //       coord !== undefined && 
// //       coord !== null && 
// //       !isNaN(Number(coord)) && 
// //       Number(coord) !== 0
// //     );
// //   }, []);

// //   // Функція для отримання інформації про місцезнаходження за координатами
// //   const getLocationByCoordinates = useCallback(async (lat: number, lng: number) => {
// //     if (!isValidCoordinate(lat) || !isValidCoordinate(lng)) {
// //       return;
// //     }
    
// //     setGeocodingInProgress(true);
    
// //     try {
// //       console.log("Attempting to get location name from coordinates:", { lat, lng });
      
// //       // Використовуємо OpenStreetMap Nominatim API для зворотного геокодування
// //       const response = await axios.get<GeocodingResult>(
// //         `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
// //         {
// //           headers: { 'Accept-Language': 'uk' } // Отримати результати українською
// //         }
// //       );
      
// //       const result = response.data;
// //       console.log("Geocoding result:", result);
      
// //       // Отримуємо назву населеного пункту
// //       const location = 
// //         result.address.city || 
// //         result.address.town || 
// //         result.address.village || 
// //         result.address.hamlet || 
// //         result.address.suburb;
      
// //       // Отримуємо регіон/область
// //       const region = result.address.state;
      
// //       // Отримуємо країну
// //       const countryName = result.address.country;
// //       const countryCode = result.address.country_code?.toUpperCase();
      
// //       console.log("Extracted data from geocoding:", { 
// //         location, 
// //         region, 
// //         countryName,
// //         countryCode 
// //       });
      
// //       // Встановлюємо назву населеного пункту, якщо знайдено
// //       if (location && !geocodingInProgress) {
// //         onChange("locationName", location);
// //       }
      
// //       // Знаходимо країну в списку доступних країн
// //       if (countryCode) {
// //         const foundCountry = countries.find(c => c.code === countryCode.toUpperCase());
        
// //         if (foundCountry && !data.countryId) {
// //           console.log("Found matching country:", foundCountry);
// //           onChange("countryId", foundCountry.id.toString());
// //         }
// //       }
      
// //       // Якщо знайдено регіон і є назва області, можна спробувати її знайти
// //       // Це потребує додаткової логіки для пошуку відповідного regionId
      
// //     } catch (error) {
// //       console.error("Error getting location data from coordinates:", error);
// //     } finally {
// //       setGeocodingInProgress(false);
// //     }
// //   }, [countries, data.countryId, isValidCoordinate, onChange, geocodingInProgress]);

// //   // Безпечне оновлення координат, щоб уникнути циклу оновлень
// //   const updateCoordinates = useCallback(async (lat: number, lng: number) => {
// //     // Використання setTimeout щоб уникнути проблем з синхронним оновленням стану
// //     setTimeout(() => {
// //       console.log("Updating coordinates:", { lat, lng });
// //       onChange("latitude", lat);
// //       onChange("longitude", lng);
      
// //       // Отримуємо дані про місцезнаходження за координатами
// //       getLocationByCoordinates(lat, lng);
// //     }, 0);
// //   }, [onChange, getLocationByCoordinates]);

// //   // Ініціалізація карти - виконується лише один раз
// //   useEffect(() => {
// //     // Очищення карти при демонтажі компонента
// //     return () => {
// //       if (mapRef.current) {
// //         console.log("Cleaning up map on unmount");
// //         mapRef.current.remove();
// //         mapRef.current = null;
// //         markerRef.current = null;
// //       }
// //     };
// //   }, []);

// //   // Ініціалізація та налаштування карти
// //   useEffect(() => {
// //     if (
// //       mapLoaded &&
// //       window.L &&
// //       document.getElementById("listing-map") &&
// //       !mapRef.current &&
// //       !isInitializedRef.current
// //     ) {
// //       try {
// //         const L = window.L;
// //         isInitializedRef.current = true;
        
// //         // Встановлення центру карти
// //         let center = [48.3794, 31.1656]; // Default Ukraine center
        
// //         // Використовуємо координати з моделі Country якщо доступні
// //         if (useCountryCoordinates && selectedCountry && 
// //             selectedCountry.latitude && selectedCountry.longitude) {
// //           center = [selectedCountry.latitude, selectedCountry.longitude];
// //         }
        
// //         console.log("Initializing map with center:", center);
// //         mapRef.current = L.map("listing-map").setView(center, 6);

// //         L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
// //           attribution: '&copy; <a href="https://osm.org/copyright">OSM</a>',
// //         }).addTo(mapRef.current);

// //         // Обробник кліку на карті - створення маркера
// //         const handleMapClick = (e: any) => {
// //           const { lat, lng } = e.latlng;
          
// //           if (markerRef.current) {
// //             markerRef.current.setLatLng([lat, lng]);
// //           } else {
// //             markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(
// //               mapRef.current
// //             );
// //             // Обробник переміщення маркера
// //             markerRef.current.on("dragend", (event: any) => {
// //               const pos = event.target.getLatLng();
// //               updateCoordinates(pos.lat, pos.lng);
// //             });
// //           }
          
// //           updateCoordinates(lat, lng);
// //         };

// //         // Додавання обробника кліку
// //         mapRef.current.on("click", handleMapClick);
        
// //         console.log("Map initialized successfully");
// //       } catch (error) {
// //         console.error("Error initializing map:", error);
// //         isInitializedRef.current = false;
// //       }
// //     }
// //   }, [mapLoaded, selectedCountry, useCountryCoordinates, updateCoordinates]);

// //   // Оновлення центру карти при зміні країни
// //   useEffect(() => {
// //     if (mapRef.current && countries.length && data.countryId) {
// //       try {
// //         const country = countries.find(
// //           (c) => c.id.toString() === data.countryId
// //         );
        
// //         let center = [48.3794, 31.1656]; // Default Ukraine center
// //         const zoom = 6;
        
// //         // Використовуємо координати з моделі Country якщо доступні
// //         if (useCountryCoordinates && country && 
// //             country.latitude && country.longitude) {
// //           center = [country.latitude, country.longitude];
// //         }
        
// //         console.log("Updating map center for country:", country?.name);
// //         mapRef.current.setView(center, zoom);
        
// //         // Не видаляємо маркер при зміні країни,
// //         // щоб зберегти вже вибране місце розташування
// //       } catch (error) {
// //         console.error("Error updating map center:", error);
// //       }
// //     }
// //   }, [data.countryId, countries, useCountryCoordinates]);

// //   // Встановлення маркера при зміні координат
// //   useEffect(() => {
// //     if (mapRef.current && window.L && isValidCoordinate(data.latitude) && isValidCoordinate(data.longitude)) {
// //       try {
// //         const L = window.L;
// //         const lat = Number(data.latitude);
// //         const lng = Number(data.longitude);
        
// //         console.log("Setting marker with coordinates:", lat, lng);
        
// //         if (markerRef.current) {
// //           markerRef.current.setLatLng([lat, lng]);
// //         } else {
// //           markerRef.current = L.marker([lat, lng], {
// //             draggable: true,
// //           }).addTo(mapRef.current);
          
// //           // Обробник переміщення маркера
// //           markerRef.current.on("dragend", (event: any) => {
// //             const latlng = event.target.getLatLng();
// //             updateCoordinates(latlng.lat, latlng.lng);
// //           });
// //         }
        
// //         // Центруємо карту на маркері
// //         mapRef.current.setView([lat, lng], 12);
// //       } catch (error) {
// //         console.error("Error setting marker:", error);
// //       }
// //     }
// //   }, [data.latitude, data.longitude, isValidCoordinate, updateCoordinates]);

// //   return (
// //     <>
// //       {/* Країна */}
// //       <div>
// //         <label className="block text-sm font-medium text-gray-700 mb-1">
// //           Країна *
// //         </label>
// //         <div className="relative">
// //           <select
// //             id="countryId"
// //             name="countryId"
// //             value={data.countryId || ""}
// //             onChange={(e) => onChange("countryId", e.target.value)}
// //             className={`appearance-none w-full px-4 py-2 border ${
// //               errors.countryId ? "border-red-500" : "border-gray-300"
// //             } rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500`}
// //           >
// //             <option value="">Виберіть країну</option>
// //             {countries.map((country) => (
// //               <option key={country.id} value={country.id}>
// //                 {country.name}
// //               </option>
// //             ))}
// //           </select>
// //           <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
// //             <ChevronDown size={18} className="text-gray-400" />
// //           </div>
// //         </div>
// //         {errors.countryId && (
// //           <p className="mt-1 text-sm text-red-500">{errors.countryId}</p>
// //         )}
// //       </div>

// //       {/* Область */}
// //       <div>
// //         <label className="block text-sm font-medium text-gray-700 mb-1">
// //           Область *
// //         </label>
// //         <div className="relative">
// //           <select
// //             id="regionId"
// //             name="regionId"
// //             value={data.regionId}
// //             onChange={(e) => onChange("regionId", e.target.value)}
// //             disabled={!data.countryId}
// //             className={`appearance-none w-full px-4 py-2 border ${
// //               errors.regionId ? "border-red-500" : "border-gray-300"
// //             } rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${!data.countryId ? "bg-gray-100" : ""}`}
// //           >
// //             <option value="">Виберіть область</option>
// //             {locationStatus === "loading" ? (
// //               <option disabled>Завантаження областей...</option>
// //             ) : (
// //               regions?.map((region: any) => (
// //                 <option key={region.id} value={region.id}>
// //                   {region.name}
// //                 </option>
// //               ))
// //             )}
// //           </select>
// //           <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
// //             <ChevronDown size={18} className="text-gray-400" />
// //           </div>
// //         </div>
// //         {errors.regionId && (
// //           <p className="mt-1 text-sm text-red-500">{errors.regionId}</p>
// //         )}
// //       </div>

// //       {/* Громада (тільки для України) */}
// //       {isUkraine && (
// //         <div>
// //           <label className="block text-sm font-medium text-gray-700 mb-1">
// //             Громада *
// //           </label>
// //           <div className="relative">
// //             <select
// //               id="communityId"
// //               name="communityId"
// //               value={data.communityId}
// //               onChange={(e) => onChange("communityId", e.target.value)}
// //               disabled={!data.regionId}
// //               className={`appearance-none w-full px-4 py-2 border ${
// //                 errors.communityId ? "border-red-500" : "border-gray-300"
// //               } rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${!data.regionId ? "bg-gray-100" : ""}`}
// //             >
// //               <option value="">Виберіть громаду</option>
// //               {locationStatus === "loading" ? (
// //                 <option disabled>Завантаження громад...</option>
// //               ) : (
// //                 communities?.map((community: any) => (
// //                   <option key={community.id} value={community.id}>
// //                     {community.name}
// //                   </option>
// //                 ))
// //               )}
// //             </select>
// //             <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
// //               <ChevronDown size={18} className="text-gray-400" />
// //             </div>
// //           </div>
// //           {errors.communityId && (
// //             <p className="mt-1 text-sm text-red-500">{errors.communityId}</p>
// //           )}
// //         </div>
// //       )}

// //       {/* Населений пункт - тепер як поле введення тексту */}
// //       <div>
// //         <label className="block text-sm font-medium text-gray-700 mb-1">
// //           Населений пункт *
// //         </label>
// //         <input
// //           type="text"
// //           id="locationName"
// //           name="locationName"
// //           value={data.locationName}
// //           onChange={(e) => onChange("locationName", e.target.value)}
// //           placeholder="Введіть назву населеного пункту"
// //           className={`w-full px-4 py-2 border ${
// //             errors.locationName ? "border-red-500" : "border-gray-300"
// //           } rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500`}
// //         />
// //         {errors.locationName && (
// //           <p className="mt-1 text-sm text-red-500">{errors.locationName}</p>
// //         )}
// //       </div>

// //       {/* Карта для вибору координат */}
// //       <div>
// //         <label className="block text-sm font-medium text-gray-700 mb-1">
// //           Вкажіть місцезнаходження на карті *
// //         </label>
// //         <div className="w-full h-64 rounded-md border border-gray-300 overflow-hidden">
// //           <div
// //             id="listing-map"
// //             style={{ width: "100%", height: "100%" }}
// //           />
// //         </div>
// //         {isValidCoordinate(data.latitude) && isValidCoordinate(data.longitude) && (
// //           <div className="text-xs text-gray-500 mt-1">
// //             Координати: {Number(data.latitude).toFixed(6)}, {Number(data.longitude).toFixed(6)}
// //           </div>
// //         )}
// //         {errors.latitude && (
// //           <p className="mt-1 text-sm text-red-500">{errors.latitude}</p>
// //         )}
// //         {geocodingInProgress && (
// //           <p className="text-xs text-blue-500 mt-1">
// //             Отримання даних про місцезнаходження...
// //           </p>
// //         )}
// //       </div>
// //     </>
// //   );
// // };

// // export default LocationSelector;



// // import React, { useEffect, useRef, useCallback } from "react";
// // import { useAppSelector } from "../../store";
// // import { ChevronDown } from "lucide-react";

// // interface LocationSelectorProps {
// //   countries: {
// //     id: number;
// //     name: string;
// //     code: string;
// //     latitude?: number;
// //     longitude?: number;
// //   }[];
// //   data: {
// //     countryId: string;
// //     regionId: string;
// //     communityId: string;
// //     locationName: string;
// //     latitude: number;
// //     longitude: number;
// //   };
// //   errors: {
// //     countryId?: string;
// //     regionId?: string;
// //     communityId?: string;
// //     locationName?: string;
// //     latitude?: string;
// //   };
// //   onChange: (name: string, value: string | number) => void;
// //   mapLoaded: boolean;
// //   useCountryCoordinates?: boolean;
// // }

// // const LocationSelector: React.FC<LocationSelectorProps> = ({
// //   countries,
// //   data,
// //   errors,
// //   onChange,
// //   mapLoaded,
// //   useCountryCoordinates = false,
// // }) => {
// //   const { regions, communities, status: locationStatus } = useAppSelector(
// //     (state) => state.locations
// //   );

// //   // References для карти і маркера
// //   const mapRef = useRef<any>(null);
// //   const markerRef = useRef<any>(null);
// //   const isInitializedRef = useRef<boolean>(false);

// //   // Визначаємо, чи країна - Україна
// //   const selectedCountry = countries.find(
// //     (c) => c.id.toString() === data.countryId
// //   );
// //   const isUkraine = selectedCountry?.code === "UA";

// //   // Функція для перевірки валідності координат
// //   const isValidCoordinate = useCallback((coord: any): boolean => {
// //     return (
// //       coord !== undefined && 
// //       coord !== null && 
// //       !isNaN(Number(coord)) && 
// //       Number(coord) !== 0
// //     );
// //   }, []);

// //   // Безпечне оновлення координат, щоб уникнути циклу оновлень
// //   const updateCoordinates = useCallback((lat: number, lng: number) => {
// //     // Використання setTimeout щоб уникнути проблем з синхронним оновленням стану
// //     setTimeout(() => {
// //       console.log("Updating coordinates:", { lat, lng });
// //       onChange("latitude", lat);
// //       onChange("longitude", lng);
// //     }, 0);
// //   }, [onChange]);

// //   // Ініціалізація карти - виконується лише один раз
// //   useEffect(() => {
// //     // Очищення карти при демонтажі компонента
// //     return () => {
// //       if (mapRef.current) {
// //         console.log("Cleaning up map on unmount");
// //         mapRef.current.remove();
// //         mapRef.current = null;
// //         markerRef.current = null;
// //       }
// //     };
// //   }, []);

// //   // Ініціалізація та налаштування карти
// //   useEffect(() => {
// //     if (
// //       mapLoaded &&
// //       window.L &&
// //       document.getElementById("listing-map") &&
// //       !mapRef.current &&
// //       !isInitializedRef.current
// //     ) {
// //       try {
// //         const L = window.L;
// //         isInitializedRef.current = true;
        
// //         // Встановлення центру карти
// //         let center = [48.3794, 31.1656]; // Default Ukraine center
        
// //         // Використовуємо координати з моделі Country якщо доступні
// //         if (useCountryCoordinates && selectedCountry && 
// //             selectedCountry.latitude && selectedCountry.longitude) {
// //           center = [selectedCountry.latitude, selectedCountry.longitude];
// //         }
        
// //         console.log("Initializing map with center:", center);
// //         mapRef.current = L.map("listing-map").setView(center, 6);

// //         L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
// //           attribution: '&copy; <a href="https://osm.org/copyright">OSM</a>',
// //         }).addTo(mapRef.current);

// //         // Обробник кліку на карті - створення маркера
// //         const handleMapClick = (e: any) => {
// //           const { lat, lng } = e.latlng;
          
// //           if (markerRef.current) {
// //             markerRef.current.setLatLng([lat, lng]);
// //           } else {
// //             markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(
// //               mapRef.current
// //             );
// //             // Обробник переміщення маркера
// //             markerRef.current.on("dragend", (event: any) => {
// //               const pos = event.target.getLatLng();
// //               updateCoordinates(pos.lat, pos.lng);
// //             });
// //           }
          
// //           updateCoordinates(lat, lng);
// //         };

// //         // Додавання обробника кліку
// //         mapRef.current.on("click", handleMapClick);
        
// //         console.log("Map initialized successfully");
// //       } catch (error) {
// //         console.error("Error initializing map:", error);
// //         isInitializedRef.current = false;
// //       }
// //     }
// //   }, [mapLoaded, selectedCountry, useCountryCoordinates, updateCoordinates]);

// //   // Оновлення центру карти при зміні країни
// //   useEffect(() => {
// //     if (mapRef.current && countries.length && data.countryId) {
// //       try {
// //         const country = countries.find(
// //           (c) => c.id.toString() === data.countryId
// //         );
        
// //         let center = [48.3794, 31.1656]; // Default Ukraine center
// //         const zoom = 6;
        
// //         // Використовуємо координати з моделі Country якщо доступні
// //         if (useCountryCoordinates && country && 
// //             country.latitude && country.longitude) {
// //           center = [country.latitude, country.longitude];
// //         }
        
// //         console.log("Updating map center for country:", country?.name);
// //         mapRef.current.setView(center, zoom);
        
// //         // Видаляємо маркер при зміні країни
// //         if (markerRef.current) {
// //           mapRef.current.removeLayer(markerRef.current);
// //           markerRef.current = null;
// //         }
// //       } catch (error) {
// //         console.error("Error updating map center:", error);
// //       }
// //     }
// //   }, [data.countryId, countries, useCountryCoordinates]);

// //   // Встановлення маркера при зміні координат
// //   useEffect(() => {
// //     if (mapRef.current && window.L && isValidCoordinate(data.latitude) && isValidCoordinate(data.longitude)) {
// //       try {
// //         const L = window.L;
// //         const lat = Number(data.latitude);
// //         const lng = Number(data.longitude);
        
// //         console.log("Setting marker with coordinates:", lat, lng);
        
// //         if (markerRef.current) {
// //           markerRef.current.setLatLng([lat, lng]);
// //         } else {
// //           markerRef.current = L.marker([lat, lng], {
// //             draggable: true,
// //           }).addTo(mapRef.current);
          
// //           // Обробник переміщення маркера
// //           markerRef.current.on("dragend", (event: any) => {
// //             const latlng = event.target.getLatLng();
// //             updateCoordinates(latlng.lat, latlng.lng);
// //           });
// //         }
        
// //         // Центруємо карту на маркері
// //         mapRef.current.setView([lat, lng], 12);
// //       } catch (error) {
// //         console.error("Error setting marker:", error);
// //       }
// //     }
// //   }, [data.latitude, data.longitude, isValidCoordinate, updateCoordinates]);

// //   return (
// //     <>
// //       {/* Країна */}
// //       <div>
// //         <label className="block text-sm font-medium text-gray-700 mb-1">
// //           Країна *
// //         </label>
// //         <div className="relative">
// //           <select
// //             id="countryId"
// //             name="countryId"
// //             value={data.countryId || ""}
// //             onChange={(e) => onChange("countryId", e.target.value)}
// //             className={`appearance-none w-full px-4 py-2 border ${
// //               errors.countryId ? "border-red-500" : "border-gray-300"
// //             } rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500`}
// //           >
// //             <option value="">Виберіть країну</option>
// //             {countries.map((country) => (
// //               <option key={country.id} value={country.id}>
// //                 {country.name}
// //               </option>
// //             ))}
// //           </select>
// //           <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
// //             <ChevronDown size={18} className="text-gray-400" />
// //           </div>
// //         </div>
// //         {errors.countryId && (
// //           <p className="mt-1 text-sm text-red-500">{errors.countryId}</p>
// //         )}
// //       </div>

// //       {/* Область */}
// //       <div>
// //         <label className="block text-sm font-medium text-gray-700 mb-1">
// //           Область *
// //         </label>
// //         <div className="relative">
// //           <select
// //             id="regionId"
// //             name="regionId"
// //             value={data.regionId}
// //             onChange={(e) => onChange("regionId", e.target.value)}
// //             disabled={!data.countryId}
// //             className={`appearance-none w-full px-4 py-2 border ${
// //               errors.regionId ? "border-red-500" : "border-gray-300"
// //             } rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${!data.countryId ? "bg-gray-100" : ""}`}
// //           >
// //             <option value="">Виберіть область</option>
// //             {locationStatus === "loading" ? (
// //               <option disabled>Завантаження областей...</option>
// //             ) : (
// //               regions?.map((region: any) => (
// //                 <option key={region.id} value={region.id}>
// //                   {region.name}
// //                 </option>
// //               ))
// //             )}
// //           </select>
// //           <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
// //             <ChevronDown size={18} className="text-gray-400" />
// //           </div>
// //         </div>
// //         {errors.regionId && (
// //           <p className="mt-1 text-sm text-red-500">{errors.regionId}</p>
// //         )}
// //       </div>

// //       {/* Громада (тільки для України) */}
// //       {isUkraine && (
// //         <div>
// //           <label className="block text-sm font-medium text-gray-700 mb-1">
// //             Громада *
// //           </label>
// //           <div className="relative">
// //             <select
// //               id="communityId"
// //               name="communityId"
// //               value={data.communityId}
// //               onChange={(e) => onChange("communityId", e.target.value)}
// //               disabled={!data.regionId}
// //               className={`appearance-none w-full px-4 py-2 border ${
// //                 errors.communityId ? "border-red-500" : "border-gray-300"
// //               } rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${!data.regionId ? "bg-gray-100" : ""}`}
// //             >
// //               <option value="">Виберіть громаду</option>
// //               {locationStatus === "loading" ? (
// //                 <option disabled>Завантаження громад...</option>
// //               ) : (
// //                 communities?.map((community: any) => (
// //                   <option key={community.id} value={community.id}>
// //                     {community.name}
// //                   </option>
// //                 ))
// //               )}
// //             </select>
// //             <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
// //               <ChevronDown size={18} className="text-gray-400" />
// //             </div>
// //           </div>
// //           {errors.communityId && (
// //             <p className="mt-1 text-sm text-red-500">{errors.communityId}</p>
// //           )}
// //         </div>
// //       )}

// //       {/* Населений пункт - тепер як поле введення тексту */}
// //       <div>
// //         <label className="block text-sm font-medium text-gray-700 mb-1">
// //           Населений пункт *
// //         </label>
// //         <input
// //           type="text"
// //           id="locationName"
// //           name="locationName"
// //           value={data.locationName}
// //           onChange={(e) => onChange("locationName", e.target.value)}
// //           placeholder="Введіть назву населеного пункту"
// //           disabled={isUkraine ? !data.communityId : !data.regionId}
// //           className={`w-full px-4 py-2 border ${
// //             errors.locationName ? "border-red-500" : "border-gray-300"
// //           } rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
// //             (isUkraine ? !data.communityId : !data.regionId) ? "bg-gray-100" : ""
// //           }`}
// //         />
// //         {errors.locationName && (
// //           <p className="mt-1 text-sm text-red-500">{errors.locationName}</p>
// //         )}
// //       </div>

// //       {/* Карта для вибору координат */}
// //       <div>
// //         <label className="block text-sm font-medium text-gray-700 mb-1">
// //           Вкажіть місцезнаходження на карті *
// //         </label>
// //         <div className="w-full h-64 rounded-md border border-gray-300 overflow-hidden">
// //           <div
// //             id="listing-map"
// //             style={{ width: "100%", height: "100%" }}
// //           />
// //         </div>
// //         {isValidCoordinate(data.latitude) && isValidCoordinate(data.longitude) && (
// //           <div className="text-xs text-gray-500 mt-1">
// //             Координати: {Number(data.latitude).toFixed(6)}, {Number(data.longitude).toFixed(6)}
// //           </div>
// //         )}
// //         {errors.latitude && (
// //           <p className="mt-1 text-sm text-red-500">{errors.latitude}</p>
// //         )}
// //       </div>
// //     </>
// //   );
// // };

// // export default LocationSelector;