import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import { fetchCategories } from "../store/catalogSlice";
import { fetchBrands } from "../store/brandSlice";
import { createListing } from "../store/listingSlice";
import { fetchRegions, fetchCommunities } from "../store/locationSlice";
import { countriesAPI } from "../api/apiClient";
import { useGeolocation, useReverseGeocode } from "../hooks/useGeolocation";
import { handleApiError } from "../utils/errorHandler";
import { processGeocodeAddress } from "../utils/geocodeUtils";
import MotorizedSpecFormComponent, {
  initialMotorizedSpec,
  MotorizedSpecForm as MotorizedSpecFormType,
} from "../components/ui/MotorizedSpecForm";
import CategorySelector from "../components/ui/CategorySelector";
import BrandSelector from "../components/ui/BrandSelector";
import PriceInput from "../components/ui/PriceInput";
import ImageUploader from "../components/ui/ImageUploader";
import LocationSelector from "../components/ui/LocationSelector";
import GeolocationDebugPanel from "../components/ui/GeolocationDebugPanel";
import CoordinatesDisplay from "../components/ui/CoordinatesDisplay";
import GeolocationTester from "../components/ui/GeolocationTester";

// Constants
const MAX_IMAGE_SIZE_MB = 5;
const MIN_DESCRIPTION_LENGTH = 20;

// Types
type Currency = "UAH" | "USD" | "EUR";
type Condition = "NEW" | "USED";
type PriceType = "NETTO" | "BRUTTO";

interface Country {
  id: number;
  name: string;
  code: string;
  latitude?: number;
  longitude?: number;
}

interface FormData {
  title: string;
  description: string;
  price: string;
  currency: Currency;
  categoryId: string;
  categoryName: string;
  countryId: string;
  regionId: string;
  communityId: string;
  locationId: string;
  locationName: string;
  latitude: number | null;
  longitude: number | null;
  images: File[];
  condition: Condition;
  brandId: string;
  brandName: string;
  priceType: PriceType;
  vatIncluded: boolean;
  useMyLocation: boolean;
  userLatitude: number | null;
  userLongitude: number | null;
  mapClickCoordinatesChanged?: boolean; // Прапор для відстеження змін координат через карту
}

type FormErrors = Partial<Record<keyof FormData, string | undefined>>;

const CreateListingPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { categories } = useAppSelector((state) => state.catalog);
  const { isLoading } = useAppSelector((state) => state.listing);
  const { regions } = useAppSelector((state) => state.locations);
  
  // Custom hooks
  const geolocation = useGeolocation();
  const { geocodeCoordinates } = useReverseGeocode();

  // State
  const [countries, setCountries] = useState<Country[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [autoFilledFields, setAutoFilledFields] = useState<{
    countryId?: boolean;
    locationName?: boolean;
    regionId?: boolean;
  }>({});

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    price: "",
    currency: "UAH",
    categoryId: "",
    categoryName: "",
    countryId: "",
    regionId: "",
    communityId: "",
    locationId: "",
    locationName: "",
    latitude: null,
    longitude: null,
    images: [],
    condition: "USED",
    brandId: "",
    brandName: "",
    priceType: "NETTO",
    vatIncluded: false,
    useMyLocation: true,
    userLatitude: null,
    userLongitude: null,
  });

  const [motorizedSpec, setMotorizedSpec] = useState<MotorizedSpecFormType>(initialMotorizedSpec);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isUploading, setIsUploading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  
  // Ref для відстеження початкового завантаження геолокації
  const initialGeolocationProcessed = useRef(false);
  const [geocodingStatus, setGeocodingStatus] = useState<{
    isLoading: boolean;
    lastAttempt?: string;
    success: boolean;
  }>({
    isLoading: false,
    success: false
  });

  // Стейт для збереження даних геокодування для подальшого пошуку адміністративних одиниць
  const [lastGeocodingResult, setLastGeocodingResult] = useState<{
    regionName: string;
    communityName: string;
    countryId: string;
  } | null>(null);

  // Load initial data
  useEffect(() => {
    if (categories.length === 0) {
      console.log("🏷️ Завантажуємо категорії...");
      dispatch(fetchCategories());
    }
    
    // Завантажуємо марки
    console.log("🚗 Завантажуємо марки техніки...");
    dispatch(fetchBrands())
      .unwrap()
      .then((brands) => {
        console.log("✅ Марки завантажені:", brands);
      })
      .catch((error) => {
        console.error("❌ Помилка завантаження марок:", error);
      });
    
    if (!countries.length && !countriesLoading && !countriesError) {
      setCountriesLoading(true);
      console.log("🌍 Завантажуємо країни...");
      countriesAPI.getAll()
        .then((res) => {
          console.log("✅ Країни завантажені:", res.data.data);
          setCountries(res.data.data || []);
          setCountriesLoading(false);
        })
        .catch((error) => {
          setCountriesError("Не вдалося завантажити список країн");
          setCountriesLoading(false);
          console.error("❌ Помилка завантаження країн:", error);
        });
    }
  }, [dispatch, categories.length, countries.length, countriesLoading, countriesError]);

  // Load Leaflet dynamically with improved error handling
  useEffect(() => {
    const loadLeaflet = async () => {
      if (mapLoaded || mapError || typeof window === "undefined") {
        return;
      }

      try {
        console.log("🗺️ Початок завантаження Leaflet...");

        // Перевіряємо чи Leaflet вже завантажений
        if (window.L) {
          console.log("✅ Leaflet вже завантажений");
          setMapLoaded(true);
          return;
        }

        // Завантажуємо CSS
        const loadCSS = () => {
          return new Promise<void>((resolve, reject) => {
            // Перевіряємо чи CSS вже завантажений
            const existingCSS = document.querySelector('link[href*="leaflet.css"]');
            if (existingCSS) {
              console.log("✅ Leaflet CSS вже існує");
              resolve();
              return;
            }

            const leafletCss = document.createElement("link");
            leafletCss.rel = "stylesheet";
            leafletCss.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            leafletCss.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
            leafletCss.crossOrigin = "";
            
            leafletCss.onload = () => {
              console.log("✅ Leaflet CSS завантажено");
              resolve();
            };
            
            leafletCss.onerror = () => {
              console.error("❌ Помилка завантаження Leaflet CSS");
              reject(new Error("Не вдалося завантажити стилі Leaflet"));
            };
            
            document.head.appendChild(leafletCss);
          });
        };

        // Завантажуємо JS
        const loadJS = () => {
          return new Promise<void>((resolve, reject) => {
            // Перевіряємо чи JS вже завантажений
            const existingScript = document.querySelector('script[src*="leaflet.js"]');
            if (existingScript || window.L) {
              console.log("✅ Leaflet JS вже існує");
              resolve();
              return;
            }

            const leafletScript = document.createElement("script");
            leafletScript.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
            leafletScript.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
            leafletScript.crossOrigin = "";
            
            leafletScript.onload = () => {
              console.log("✅ Leaflet JS завантажено");
              // Перевіряємо чи Leaflet доступний
              if (window.L) {
                console.log("✅ Leaflet L об'єкт доступний");
                resolve();
              } else {
                console.error("❌ Leaflet L об'єкт недоступний після завантаження");
                reject(new Error("Leaflet не ініціалізувався"));
              }
            };
            
            leafletScript.onerror = () => {
              console.error("❌ Помилка завантаження Leaflet JS");
              reject(new Error("Не вдалося завантажити скрипт Leaflet"));
            };
            
            document.body.appendChild(leafletScript);
          });
        };

        // Завантажуємо CSS, потім JS
        await loadCSS();
        await loadJS();
        
        // Додаємо невелику затримку для стабільності
        await new Promise(resolve => setTimeout(resolve, 200));
        
        console.log("🎉 Leaflet повністю завантажений");
        setMapLoaded(true);

      } catch (error) {
        console.error("❌ Помилка завантаження Leaflet:", error);
        setMapError(error instanceof Error ? error.message : "Невідома помилка завантаження Leaflet");
      }
    };

    loadLeaflet();
  }, [mapLoaded, mapError]);

  // Reverse geocoding handler
  const handleReverseGeocode = useCallback(async (lat: number, lng: number, forceUpdate = false) => {
    // Створюємо AbortController для можливості скасування запиту
    const abortController = new AbortController();
    
    try {
      setGeocodingStatus({
        isLoading: true,
        lastAttempt: new Date().toLocaleTimeString(),
        success: false
      });
      
      if (!forceUpdate) {
        const hasCountry = !!formData.countryId;
        const hasLocationName = !!formData.locationName.trim();
        const hasRegion = !!formData.regionId;
        
        // Перевіряємо чи всі основні поля заповнені (залишаємо можливість автозаповнення регіону)
        if (hasCountry && hasLocationName) {
          console.log("ℹ️ Основні поля заповнені, але можемо доповнити регіон:", {
            countryId: formData.countryId,
            locationName: formData.locationName,
            regionId: formData.regionId || 'НЕ ЗАПОВНЕНО'
          });
          
          // Якщо регіон не заповнений, продовжуємо з геокодуванням для його пошуку
          if (!hasRegion) {
            console.log("🔄 Продовжуємо геокодування для автозаповнення регіону");
          } else {
            setGeocodingStatus({ isLoading: false, success: true });
            return;
          }
        }
      }
      
      console.log(`🔄 Запуск геокодування для координат: ${lat}, ${lng}, force: ${forceUpdate}`);
      
      const result = await geocodeCoordinates(lat, lng);
      console.log("📍 Повна відповідь від геокодування:", result);
      
      // Перевіряємо чи запит був скасований
      if (abortController.signal.aborted) {
        console.log('🚫 Геокодування скасовано користувачем');
        setGeocodingStatus({ isLoading: false, success: false });
        return;
      }
      
      const address = (result?.address || {}) as Record<string, string>;
      console.log("🏠 Адреса для обробки:", address);
      
      const processedAddress = processGeocodeAddress(address, countries);
      console.log("🔄 Результат обробки адреси:", processedAddress);
      
      if (processedAddress) {
        let updatedCountryId = formData.countryId;
        
        setFormData(prev => {
          const updates: Partial<FormData> = {};
          const fieldsUpdated: { countryId?: boolean; locationName?: boolean; regionId?: boolean } = {};
          
          if ((!prev.countryId || forceUpdate) && processedAddress.country) {
            updates.countryId = String(processedAddress.country.id);
            updatedCountryId = String(processedAddress.country.id); // Виправлено: використовуємо значення з processedAddress
            fieldsUpdated.countryId = true;
          }
          
          if ((!prev.locationName.trim() || forceUpdate) && processedAddress.locationName) {
            updates.locationName = processedAddress.locationName;
            fieldsUpdated.locationName = true;
          }

          // Логуємо дані для подальшого пошуку регіонів та громад
          console.log("🔄 Дані для пошуку адміністративних одиниць:", {
            regionName: processedAddress.regionName,
            communityName: processedAddress.communityName,
            countryId: updatedCountryId
          });
          
          if (Object.keys(fieldsUpdated).length > 0) {
            setAutoFilledFields(prevAutoFilled => ({
              ...prevAutoFilled,
              ...fieldsUpdated
            }));
          }
          
          return {
            ...prev,
            ...updates,
            latitude: lat,
            longitude: lng,
          };
        });
        
        setGeocodingStatus({
          isLoading: false,
          lastAttempt: new Date().toLocaleTimeString(),
          success: true
        });

        // Зберігаємо результати геокодування для подальшого пошуку адміністративних одиниць
        if (processedAddress.regionName || processedAddress.communityName) {
          console.log("📍 Виявлені адміністративні дані для подальшого пошуку:", {
            regionName: processedAddress.regionName,
            communityName: processedAddress.communityName,
            countryId: updatedCountryId
          });
          
          // Використовуємо оновлений countryId (або поточний, якщо країна не змінилася)
          const finalCountryId = updatedCountryId || formData.countryId;
          
          if (finalCountryId) {
            setLastGeocodingResult({
              regionName: processedAddress.regionName,
              communityName: processedAddress.communityName,
              countryId: finalCountryId
            });
          } else {
            console.warn("⚠️ Відсутній countryId для пошуку адміністративних одиниць");
          }
        } else {
          console.log("ℹ️ Немає адміністративних даних для автоматичного заповнення");
        }
      }
    } catch (error) {
      // Перевіряємо чи запит був скасований
      if (abortController.signal.aborted) {
        console.log('🚫 Геокодування скасовано');
        setGeocodingStatus({ isLoading: false, success: false });
        return;
      }

      // Поліпшена обробка різних типів помилок
      let errorMessage = 'Невідома помилка геокодування';
      
      if (error instanceof Error) {
        if (error.message.includes('AbortError') || error.message.includes('signal is aborted')) {
          console.log('🚫 Геокодування перервано (AbortError)');
          setGeocodingStatus({ isLoading: false, success: false });
          return;
        } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          errorMessage = 'Мережева помилка геокодування';
        } else if (error.message.includes('Таймаут')) {
          errorMessage = 'Таймаут геокодування';
        } else {
          errorMessage = error.message;
        }
      }

      console.warn("⚠️ Геокодування неуспішне:", errorMessage);
      
      // Все одно зберігаємо координати, навіть якщо геокодування не вдалося
      setFormData(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng,
      }));
      
      setGeocodingStatus({
        isLoading: false,
        lastAttempt: new Date().toLocaleTimeString(),
        success: false
      });
    }
  }, [geocodeCoordinates, countries, formData.countryId, formData.locationName, formData.regionId]);

  // Функція для автоматичного пошуку регіонів та громад
  const tryToMatchAdministrativeUnits = useCallback(async (
    regionName: string, 
    communityName: string, 
    countryId: string
  ) => {
    try {
      console.log("🔍 Пошук адміністративних одиниць:", {
        regionName,
        communityName,
        countryId,
        currentRegionsCount: regions.length
      });

      if (!countryId || !regionName) {
        console.log("⚠️ Пропускаємо пошук - відсутній countryId або regionName");
        return;
      }

      // Завжди завантажуємо регіони для поточної країни
      console.log("📥 Завантажуємо регіони для країни:", countryId);
      let loadedRegions: Array<{ id: number; name: string; countryId?: number }>;
      
      try {
        loadedRegions = await dispatch(fetchRegions(Number(countryId))).unwrap();
        console.log("✅ Регіони завантажені:", loadedRegions.length, "штук");
        console.log("📋 Список завантажених регіонів:", loadedRegions.map(r => r.name));
      } catch (regionsError) {
        console.error("❌ Помилка завантаження регіонів:", regionsError);
        
        // Спробуємо використати кешовані регіони, якщо є
        if (regions.length > 0) {
          console.log("🔄 Використовуємо кешовані регіони:", regions.length, "штук");
          loadedRegions = regions;
        } else {
          console.log("⚠️ Немає доступних регіонів для пошуку");
          return;
        }
      }

      // Використовуємо свіжо завантажені регіони для пошуку
      const regionsToSearch = loadedRegions || regions;
      
      // Поліпшений пошук регіону за назвою
      if (regionName && regionsToSearch.length > 0) {
        console.log("🔍 Шукаємо регіон серед:", regionsToSearch.map(r => r.name));
        
        const foundRegion = regionsToSearch.find(region => {
          const regionNameLower = region.name.toLowerCase();
          const searchNameLower = regionName.toLowerCase();
          
          // Точне співпадіння
          if (regionNameLower === searchNameLower) return true;
          
          // Один містить інший
          if (regionNameLower.includes(searchNameLower) || searchNameLower.includes(regionNameLower)) return true;
          
          // Пошук по ключових словах (область, region, etc.)
          const regionWords = regionNameLower.split(/[\s,.-]+/);
          const searchWords = searchNameLower.split(/[\s,.-]+/);
          
          return regionWords.some((rWord: string) => 
            searchWords.some((sWord: string) => 
              (rWord.length > 2 && sWord.length > 2) && 
              (rWord.includes(sWord) || sWord.includes(rWord))
            )
          );
        });

        if (foundRegion) {
          console.log("✅ Знайдено регіон:", foundRegion);
          
          setFormData(prev => ({
            ...prev,
            regionId: String(foundRegion.id)
          }));

          // Позначаємо регіон як автозаповнений
          setAutoFilledFields(prevAutoFilled => ({
            ...prevAutoFilled,
            regionId: true
          }));

          // Завантажуємо громади для знайденого регіону
          if (communityName) {
            console.log("📥 Завантажуємо громади для регіону:", foundRegion.id);
            
            try {
              const loadedCommunities = await dispatch(fetchCommunities(foundRegion.id)).unwrap();
              console.log("✅ Громади завантажені:", loadedCommunities.length, "штук");

              // Поліпшений пошук громади за назвою
              const foundCommunity = loadedCommunities.find(community => {
                const communityNameLower = community.name.toLowerCase();
                const searchCommunityLower = communityName.toLowerCase();
                
                // Точне співпадіння
                if (communityNameLower === searchCommunityLower) return true;
                
                // Один містить інший
                if (communityNameLower.includes(searchCommunityLower) || searchCommunityLower.includes(communityNameLower)) return true;
                
                // Пошук по ключових словах
                const communityWords = communityNameLower.split(/[\s,.-]+/);
                const searchWords = searchCommunityLower.split(/[\s,.-]+/);
                
                return communityWords.some((cWord: string) => 
                  searchWords.some((sWord: string) => 
                    (cWord.length > 2 && sWord.length > 2) && 
                    (cWord.includes(sWord) || sWord.includes(cWord))
                  )
                );
              });

              if (foundCommunity) {
                console.log("✅ Знайдено громаду:", foundCommunity);
                
                setFormData(prev => ({
                  ...prev,
                  communityId: String(foundCommunity.id)
                }));
              } else {
                console.log("⚠️ Громаду не знайдено:", communityName, "серед:", loadedCommunities.map(c => c.name));
              }
            } catch (communitiesError) {
              console.error("❌ Помилка завантаження громад:", communitiesError);
            }
          }
        } else {
          console.log("⚠️ Регіон не знайдено:", regionName, "серед:", regionsToSearch.map(r => r.name));
        }
      } else {
        console.log("⚠️ Немає регіонів для пошуку або пуста назва регіону");
      }
    } catch (error) {
      console.error("❌ Помилка пошуку адміністративних одиниць:", error);
    }
  }, [dispatch, regions]);

  // Auto geolocation on component mount
  useEffect(() => {
    if (countries.length > 0 && !geolocation.state.userLatitude && !geolocation.state.loading) {
      geolocation.requestLocation();
    }
  }, [countries.length, geolocation]);

  // Handle geolocation results
  useEffect(() => {
    if (geolocation.state.userLatitude != null && geolocation.state.userLongitude != null) {
      setFormData(prev => ({
        ...prev,
        userLatitude: geolocation.state.userLatitude,
        userLongitude: geolocation.state.userLongitude,
        // Встановлюємо координати геолокації тільки якщо координати ще не встановлені 
        // або користувач явно хоче використовувати свою локацію
        ...(prev.useMyLocation && prev.latitude === null && prev.longitude === null && {
          latitude: geolocation.state.userLatitude,
          longitude: geolocation.state.userLongitude,
        }),
      }));

      // Запускаємо геокодування тільки один раз при початковому завантаженні
      if (!initialGeolocationProcessed.current) {
        console.log("🎯 Початкове завантаження - запускаємо геокодування для геолокації");
        initialGeolocationProcessed.current = true;
        handleReverseGeocode(
          geolocation.state.userLatitude, 
          geolocation.state.userLongitude, 
          true
        );
      }
    }
  }, [geolocation.state.userLatitude, geolocation.state.userLongitude, handleReverseGeocode]);

  // Відстеження змін координат через клік на карті
  useEffect(() => {
    if (formData.mapClickCoordinatesChanged && 
        formData.latitude !== null && 
        formData.longitude !== null) {
      
      console.log("🔄 Детектовано зміну координат через карту, запускаємо геокодування");
      
      // Скидаємо прапор
      setFormData(prev => ({
        ...prev,
        mapClickCoordinatesChanged: false
      }));
      
      // Запускаємо зворотне геокодування з форсуванням
      handleReverseGeocode(formData.latitude, formData.longitude, true);
    }
  }, [formData.mapClickCoordinatesChanged, formData.latitude, formData.longitude, handleReverseGeocode]);

  // Обробка результатів геокодування для пошуку адміністративних одиниць
  useEffect(() => {
    if (lastGeocodingResult) {
      console.log("🔍 Запускаємо пошук адміністративних одиниць:", lastGeocodingResult);
      
      tryToMatchAdministrativeUnits(
        lastGeocodingResult.regionName,
        lastGeocodingResult.communityName,
        lastGeocodingResult.countryId
      );
      
      // Скидаємо результат після обробки
      setLastGeocodingResult(null);
    }
  }, [lastGeocodingResult, tryToMatchAdministrativeUnits]);

  // Form handlers
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    if (name === "categoryId") {
      const selectedCategory = categories.find((cat) => cat.id === Number(value));
      setFormData({
        ...formData,
        [name]: value,
        categoryName: selectedCategory ? selectedCategory.name : "",
      });
    } else if (name === "vatIncluded") {
      setFormData({
        ...formData,
        vatIncluded: !!checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    if (errors[name as keyof FormErrors]) {
      setErrors({
        ...errors,
        [name]: undefined,
      });
    }
  };

  const handleMotorizedSpecChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setMotorizedSpec((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleLocationChange = (name: string, value: string | number) => {
    if (name === "countryId" || name === "locationName" || name === "regionId") {
      setAutoFilledFields(prev => ({
        ...prev,
        [name]: false
      }));
    }

    if (name === "countryId") {
      setFormData({
        ...formData,
        countryId: String(value),
        regionId: "",
        communityId: "",
        locationId: "",
      });
    } else if (name === "regionId") {
      setFormData({
        ...formData,
        regionId: String(value),
        communityId: "",
        locationId: "",
      });
    } else if (name === "communityId") {
      setFormData({
        ...formData,
        communityId: String(value),
        locationId: "",
      });
    } else if (name === "latitude" || name === "longitude") {
      setFormData({
        ...formData,
        [name]: typeof value === "number" ? value : parseFloat(value),
      });
    } else {
      setFormData({
        ...formData,
        [name]: String(value),
      });
    }

    if (errors[name as keyof FormErrors]) {
      setErrors({
        ...errors,
        [name]: undefined,
      });
    }
  };

  const handleMapCoordinatesChange = (name: string, value: string | number) => {
    console.log("🗺️ Користувач клікнув на карті:", name, "значення:", value);
    
    if (name === "latitude" || name === "longitude") {
      const coordValue = typeof value === "number" ? value : parseFloat(value);
      
      // Вимикаємо автоматичне використання геолокації при ручному кліку на карті
      setFormData(prev => ({
        ...prev,
        [name]: coordValue,
        useMyLocation: false, // Користувач вручну встановив координати
        // Додаємо спеціальний прапор для індикації, що координати змінені через карту
        mapClickCoordinatesChanged: true
      }));
      
      console.log("🔄 Координати оновлені з карти, useMyLocation встановлено в false");
    }
  };

  const handleBrandSelect = (brandId: string, brandName: string) => {
    setFormData({
      ...formData,
      brandId,
      brandName,
    });

    if (errors.brandId) {
      setErrors(prev => {
        const { brandId: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({
      ...formData,
      images: newImages,
    });
  };

  const handleImagesChange = (newImages: (File | string)[]) => {
    // Filter out string images as they're handled separately
    const fileImages = newImages.filter((img): img is File => img instanceof File);
    
    // Validate image size
    const oversizedImages = fileImages.filter(
      img => img.size > MAX_IMAGE_SIZE_MB * 1024 * 1024
    );

    if (oversizedImages.length > 0) {
      setErrors({
        ...errors,
        images: `Деякі зображення перевищують максимальний розмір ${MAX_IMAGE_SIZE_MB}MB`,
      });
      return;
    }

    setFormData({
      ...formData,
      images: fileImages,
    });

    if (errors.images) {
      setErrors({
        ...errors,
        images: undefined,
      });
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    console.log("🔍 Початок валідації форми");
    console.log("📊 Поточні дані форми для валідації:", {
      title: formData.title,
      brandId: formData.brandId,
      description: `"${formData.description}" (довжина: ${formData.description.trim().length})`,
      price: formData.price,
      categoryId: formData.categoryId,
      countryId: formData.countryId,
      locationName: formData.locationName,
      latitude: formData.latitude,
      longitude: formData.longitude,
      images: `${formData.images.length} зображень`
    });

    const newErrors: FormErrors = {};

    if (!formData.title.trim()) newErrors.title = "Введіть назву оголошення";
    if (!formData.brandId) newErrors.brandId = "Виберіть марку техніки";
    
    if (!formData.description.trim()) {
      newErrors.description = "Введіть опис оголошення";
    } else if (formData.description.trim().length < MIN_DESCRIPTION_LENGTH) {
      newErrors.description = `Опис повинен містити щонайменше ${MIN_DESCRIPTION_LENGTH} символів`;
    }
    
    if (!formData.price.trim()) {
      newErrors.price = "Введіть ціну";
    } else {
      const cleanPrice = formData.price.replace(/\s/g, ''); // Видаляємо пробіли для валідації
      if (!/^\d+$/.test(cleanPrice)) {
        newErrors.price = "Ціна повинна містити тільки цифри";
      } else if (parseFloat(cleanPrice) <= 0) {
        newErrors.price = "Ціна повинна бути більше нуля";
      } else if (parseFloat(cleanPrice) > 999999999) {
        newErrors.price = "Ціна занадто велика (максимум 999,999,999)";
      }
    }
    
    if (!formData.categoryId) newErrors.categoryId = "Виберіть категорію";
    if (!formData.countryId) newErrors.countryId = "Виберіть країну";
    if (!formData.locationName.trim()) newErrors.locationName = "Введіть населений пункт";
    
    if (formData.latitude === null || formData.longitude === null) {
      newErrors.latitude = "Вкажіть місцезнаходження на карті";
    }
    
    if (formData.images.length === 0) {
      newErrors.images = "Завантажте хоча б одне зображення";
    }

    console.log("❌ Помилки валідації:", newErrors);
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log(`✅ Результат валідації: ${isValid ? 'ПРОЙШЛА' : 'НЕ ПРОЙШЛА'}`);
    return isValid;
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    setIsUploading(true);

    try {
      console.log("📤 Початок створення оголошення");
      console.log("📊 Дані форми:", formData);
      
      // Детальна перевірка критичних полів відповідно до backend schema
      console.log("🔍 ДЕТАЛЬНА ВАЛІДАЦІЯ ДАНИХ:");
      
      if (!formData.title?.trim()) {
        alert("Заголовок є обов'язковим");
        return;
      }
      console.log("✅ Title OK:", formData.title);
      
      if (!formData.description?.trim()) {
        alert("Опис є обов'язковим");
        return;
      }
      console.log("✅ Description OK:", `${formData.description.length} символів`);
      
      if (!formData.price?.trim()) {
        alert("Ціна є обов'язковою");
        return;
      }
      const numericPrice = parseFloat(formData.price.replace(/\s/g, ''));
      if (isNaN(numericPrice) || numericPrice <= 0) {
        alert("Ціна повинна бути числом більше нуля");
        return;
      }
      console.log("✅ Price OK:", numericPrice);
      
      if (!formData.brandId) {
        alert("Виберіть бренд");
        return;
      }
      const numericBrandId = parseInt(formData.brandId);
      if (isNaN(numericBrandId)) {
        alert("Некоректний ID бренду");
        return;
      }
      console.log("✅ BrandId OK:", numericBrandId);
      
      if (!formData.categoryId) {
        alert("Виберіть категорію");
        return;
      }
      const numericCategoryId = parseInt(formData.categoryId);
      if (isNaN(numericCategoryId)) {
        alert("Некоректний ID категорії");
        return;
      }
      console.log("✅ CategoryId OK:", numericCategoryId);
      
      if (!formData.categoryName?.trim()) {
        alert("Дані категорії пошкоджені. Виберіть категорію ще раз.");
        return;
      }
      console.log("✅ Category name OK:", formData.categoryName);
      
      // Backend schema потребує settlement мін. 2 символи
      if (!formData.locationName?.trim()) {
        alert("Вкажіть населений пункт");
        return;
      }
      
      if (formData.locationName.trim().length < 2) {
        alert("Населений пункт повинен містити мінімум 2 символи (backend вимога)");
        return;
      }
      console.log("✅ Settlement OK:", `"${formData.locationName.trim()}" (${formData.locationName.trim().length} символів)`);
      
      if (!formData.countryId) {
        alert("Виберіть країну");
        return;
      }
      const numericCountryId = parseInt(formData.countryId);
      if (isNaN(numericCountryId)) {
        alert("Некоректний ID країни");
        return;
      }
      console.log("✅ CountryId OK:", numericCountryId);
      
      // Перевірка координат
      if (formData.latitude === null || formData.longitude === null) {
        alert("Координати обов'язкові");
        return;
      }
      if (isNaN(formData.latitude) || isNaN(formData.longitude)) {
        alert("Некоректні координати");
        return;
      }
      console.log("✅ Coordinates OK:", { lat: formData.latitude, lng: formData.longitude });
      
      // Перевірка умови (backend очікує lowercase)
      const validConditions = ['new', 'used'];
      const conditionLower = formData.condition.toLowerCase();
      if (!validConditions.includes(conditionLower)) {
        alert("Некоректний стан техніки");
        return;
      }
      console.log("✅ Condition OK:", conditionLower);
      
      const formDataToSubmit = new FormData();

      // ВАЖЛИВО: Конвертуємо всі дані у відповідність до backend schema
      console.log("📦 ФОРМУВАННЯ FORMDATA ВІДПОВІДНО ДО BACKEND SCHEMA:");

      // Basic info - відправляємо точно як очікує backend
      formDataToSubmit.append("title", formData.title.trim());
      formDataToSubmit.append("description", formData.description.trim());
      
      // Ціна: backend очікує number, відправляємо як string (FormData автоматично конвертує)
      const cleanPrice = formData.price.replace(/\s/g, '');
      formDataToSubmit.append("price", cleanPrice);
      console.log("💰 Price formatted:", cleanPrice);
      
      formDataToSubmit.append("currency", formData.currency);
      formDataToSubmit.append("category", formData.categoryName.trim());
      
      // CategoryId: backend очікує number
      formDataToSubmit.append("categoryId", formData.categoryId);
      console.log("🏷️ CategoryId:", formData.categoryId, "type:", typeof formData.categoryId);

      // Condition: backend очікує lowercase enum ['new', 'used']
      const conditionValue = formData.condition.toLowerCase();
      formDataToSubmit.append("condition", conditionValue);
      console.log("� Condition:", conditionValue);
      
      // BrandId: backend очікує number
      formDataToSubmit.append("brandId", formData.brandId);
      console.log("🚗 BrandId:", formData.brandId, "type:", typeof formData.brandId);

      // Location data - формуємо відповідно до locationInputSchema
      const locationData = {
        // countryId: backend очікує number, але опціонально
        countryId: parseInt(formData.countryId),
        // settlement: обов'язково, мін. 2 символи
        settlement: formData.locationName.trim(),
        // regionId: опціонально, якщо є
        ...(formData.regionId && formData.regionId !== "" ? { regionId: parseInt(formData.regionId) } : {}),
        // communityId: опціонально, якщо є
        ...(formData.communityId && formData.communityId !== "" ? { communityId: parseInt(formData.communityId) } : {}),
        // coordinates: backend очікує number
        latitude: parseFloat(String(formData.latitude)),
        longitude: parseFloat(String(formData.longitude))
      };
      
      console.log("📍 Location data object:", JSON.stringify(locationData, null, 2));
      console.log("🔍 Settlement length check:", locationData.settlement?.length || 0);
      console.log("🔍 Settlement value:", `"${locationData.settlement}"`);
      
      // Валідуємо locationData перед відправкою
      if (isNaN(locationData.countryId)) {
        alert("Некоректний ID країни");
        return;
      }
      if (!locationData.settlement || locationData.settlement.length < 2) {
        alert(`Населений пункт повинен містити мінімум 2 символи. Поточне значення: "${locationData.settlement}" (довжина: ${locationData.settlement?.length || 0})`);
        return;
      }
      if (isNaN(locationData.latitude) || isNaN(locationData.longitude)) {
        alert("Некоректні координати");
        return;
      }
      
      formDataToSubmit.append("location", JSON.stringify(locationData));

      // Координати також окремо (якщо backend їх очікує окремо)
      formDataToSubmit.append("latitude", String(locationData.latitude));
      formDataToSubmit.append("longitude", String(locationData.longitude));
      
      // CountryId окремо (для сумісності)
      formDataToSubmit.append("countryId", String(locationData.countryId));

      formDataToSubmit.append("priceType", formData.priceType);
      formDataToSubmit.append("vatIncluded", String(formData.vatIncluded));

      // Motorized specs
      if (isMotorized) {
        const hasFilledValues = Object.values(motorizedSpec).some(value => {
          if (value === null || value === undefined) return false;
          if (typeof value === "string" && value.trim() === "") return false;
          return true;
        });

        if (hasFilledValues) {
          // ВАЖЛИВО: Конвертуємо enum значення у правильний формат для backend
          const convertedMotorizedSpec = { ...motorizedSpec };
          
          console.log("🔧 BEFORE conversion - motorizedSpec:", JSON.stringify(motorizedSpec, null, 2));
          
          // Backend очікує transmission у ВЕРХНЬОМУ РЕГІСТРІ: 'MANUAL' | 'AUTOMATIC' | 'HYDROSTATIC' | 'CVT'
          if (convertedMotorizedSpec.transmission && typeof convertedMotorizedSpec.transmission === 'string' && convertedMotorizedSpec.transmission.trim() !== "") {
            const originalTransmission = convertedMotorizedSpec.transmission;
            const upperTransmission = convertedMotorizedSpec.transmission.toUpperCase();
            console.log("🔧 Transmission converted:", `"${originalTransmission}" → "${upperTransmission}"`);
            
            // Валідуємо що значення є валідним enum
            const validTransmissions = ['MANUAL', 'AUTOMATIC', 'HYDROSTATIC', 'CVT'] as const;
            if (!validTransmissions.includes(upperTransmission as any)) {
              alert(`Некоректний тип трансмісії: "${originalTransmission}". Допустимі значення: ${validTransmissions.join(', ')}`);
              return;
            }
            
            convertedMotorizedSpec.transmission = upperTransmission as typeof convertedMotorizedSpec.transmission;
          }
          
          // Backend очікує fuelType у ВЕРХНЬОМУ РЕГІСТРІ: 'DIESEL' | 'GASOLINE' | 'ELECTRIC' | 'HYBRID' | 'GAS'
          if (convertedMotorizedSpec.fuelType && typeof convertedMotorizedSpec.fuelType === 'string') {
            const originalFuelType = convertedMotorizedSpec.fuelType;
            convertedMotorizedSpec.fuelType = convertedMotorizedSpec.fuelType.toUpperCase() as typeof convertedMotorizedSpec.fuelType;
            console.log("🔧 FuelType converted:", `"${originalFuelType}" → "${convertedMotorizedSpec.fuelType}"`);
          }
          
          console.log("🔧 AFTER conversion - motorizedSpec:", JSON.stringify(convertedMotorizedSpec, null, 2));
          
          formDataToSubmit.append("motorizedSpec", JSON.stringify(convertedMotorizedSpec));
        }
      }

      // Images
      formData.images.forEach((file, index) => {
        formDataToSubmit.append("images", file);
        console.log(`🖼️ Зображення ${index + 1}:`, file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      });

      // Логуємо всі дані, які відправляються
      console.log("📋 ФІНАЛЬНИЙ FORMDATA ДЛЯ ВІДПРАВКИ:");
      console.log("📊 Загальна кількість полів:", Array.from(formDataToSubmit.keys()).length);
      
      for (const [key, value] of formDataToSubmit.entries()) {
        if (value instanceof File) {
          console.log(`  📎 ${key}:`, `File(${value.name}, ${(value.size / 1024 / 1024).toFixed(2)}MB, ${value.type})`);
        } else {
          console.log(`  📝 ${key}:`, `"${value}" (length: ${String(value).length})`);
        }
      }

      console.log("� ВІДПРАВЛЯЄМО ЗАПИТ НА СТВОРЕННЯ ОГОЛОШЕННЯ...");
      console.log("� Backend endpoint: POST /listings");
      console.log("⚠️  УВАГА: За попереднім аналізом, backend route може не мати validation middleware!");
      
      const resultAction = await dispatch(createListing(formDataToSubmit));

      console.log("📨 РЕЗУЛЬТАТ ВІДПОВІДІ:", resultAction);
      console.log("📊 Type:", resultAction.type);
      console.log("📊 Meta:", resultAction.meta);

      if (createListing.fulfilled.match(resultAction)) {
        console.log("✅ ОГОЛОШЕННЯ УСПІШНО СТВОРЕНО:", resultAction.payload);
        navigate(`/listings/${resultAction.payload.id}`);
      } else {
        console.error("❌ ПОМИЛКА СТВОРЕННЯ ОГОЛОШЕННЯ");
        console.error("❌ Error object:", resultAction.error);
        console.error("❌ Error payload:", resultAction.payload);
        
        // Детальний аналіз помилки
        let detailedError = "Невідома помилка";
        let statusCode: string | number = "невідомий";
        let backendMessage = "";
        
        if (resultAction.payload && typeof resultAction.payload === 'object') {
          const payload = resultAction.payload as Record<string, unknown>;
          
          console.log("🔍 АНАЛІЗ PAYLOAD ПОМИЛКИ:");
          console.log("  Status:", payload.status);
          console.log("  Data:", payload.data);
          console.log("  Message:", payload.message);
          
          statusCode = (payload.status as string | number) || "невідомий";
          
          if (payload.data) {
            if (typeof payload.data === 'object') {
              const data = payload.data as Record<string, unknown>;
              console.log(payload.data);
              backendMessage = (data.message as string) || JSON.stringify(payload.data);
              
              // Специфічна обробка для 400 Bad Request
              if (payload.status === 400) {
                console.error("🚨 400 BAD REQUEST - АНАЛІЗ:");
                console.error("  Можливі причини:");
                console.error("  1. Відсутній validation middleware на backend");
                console.error("  2. Неправильний формат даних");
                console.error("  3. Обов'язкові поля відсутні");
                console.error("  4. Некоректні типи даних");
                
                if (data.errors) {
                  console.error("  Validation errors:", data.errors);
                  detailedError = `Помилки валідації: ${JSON.stringify(data.errors, null, 2)}`;
                } else if (data.message) {
                  detailedError = data.message as string;
                } else {
                  detailedError = `400 Bad Request: ${JSON.stringify(payload.data, null, 2)}`;
                }
              } else {
                detailedError = backendMessage;
              }
            } else {
              detailedError = String(payload.data);
            }
          } else if (payload.message) {
            detailedError = payload.message as string;
          }
        }
        
        console.error("❌ ДЕТАЛЬНА ПОМИЛКА:", detailedError);
        console.error("❌ STATUS CODE:", statusCode);
        
        const errorMessage = handleApiError(resultAction.error);
        
        // Покращене повідомлення про помилку для користувача
        let userMessage = `Не вдалося створити оголошення (${statusCode})`;
        
        if (statusCode === 400) {
          userMessage += "\n\n🚨 Можлива причина: проблема валідації даних на сервері";
          userMessage += "\n💡 Спробуйте:";
          userMessage += "\n  • Перевірити всі обов'язкові поля";
          userMessage += "\n  • Вибрати населений пункт ще раз";
          userMessage += "\n  • Перевірити координати на карті";
        }
        
        userMessage += `\n\nТехнічна інформація: ${errorMessage} - ${detailedError}`;
        
        alert(userMessage);
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      alert(`Виникла помилка під час створення оголошення: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUseMyLocationToggle = (checked: boolean) => {
    setFormData((prev) => {
      if (checked && 
          geolocation.state.userLatitude != null && 
          geolocation.state.userLongitude != null) {
        return {
          ...prev,
          useMyLocation: true,
          latitude: geolocation.state.userLatitude,
          longitude: geolocation.state.userLongitude,
        };
      }
      return {
        ...prev,
        useMyLocation: false,
      };
    });
  };

  const requestGeolocation = () => {
    geolocation.requestLocation();
  };

  const selectedCategoryObj = categories.find(
    (cat) => cat.id === Number(formData.categoryId)
  );
  const isMotorized = selectedCategoryObj?.isMotorized ?? false;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Створення нового оголошення
      </h1>

      {countriesError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{countriesError}</p>
            </div>
          </div>
        </div>
      )}

      {mapError && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{mapError}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} autoComplete="off">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            {/* Title */}
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
                className={`w-full px-4 py-2 border ${
                  errors.title ? "border-red-500" : "border-gray-300"
                } rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500`}
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? "title-error" : undefined}
              />
              {errors.title && (
                <p id="title-error" className="mt-1 text-sm text-red-500">
                  {errors.title}
                </p>
              )}
            </div>

            {/* Brand */}
            <BrandSelector
              value={formData.brandId}
              onChange={handleBrandSelect}
              error={errors.brandId || ""}
            />

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Опис *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Детальний опис товару, технічні характеристики, стан, комплектація тощо"
                rows={8}
                className={`w-full px-4 py-2 border ${
                  errors.description ? "border-red-500" : "border-gray-300"
                } rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500`}
                aria-invalid={!!errors.description}
                aria-describedby={errors.description ? "description-error" : undefined}
              />
              <p className="mt-1 text-xs text-gray-500">
                Мінімум {MIN_DESCRIPTION_LENGTH} символів
              </p>
              {errors.description && (
                <p id="description-error" className="mt-1 text-sm text-red-500">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Price */}
            <PriceInput
              price={formData.price}
              currency={formData.currency}
              priceType={formData.priceType}
              vatIncluded={formData.vatIncluded}
              onChange={handleInputChange}
              error={errors.price || ""}
            />
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Category */}
            <CategorySelector
              value={formData.categoryId}
              onChange={handleInputChange}
              error={errors.categoryId || ""}
            />

            {/* Condition */}
            <div>
              <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
                Стан техніки *
              </label>
              <div className="relative">
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  className="appearance-none w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="NEW">Нова</option>
                  <option value="USED">Вживана</option>
                </select>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Місцезнаходження товару</h3>
              
              <GeolocationTester onLocationReceived={(lat, lng) => {
                handleReverseGeocode(lat, lng, true);
              }} />
              
              {geocodingStatus.isLoading && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
                    <span className="text-sm text-yellow-800">Отримання адреси з координат...</span>
                  </div>
                </div>
              )}
              
              {geocodingStatus.lastAttempt && !geocodingStatus.isLoading && (
                <div className={`p-3 rounded-md ${
                  geocodingStatus.success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center">
                    {geocodingStatus.success ? (
                      <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className={`text-sm ${
                      geocodingStatus.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {geocodingStatus.success 
                        ? `Адреса успішно отримана (${geocodingStatus.lastAttempt})`
                        : `Не вдалося отримати адресу (${geocodingStatus.lastAttempt}). Ви можете ввести дані вручну.`
                      }
                    </span>
                  </div>
                </div>
              )}
              
              <GeolocationDebugPanel
                formData={{
                  useMyLocation: formData.useMyLocation,
                  userLatitude: geolocation.state.userLatitude,
                  userLongitude: geolocation.state.userLongitude,
                  latitude: formData.latitude ?? undefined,
                  longitude: formData.longitude ?? undefined,
                  countryId: formData.countryId,
                  regionId: formData.regionId,
                  locationName: formData.locationName,
                }}
                countries={countries}
                onLocationChange={handleLocationChange}
                onForceGeocodeUpdate={(lat, lng) => handleReverseGeocode(lat, lng, true)}
                processGeocodeAddress={processGeocodeAddress}
              />
              
              <CoordinatesDisplay
                useMyLocation={formData.useMyLocation}
                userLatitude={geolocation.state.userLatitude}
                userLongitude={geolocation.state.userLongitude}
                productLatitude={formData.latitude ?? undefined}
                productLongitude={formData.longitude ?? undefined}
                isLoadingLocation={geolocation.state.loading}
                onUseMyLocationToggle={handleUseMyLocationToggle}
                onRequestGeolocation={requestGeolocation}
              />
            </div>

            {/* Location selector */}
            <LocationSelector
              countries={countries}
              data={{
                countryId: formData.countryId,
                regionId: formData.regionId,
                communityId: formData.communityId,
                locationName: formData.locationName,
                latitude: formData.latitude || 0,
                longitude: formData.longitude || 0,
              }}
              errors={{
                countryId: errors.countryId || "",
                regionId: errors.regionId || "",
                communityId: errors.communityId || "",
                locationName: errors.locationName || "",
                latitude: errors.latitude || "",
              }}
              onChange={handleLocationChange}
              onMapClick={handleMapCoordinatesChange}
              mapLoaded={mapLoaded}
              useCountryCoordinates={true}
            />

            {/* Auto-filled fields indicator */}
            {(autoFilledFields.countryId || autoFilledFields.locationName || autoFilledFields.regionId) && (
              <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Автоматично заповнено на основі геолокації:</span>
                </div>
                <ul className="mt-1 ml-6 text-xs">
                  {autoFilledFields.countryId && <li>• Країна</li>}
                  {autoFilledFields.regionId && <li>• Регіон/Область</li>}
                  {autoFilledFields.locationName && <li>• Населений пункт</li>}
                </ul>
                <p className="mt-2 text-xs text-gray-600">
                  Ви можете змінити ці дані вручну, якщо вони неточні.
                </p>
              </div>
            )}

            {/* Image uploader */}
            <ImageUploader
              images={formData.images}
              onChange={handleImagesChange}
              onRemove={handleRemoveImage}
              error={errors.images || ""}
            />
          </div>
        </div>

        {/* Motorized specs */}
        <MotorizedSpecFormComponent
          isMotorized={isMotorized}
          motorizedSpec={motorizedSpec}
          onChange={handleMotorizedSpecChange}
        />

        {/* Form actions */}
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
            disabled={isLoading || isUploading}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading || isUploading
              ? "Публікація..."
              : "Опублікувати оголошення"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateListingPage;

// import React, { useState, useEffect, useCallback } from "react";
// import { useNavigate } from "react-router-dom";
// import { useAppDispatch, useAppSelector } from "../store";
// import { fetchCategories } from "../store/catalogSlice";
// import { fetchBrands } from "../store/brandSlice";
// import { createListing } from "../store/listingSlice";
// // import { fetchRegions } from "../store/locationSlice"; // ТИМЧАСОВО ВИМКНЕНО
// import { countriesAPI } from "../api/apiClient";
// import { useGeolocation, useReverseGeocode } from "../hooks/useGeolocation";
// import { handleApiError } from "../utils/errorHandler";
// import MotorizedSpecFormComponent, {
//   initialMotorizedSpec,
//   MotorizedSpecForm as MotorizedSpecFormType,
// } from "../components/ui/MotorizedSpecForm";
// import CategorySelector from "../components/ui/CategorySelector";
// import BrandSelector from "../components/ui/BrandSelector";
// import PriceInput from "../components/ui/PriceInput";
// import ImageUploader from "../components/ui/ImageUploader";
// import LocationSelector from "../components/ui/LocationSelector";
// import GeolocationDebugPanel from "../components/ui/GeolocationDebugPanel";
// import CoordinatesDisplay from "../components/ui/CoordinatesDisplay";
// import GeolocationTester from "../components/ui/GeolocationTester";

// // Add Leaflet to the Window type for TypeScript
// declare global {
//   interface Window {
//     L: typeof import("leaflet");
//   }
// }

// interface FormData {
//   title: string;
//   description: string;
//   price: string;
//   currency: "UAH" | "USD" | "EUR";
//   categoryId: string;
//   categoryName: string;
//   countryId: string;
//   regionId: string;
//   communityId: string;
//   locationId: string;
//   locationName: string;
//   latitude: number | undefined;
//   longitude: number | undefined;
//   images: File[];
//   condition: "NEW" | "USED";
//   brandId: string;
//   brandName: string;
//   priceType: "NETTO" | "BRUTTO";
//   vatIncluded: boolean;
//   // Нові поля для геолокації
//   useMyLocation: boolean; // чи використовувати місце автора
//   userLatitude: number | null; // координати автора
//   userLongitude: number | null;
// }

// interface FormErrors {
//   title?: string;
//   description?: string;
//   price?: string;
//   categoryId?: string;
//   countryId?: string;
//   regionId?: string;
//   communityId?: string;
//   locationId?: string;
//   locationName?: string;
//   images?: string | undefined;
//   brandId?: string | undefined;
//   latitude?: string;
//   longitude?: string;
// }

// const CreateListingPage = () => {
//   const dispatch = useAppDispatch();
//   const navigate = useNavigate();
//   const { categories } = useAppSelector((state) => state.catalog);
//   const { isLoading } = useAppSelector((state) => state.listing);
  
//   // Кастомні хуки для геолокації
//   const geolocation = useGeolocation();
//   const { geocodeCoordinates } = useReverseGeocode();

//   const [countries, setCountries] = useState<
//     {
//       id: number;
//       name: string;
//       code: string;
//       latitude?: number;
//       longitude?: number;
//     }[]
//   >([]);

//   // Стан для відстеження автоматично заповнених полів
//   const [autoFilledFields, setAutoFilledFields] = useState<{
//     countryId?: boolean;
//     locationName?: boolean;
//   }>({});

//   const [formData, setFormData] = useState<FormData>({
//     title: "",
//     description: "",
//     price: "",
//     currency: "UAH",
//     categoryId: "",
//     categoryName: "",
//     countryId: "",
//     regionId: "",
//     communityId: "",
//     locationId: "",
//     locationName: "",
//     latitude: undefined,
//     longitude: undefined,
//     images: [],
//     condition: "USED",
//     brandId: "",
//     brandName: "",
//     priceType: "NETTO",
//     vatIncluded: false,
//     useMyLocation: true,
//     userLatitude: null,
//     userLongitude: null,
//   });

//   const [motorizedSpec, setMotorizedSpec] =
//     useState<MotorizedSpecFormType>(initialMotorizedSpec);

//   const [errors, setErrors] = useState<FormErrors>({});
//   const [isUploading, setIsUploading] = useState(false);
//   const [mapLoaded, setMapLoaded] = useState(false);
//   const [geocodingStatus, setGeocodingStatus] = useState<{
//     isLoading: boolean;
//     lastAttempt?: string;
//     success: boolean;
//   }>({
//     isLoading: false,
//     success: false
//   });

//   useEffect(() => {
//     if (categories.length === 0) dispatch(fetchCategories());
//     if (!countries.length) {
//       dispatch(fetchBrands());
//       countriesAPI.getAll().then((res) => {
//         setCountries(res.data.data || []);
//       });
//     }
//   }, [dispatch, categories.length, countries.length]);

//   // ТИМЧАСОВО ВИМКНЕНО: автоматичне завантаження регіонів
//   // useEffect(() => {
//   //   if (formData.countryId) {
//   //     dispatch(fetchRegions(formData.countryId));
//   //   }
//   // }, [dispatch, formData.countryId]);

//   // Динамічне підключення Leaflet
//   useEffect(() => {
//     if (!mapLoaded && typeof window !== "undefined") {
//       const leafletCss = document.createElement("link");
//       leafletCss.rel = "stylesheet";
//       leafletCss.href = "https://unpkg.com/leaflet/dist/leaflet.css";
//       document.head.appendChild(leafletCss);

//       const leafletScript = document.createElement("script");
//       leafletScript.src = "https://unpkg.com/leaflet/dist/leaflet.js";
//       leafletScript.async = true;
//       leafletScript.onload = () => setMapLoaded(true);
//       document.body.appendChild(leafletScript);
//     }
//   }, [mapLoaded]);

//   const selectedCategoryObj = categories.find(
//     (cat) => cat.id === Number(formData.categoryId)
//   );
//   const isMotorized = selectedCategoryObj?.isMotorized ?? false;

//   // Функція для зворотного геокодування
//   const handleReverseGeocode = useCallback(async (lat: number, lng: number, forceUpdate = false) => {
//     try {
//       console.log("🔄 handleReverseGeocode викликана:", { lat, lng, forceUpdate });
      
//       setGeocodingStatus({
//         isLoading: true,
//         lastAttempt: new Date().toLocaleTimeString(),
//         success: false
//       });
      
//       console.log("📊 Поточний стан форми:", {
//         countryId: formData.countryId,
//         locationName: formData.locationName,
//         hasCountry: !!(formData.countryId && formData.countryId !== ""),
//         hasLocationName: !!(formData.locationName && formData.locationName.trim() !== "")
//       });
      
//       // Якщо не форсується оновлення, перевіряємо чи потрібно робити геокодування
//       if (!forceUpdate) {
//         // Перевіряємо поточний стан форми
//         const hasCountry = formData.countryId && formData.countryId !== "";
//         const hasLocationName = formData.locationName && formData.locationName.trim() !== "";
        
//         // Якщо обидва поля заповнені, не робимо геокодування
//         if (hasCountry && hasLocationName) {
//           console.log("❌ Пропускаємо геокодування - всі поля заповнені:", {
//             countryId: formData.countryId,
//             locationName: formData.locationName
//           });
//           setGeocodingStatus({ isLoading: false, success: true });
//           return;
//         }
        
//         console.log("✅ Дозволяємо геокодування - є порожні поля:", {
//           needsCountry: !hasCountry,
//           needsLocationName: !hasLocationName
//         });
//       } else {
//         console.log("🚀 Форсоване геокодування - ігноруємо поточний стан форми");
//       }
      
//       console.log("🌐 Виконуємо запит до геокодування API...");
//       const result = await geocodeCoordinates(lat, lng);
//       console.log("📍 Отримана відповідь від геокодування:", result);
      
//       const address = (result?.address || {}) as Record<string, string>;
      
//       const processedAddress = processGeocodeAddress(address, countries);
//       console.log("🏠 Оброблена адреса:", processedAddress);
      
//       if (processedAddress) {
//         console.log("✅ Знайдена країна для автоматичного заповнення:", processedAddress.country);
        
//         setFormData(prev => {
//           // Оновлюємо тільки порожні поля, якщо не форсується оновлення
//           const updates: Partial<typeof prev> = {};
//           const fieldsUpdated: { countryId?: boolean; locationName?: boolean } = {};
          
//           console.log("📝 Поточний стан форми перед оновленням:", {
//             countryId: prev.countryId,
//             locationName: prev.locationName,
//             forceUpdate
//           });
          
//           // Країна: оновлюємо тільки якщо не вибрана або форсується оновлення
//           if ((!prev.countryId || prev.countryId === "") || forceUpdate) {
//             updates.countryId = String(processedAddress.country.id);
//             fieldsUpdated.countryId = true;
//             console.log("Оновлюємо країну:", updates.countryId);
//           } else {
//             console.log("Країна вже вибрана, не оновлюємо:", prev.countryId);
//           }
          
//           // Населений пункт: оновлюємо тільки якщо порожній або форсується оновлення
//           if ((!prev.locationName || prev.locationName.trim() === "") || forceUpdate) {
//             updates.locationName = processedAddress.locationName;
//             fieldsUpdated.locationName = true;
//             console.log("Оновлюємо населений пункт:", updates.locationName);
//           } else {
//             console.log("Населений пункт вже заповнений, не оновлюємо:", prev.locationName);
//           }
          
//           console.log("Фінальні оновлення геолокації:", updates);
          
//           // Оновлюємо autoFilledFields тільки якщо є зміни
//           if (Object.keys(fieldsUpdated).length > 0) {
//             setAutoFilledFields(prevAutoFilled => ({
//               ...prevAutoFilled,
//               ...fieldsUpdated
//             }));
//           }
          
//           return {
//             ...prev,
//             ...updates
//           };
//         });
        
//         // Завантажуємо регіони для знайденої країни окремо (поза setFormData)
//         const countryId = String(processedAddress.country.id);
        
//         // Отримуємо поточний стан формуляра
//         setFormData(currentFormData => {
//           if ((!currentFormData.countryId || currentFormData.countryId !== countryId) || forceUpdate) {
//             console.log("Країна знайдена:", countryId);
//             console.log("Поточна країна в формі:", currentFormData.countryId);
//             console.log("Знайдена країна:", processedAddress.country);
            
//             // Перевіряємо, чи існує країна в нашому списку
//             const countryExists = countries.find(c => c.id === processedAddress.country.id);
//             if (!countryExists) {
//               console.warn("Країна не знайдена в списку доступних країн:", processedAddress.country);
//               return currentFormData;
//             }
            
//             // ТИМЧАСОВО ВИМКНЕНО: завантаження регіонів (API ендпоінт не існує)
//             // dispatch(fetchRegions(countryId))
//             //   .unwrap()
//             //   .then(() => console.log("Регіони успішно завантажені"))
//             //   .catch(error => {
//             //     console.error("Помилка завантаження регіонів:", handleApiError(error));
//             //     console.error("Деталі помилки:", error);
//             //   });
            
//             console.log("⚠️ Завантаження регіонів вимкнено - API ендпоінт не існує");
//           }
//           return currentFormData; // Не змінюємо стан, просто читаємо
//         });
        
//         setGeocodingStatus({
//           isLoading: false,
//           lastAttempt: new Date().toLocaleTimeString(),
//           success: true
//         });
//       }
//     } catch (error) {
//       console.error("❌ Помилка зворотного геокодування:", error);
//       console.error("Деталі помилки:", {
//         message: error instanceof Error ? error.message : 'Невідома помилка',
//         lat,
//         lng,
//         forceUpdate
//       });
      
//       // Не блокуємо користувача через помилки геокодування
//       // Просто записуємо координати без автоматичного заповнення адреси
//       console.log("🔧 Встановлюємо тільки координати без геокодування");
      
//       setFormData(prev => ({
//         ...prev,
//         latitude: lat,
//         longitude: lng,
//         // Залишаємо поля адреси як є
//       }));
      
//       setGeocodingStatus({
//         isLoading: false,
//         lastAttempt: new Date().toLocaleTimeString(),
//         success: false
//       });
//     }
//   }, [geocodeCoordinates, countries, formData.countryId, formData.locationName]);

//   // Автоматична геолокація при завантаженні компонента
//   useEffect(() => {
//     if (countries.length > 0 && !geolocation.state.userLatitude && !geolocation.state.loading) {
//       console.log("🌍 Запускаємо автоматичний запит геолокації");
//       geolocation.requestLocation();
//     }
//   }, [countries.length, geolocation]);

//   // Обробка результатів геолокації
//   useEffect(() => {
//     if (geolocation.state.userLatitude && geolocation.state.userLongitude) {
//       console.log("🌍 Геолокація отримана:", geolocation.state.userLatitude, geolocation.state.userLongitude);
      
//       setFormData(prev => ({
//         ...prev,
//         userLatitude: geolocation.state.userLatitude,
//         userLongitude: geolocation.state.userLongitude,
//         // Якщо useMyLocation === true, то встановлюємо координати товару
//         ...(prev.useMyLocation && !prev.latitude && !prev.longitude && {
//           latitude: geolocation.state.userLatitude || undefined,
//           longitude: geolocation.state.userLongitude || undefined,
//         }),
//       }));

//       // Виконуємо зворотне геокодування ТІЛЬКИ якщо це перший запуск
//       // ВАЖЛИВО: На початку завжди дозволяємо геокодування для заповнення форми
//       console.log("🔄 Запускаємо зворотне геокодування (автоматично при завантаженні)");
      
//       // Перевіряємо, чи це перший запуск (форма ще порожня)
//       const isInitialLoad = !formData.countryId && !formData.locationName.trim();
      
//       if (isInitialLoad) {
//         console.log("✅ Початкове завантаження - дозволяємо форсоване геокодування");
//         handleReverseGeocode(geolocation.state.userLatitude, geolocation.state.userLongitude, true);
//       } else {
//         console.log("⚠️ Форма вже заповнена - м'яке геокодування");
//         handleReverseGeocode(geolocation.state.userLatitude, geolocation.state.userLongitude, false);
//       }
//     }
//   }, [geolocation.state.userLatitude, geolocation.state.userLongitude, handleReverseGeocode, formData.countryId, formData.locationName]);



//   const handleInputChange = (
//     e: React.ChangeEvent<
//       HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
//     >
//   ) => {
//     const { name, value, type } = e.target;
//     const checked =
//       type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

//     if (name === "categoryId") {
//       const selectedCategory = categories.find(
//         (cat) => cat.id === Number(value)
//       );
//       setFormData({
//         ...formData,
//         [name]: value,
//         categoryName: selectedCategory ? selectedCategory.name : "",
//       });
//     } else if (name === "vatIncluded") {
//       setFormData({
//         ...formData,
//         vatIncluded: type === "checkbox" ? !!checked : value === "true",
//       });
//     } else {
//       setFormData({
//         ...formData,
//         [name]: value,
//       });
//     }

//     if (errors[name as keyof FormErrors]) {
//       setErrors({
//         ...errors,
//         [name]: undefined,
//       });
//     }
//   };

//   const handleMotorizedSpecChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
//   ) => {
//     const { name, value, type } = e.target;
//     const checked = (e.target as HTMLInputElement).checked;
//     setMotorizedSpec((prev) => ({
//       ...prev,
//       [name]: type === "checkbox" ? checked : value,
//     }));
//   };

//   const handleLocationChange = (name: string, value: string | number) => {
//     console.log("🖊️ Користувач змінює поле:", name, "значення:", value);
    
//     // Скидаємо автоматично заповнені поля, коли користувач вводить дані вручну
//     if (name === "countryId" || name === "locationName") {
//       console.log("Скидаємо автозаповнення для:", name);
//       setAutoFilledFields(prev => ({
//         ...prev,
//         [name]: false
//       }));
//     }

//     if (name === "countryId") {
//       setFormData({
//         ...formData,
//         countryId: String(value),
//         regionId: "",
//         communityId: "",
//         locationId: "",
//       });
//     } else if (name === "regionId") {
//       setFormData({
//         ...formData,
//         regionId: String(value),
//         communityId: "",
//         locationId: "",
//       });
//     } else if (name === "communityId") {
//       setFormData({
//         ...formData,
//         communityId: String(value),
//         locationId: "",
//       });
//     } else if (name === "latitude" || name === "longitude") {
//       // ВАЖЛИВО: Координати з карти можуть оновлюватися БЕЗ зміни режиму useMyLocation
//       // Тільки якщо користувач активно працює з картою, тоді змінюємо режим
//       const newFormData = {
//         ...formData,
//         [name]: typeof value === "number" ? value : parseFloat(value),
//       };
      
//       // НЕ автоматично змінюємо useMyLocation при оновленні координат
//       // Це дозволить зберегти вибір користувача
//       setFormData(newFormData);
//     } else {
//       setFormData({
//         ...formData,
//         [name]: String(value),
//       });
//     }

//     if (errors[name as keyof FormErrors]) {
//       setErrors({
//         ...errors,
//         [name]: undefined,
//       });
//     }
//   };

//   // Спеціальний обробник для кліків на карті
//   const handleMapCoordinatesChange = (name: string, value: string | number) => {
//     console.log("🗺️ Користувач клікнув на карті:", name, "значення:", value);
    
//     if (name === "latitude" || name === "longitude") {
//       setFormData(prev => ({
//         ...prev,
//         [name]: typeof value === "number" ? value : parseFloat(value),
//         // НЕ змінюємо useMyLocation при кліку на карті
//       }));
      
//       console.log("🔄 Клік на карті - зберігаємо координати без зміни useMyLocation");
//     }
//   };

//   const handleBrandSelect = (brandId: string, brandName: string) => {
//     setFormData({
//       ...formData,
//       brandId,
//       brandName,
//     });

//     if (errors.brandId) {
//       setErrors({
//         ...errors,
//         brandId: undefined,
//       });
//     }
//   };

//   const handleRemoveImage = (index: number) => {
//     const newImages = [...formData.images];
//     newImages.splice(index, 1);

//     setFormData({
//       ...formData,
//       images: newImages,
//     });
//   };

//   const handleImagesChange = (newImages: (File | string)[]) => {
//     // Filter out string images as they're handled separately
//     const fileImages = newImages.filter((img): img is File => img instanceof File);

//     setFormData({
//       ...formData,
//       images: fileImages,
//     });

//     if (errors.images) {
//       setErrors({
//         ...errors,
//         images: undefined,
//       });
//     }
//   };

//   const validateForm = (): boolean => {
//     const newErrors: FormErrors = {};

//     if (!formData.title.trim()) newErrors.title = "Введіть назву оголошення";
//     if (!formData.brandId) newErrors.brandId = "Виберіть марку техніки";
//     if (!formData.description.trim())
//       newErrors.description = "Введіть опис оголошення (не менше 20 символів)";
//     if (!formData.price.trim()) newErrors.price = "Введіть ціну";
//     else if (
//       isNaN(parseFloat(formData.price)) ||
//       parseFloat(formData.price) <= 0
//     )
//       newErrors.price = "Введіть коректну ціну";
//     if (!formData.categoryId) newErrors.categoryId = "Виберіть категорію";
//     if (!formData.countryId) newErrors.countryId = "Виберіть країну";
//     // ТИМЧАСОВО ВИМКНЕНО: перевірка регіону (API не працює)
//     // if (!formData.regionId) newErrors.regionId = "Виберіть область";
//     // Громада не обов'язкова!
//     if (!formData.locationName?.trim())
//       newErrors.locationName = "Введіть населений пункт";
//     if (formData.latitude === undefined || formData.longitude === undefined)
//       newErrors.latitude = "Вкажіть місцезнаходження на карті";
//     if (formData.images.length === 0)
//       newErrors.images = "Завантажте хоча б одне зображення";

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!validateForm()) return;

//     setIsUploading(true);

//     try {
//       const formDataToSubmit = new FormData();

//       // Базова інформація
//       formDataToSubmit.append("title", formData.title);
//       formDataToSubmit.append("description", formData.description);
//       formDataToSubmit.append("price", formData.price);
//       formDataToSubmit.append("currency", formData.currency);
//       formDataToSubmit.append("category", formData.categoryName);
//       formDataToSubmit.append("categoryId", formData.categoryId);

//       // Логування координат для діагностики
//       console.log("Координати для відправки на сервер:", {
//         latitude: formData.latitude,
//         longitude: formData.longitude,
//         useMyLocation: formData.useMyLocation,
//         userLatitude: geolocation.state.userLatitude,
//         userLongitude: geolocation.state.userLongitude,
//         note: "На сервер відправляються саме координати товару (latitude/longitude), не користувача"
//       });

//       if (formData.latitude !== undefined && formData.longitude !== undefined) {
//         formDataToSubmit.append("latitude", String(formData.latitude));
//         formDataToSubmit.append("longitude", String(formData.longitude));
//       }

//       formDataToSubmit.append("condition", formData.condition);
//       formDataToSubmit.append("brandId", formData.brandId);

//       const locationData = {
//         countryId: Number(formData.countryId),
//         // ТИМЧАСОВО: regionId опціональний (API не працює)
//         ...(formData.regionId ? { regionId: Number(formData.regionId) } : {}),
//         ...(formData.communityId
//           ? { communityId: Number(formData.communityId) }
//           : {}),
//         settlement: formData.locationName,
//       };
      
//       // Логування locationData
//       console.log("LocationData для відправки:", locationData);
      
//       formDataToSubmit.append("location", JSON.stringify(locationData));

//       formDataToSubmit.append("priceType", formData.priceType);
//       formDataToSubmit.append("vatIncluded", String(formData.vatIncluded));

//       // Логування всіх даних що відправляються
//       console.log("Всі дані форми:", Object.fromEntries(formDataToSubmit.entries()));

//       if (isMotorized) {
//         const hasFilledValues = Object.values(motorizedSpec).some((value) => {
//           if (value === null || value === undefined) return false;
//           if (typeof value === "string" && value.trim() === "") return false;
//           if (typeof value === "boolean" && value === false) return false;
//           return true;
//         });

//         if (hasFilledValues) {
//           const numericFields = [
//             "enginePower",
//             "enginePowerKw",
//             "fuelCapacity",
//             "numberOfGears",
//             "length",
//             "width",
//             "height",
//             "weight",
//             "wheelbase",
//             "groundClearance",
//             "workingWidth",
//             "capacity",
//             "liftCapacity",
//             "ptoSpeed",
//             "hydraulicFlow",
//             "hydraulicPressure",
//             "grainTankCapacity",
//             "headerWidth",
//             "threshingWidth",
//             "cleaningArea",
//             "engineHours",
//             "mileage",
//             "year",
//           ];

//           const cleanMotorizedSpec = { ...motorizedSpec };

//           Object.keys(cleanMotorizedSpec).forEach((key) => {
//             const typedKey = key as keyof typeof cleanMotorizedSpec;
//             const value = cleanMotorizedSpec[typedKey];

//             if (value === "") {
//               cleanMotorizedSpec[typedKey] = null;
//             } else if (
//               numericFields.includes(key) &&
//               typeof value === "string" &&
//               value.trim() !== ""
//             ) {
//               cleanMotorizedSpec[typedKey] = Number(value) as never;
//             }
//           });

//           formDataToSubmit.append(
//             "motorizedSpec",
//             JSON.stringify(cleanMotorizedSpec)
//           );
//         }
//       }

//       for (let i = 0; i < formData.images.length; i++) {
//         const file = formData.images[i];
//         if (file) {
//           formDataToSubmit.append("images", file);
//         }
//       }

//       const resultAction = await dispatch(createListing(formDataToSubmit));

//       if (createListing.fulfilled.match(resultAction)) {
//         navigate(`/listings/${resultAction.payload.id}`);
//       } else {
//         const errorMessage = handleApiError(resultAction.error);
//         alert(`Не вдалося створити оголошення: ${errorMessage}`);
//       }
//     } catch (error) {
//       const errorMessage = handleApiError(error);
//       alert(`Виникла помилка під час створення оголошення: ${errorMessage}`);
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   const handleUseMyLocationToggle = (checked: boolean) => {
//     setFormData((prev) => {
//       if (checked && geolocation.state.userLatitude && geolocation.state.userLongitude) {
//         // Якщо включаємо "моє місцезнаходження" і є координати користувача
//         // КОПІЮЄМО координати користувача до координат товару
//         return {
//           ...prev,
//           useMyLocation: true,
//           latitude: geolocation.state.userLatitude,
//           longitude: geolocation.state.userLongitude,
//         };
//       } else {
//         // Якщо відключаємо, просто змінюємо прапорець
//         // Координати товару залишаються як є (не перезаписуються)
//         return {
//           ...prev,
//           useMyLocation: false,
//           // НЕ змінюємо latitude і longitude - користувач може вибрати їх на карті
//         };
//       }
//     });
//   };

//   const requestGeolocation = () => {
//     geolocation.requestLocation();
//   };

//   // Синхронізуємо стан геолокації з formData
//   useEffect(() => {
//     if (geolocation.state.userLatitude !== undefined && geolocation.state.userLongitude !== undefined) {
//       setFormData(prev => ({
//         ...prev,
//         userLatitude: geolocation.state.userLatitude,
//         userLongitude: geolocation.state.userLongitude,
//       }));
//     }
//   }, [geolocation.state.userLatitude, geolocation.state.userLongitude]);

//   // Функція для обробки адреси з геокодування
//   const processGeocodeAddress = (
//     address: Record<string, string>, 
//     countries: { id: number; name: string; code: string; latitude?: number; longitude?: number }[]
//   ) => {
//     console.log("Обробка адреси:", address);
//     console.log("Доступні країни:", countries.map(c => `${c.name} (${c.code})`));
    
//     // Знаходимо країну
//     const country = countries.find(
//       (c) => {
//         const countryCodeMatch = c.code?.toLowerCase() === (address.country_code || "").toLowerCase();
//         const countryNameMatch = c.name?.toLowerCase() === (address.country || "").toLowerCase();
        
//         console.log(`Перевіряємо країну ${c.name} (${c.code}):`, {
//           codeMatch: countryCodeMatch,
//           nameMatch: countryNameMatch,
//           searchingCode: address.country_code,
//           searchingName: address.country
//         });
        
//         return countryCodeMatch || countryNameMatch;
//       }
//     );
    
//     if (!country) {
//       console.warn("Країну не знайдено для:", address.country_code, address.country);
//       console.warn("Доступні країни:", countries.map(c => `${c.name} (${c.code}) - ID: ${c.id}`));
//       return null;
//     }
    
//     console.log("✅ Знайдена країна:", country);
    
//     // Визначаємо населений пункт залежно від типу
//     let locationName = "";
    
//     // Пріоритет: місто -> містечко -> село -> передмістя -> район
//     const locationFields = [
//       'city', 'town', 'village', 'hamlet', 
//       'suburb', 'neighbourhood', 'quarter', 
//       'city_district', 'municipality'
//     ];
    
//     for (const field of locationFields) {
//       if (address[field]) {
//         locationName = address[field];
//         break;
//       }
//     }
    
//     // Визначаємо регіон/область залежно від країни
//     let regionName = "";
    
//     const countryCode = country.code?.toUpperCase();
    
//     switch (countryCode) {
//       case "UA": // Україна
//         regionName = address.state || address.region || address.province || "";
//         break;
//       case "PL": // Польща  
//         regionName = address.state || address.province || ""; // воєводство
//         break;
//       case "DE": // Німеччина
//         regionName = address.state || ""; // земля (bundesland)
//         break;
//       case "US": // США
//         regionName = address.state || ""; // штат
//         break;
//       case "RO": // Румунія
//         regionName = address.county || address.state || ""; // повіт
//         break;
//       case "FR": // Франція
//         regionName = address.state || address.region || ""; // регіон
//         break;
//       case "IT": // Італія
//         regionName = address.state || address.region || ""; // регіон
//         break;
//       case "ES": // Іспанія
//         regionName = address.state || address.region || ""; // автономна область
//         break;
//       case "GB": // Великобританія
//         regionName = address.county || address.state || "";
//         break;
//       case "CZ": // Чехія
//         regionName = address.state || address.region || ""; // край
//         break;
//       case "SK": // Словаччина
//         regionName = address.state || address.region || ""; // край
//         break;
//       case "HU": // Угорщина
//         regionName = address.county || address.state || ""; // медьє
//         break;
//       default: // Загальний випадок
//         regionName = address.state || address.region || address.province || address.county || "";
//         break;
//     }
    
//     console.log("Результат обробки:", {
//       country: country,
//       locationName,
//       regionName,
//       rawAddress: address
//     });
    
//     if (!locationName) {
//       console.warn("Населений пункт не знайдено у адресі:", address);
//     }
    
//     if (!regionName) {
//       console.warn("Регіон не знайдено у адресі:", address);
//     }
    
//     return {
//       country,
//       locationName,
//       regionName
//     };
//   };

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <h1 className="text-2xl font-bold text-gray-900 mb-6">
//         Створення нового оголошення
//       </h1>

//       <form onSubmit={handleSubmit} autoComplete="off">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           {/* Ліва колонка */}
//           <div className="space-y-6">
//             {/* Назва оголошення */}
//             <div>
//               <label
//                 htmlFor="title"
//                 className="block text-sm font-medium text-gray-700 mb-1"
//               >
//                 Назва оголошення *
//               </label>
//               <input
//                 type="text"
//                 id="title"
//                 name="title"
//                 value={formData.title}
//                 onChange={handleInputChange}
//                 placeholder="Наприклад: Трактор John Deere 6155M, 2020"
//                 className={`w-full px-4 py-2 border ${
//                   errors.title ? "border-red-500" : "border-gray-300"
//                 } rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500`}
//                 autoComplete="off"
//               />
//               {errors.title && (
//                 <p className="mt-1 text-sm text-red-500">{errors.title}</p>
//               )}
//             </div>

//             {/* Марка техніки */}
//             <BrandSelector
//               value={formData.brandId}
//               onChange={handleBrandSelect}
//               error={errors.brandId || ""}
//             />

//             {/* Опис */}
//             <div>
//               <label
//                 htmlFor="description"
//                 className="block text-sm font-medium text-gray-700 mb-1"
//               >
//                 Опис *
//               </label>
//               <textarea
//                 id="description"
//                 name="description"
//                 value={formData.description}
//                 onChange={handleInputChange}
//                 placeholder="Детальний опис товару, технічні характеристики, стан, комплектація тощо"
//                 rows={8}
//                 className={`w-full px-4 py-2 border ${
//                   errors.description ? "border-red-500" : "border-gray-300"
//                 } rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500`}
//                 autoComplete="off"
//               />
//               {errors.description && (
//                 <p className="mt-1 text-sm text-red-500">
//                   {errors.description}
//                 </p>
//               )}
//             </div>

//             {/* Ціна */}
//             <PriceInput
//               price={formData.price}
//               currency={formData.currency}
//               priceType={formData.priceType}
//               vatIncluded={formData.vatIncluded}
//               onChange={handleInputChange}
//               error={errors.price || ""}
//             />
//           </div>

//           {/* Права колонка */}
//           <div className="space-y-6">
//             {/* Категорія */}
//             <CategorySelector
//               value={formData.categoryId}
//               onChange={handleInputChange}
//               error={errors.categoryId || ""}
//             />

//             {/* Стан техніки */}
//             <div>
//               <label
//                 htmlFor="condition"
//                 className="block text-sm font-medium text-gray-700 mb-1"
//               >
//                 Стан техніки *
//               </label>
//               <div className="relative">
//                 <select
//                   id="condition"
//                   name="condition"
//                   value={formData.condition}
//                   onChange={handleInputChange}
//                   className="appearance-none w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
//                 >
//                   <option value="NEW">Нова</option>
//                   <option value="USED">Вживана</option>
//                 </select>
//               </div>
//             </div>

//             {/* Місцезнаходження товару */}
//             <div className="space-y-4">
//               <h3 className="text-lg font-medium text-gray-900">Місцезнаходження товару</h3>
              
//               {/* Тестер геолокації */}
//               <GeolocationTester onLocationReceived={(lat, lng) => {
//                 console.log("🧪 Отримані координати від тестера:", lat, lng);
//                 handleReverseGeocode(lat, lng, true);
//               }} />
              
//               {/* Індикатор стану геокодування */}
//               {geocodingStatus.isLoading && (
//                 <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
//                   <div className="flex items-center">
//                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
//                     <span className="text-sm text-yellow-800">Отримання адреси з координат...</span>
//                   </div>
//                 </div>
//               )}
              
//               {geocodingStatus.lastAttempt && !geocodingStatus.isLoading && (
//                 <div className={`p-3 rounded-md ${
//                   geocodingStatus.success 
//                     ? 'bg-green-50 border border-green-200' 
//                     : 'bg-red-50 border border-red-200'
//                 }`}>
//                   <div className="flex items-center">
//                     {geocodingStatus.success ? (
//                       <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
//                         <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                       </svg>
//                     ) : (
//                       <svg className="w-4 h-4 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
//                         <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
//                       </svg>
//                     )}
//                     <span className={`text-sm ${
//                       geocodingStatus.success ? 'text-green-800' : 'text-red-800'
//                     }`}>
//                       {geocodingStatus.success 
//                         ? `Адреса успішно отримана (${geocodingStatus.lastAttempt})`
//                         : `Не вдалося отримати адресу (${geocodingStatus.lastAttempt}). Ви можете ввести дані вручну.`
//                       }
//                     </span>
//                   </div>
//                 </div>
//               )}
              
//               {/* Діагностична панель (тільки в development) */}
//               <GeolocationDebugPanel
//                 formData={{
//                   useMyLocation: formData.useMyLocation,
//                   userLatitude: geolocation.state.userLatitude,
//                   userLongitude: geolocation.state.userLongitude,
//                   latitude: formData.latitude,
//                   longitude: formData.longitude,
//                   countryId: formData.countryId,
//                   regionId: formData.regionId,
//                   locationName: formData.locationName,
//                 }}
//                 countries={countries}
//                 onLocationChange={handleLocationChange}
//                 processGeocodeAddress={processGeocodeAddress}
//                 onForceGeocodeUpdate={(lat, lng) => handleReverseGeocode(lat, lng, true)}
//               />
              
//               {/* Компонент управління координатами */}
//               <CoordinatesDisplay
//                 useMyLocation={formData.useMyLocation}
//                 userLatitude={geolocation.state.userLatitude}
//                 userLongitude={geolocation.state.userLongitude}
//                 productLatitude={formData.latitude}
//                 productLongitude={formData.longitude}
//                 isLoadingLocation={geolocation.state.loading}
//                 onUseMyLocationToggle={handleUseMyLocationToggle}
//                 onRequestGeolocation={requestGeolocation}
//               />
//             </div>

//             {/* Локація */}
//             <LocationSelector
//               countries={countries}
//               data={{
//                 countryId: formData.countryId,
//                 regionId: formData.regionId,
//                 communityId: formData.communityId,
//                 locationName: formData.locationName,
//                 latitude: formData.latitude || 0,
//                 longitude: formData.longitude || 0,
//               }}
//               errors={{
//                 countryId: errors.countryId || "",
//                 regionId: errors.regionId || "",
//                 communityId: errors.communityId || "",
//                 locationName: errors.locationName || "",
//                 latitude: errors.latitude || "",
//               }}
//               onChange={handleLocationChange}
//               onMapClick={handleMapCoordinatesChange}
//               mapLoaded={mapLoaded}
//               useCountryCoordinates={true}
//             />

//             {/* Індикація автоматично заповнених полів */}
//             {(autoFilledFields.countryId || autoFilledFields.locationName) && (
//               <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
//                 <div className="flex items-center">
//                   <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
//                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                   </svg>
//                   <span className="font-medium">Автоматично заповнено на основі геолокації:</span>
//                 </div>
//                 <ul className="mt-1 ml-6 text-xs">
//                   {autoFilledFields.countryId && <li>• Країна</li>}
//                   {autoFilledFields.locationName && <li>• Населений пункт</li>}
//                 </ul>
//                 <p className="mt-2 text-xs text-gray-600">
//                   Ви можете змінити ці дані вручну, якщо вони неточні.
//                 </p>
//               </div>
//             )}

//             {/* Завантаження зображень */}
//             <ImageUploader
//               images={formData.images}
//               onChange={handleImagesChange}
//               onRemove={handleRemoveImage}
//               error={errors.images || ""}
//             />
//           </div>
//         </div>

//         {/* Технічні характеристики */}
//         <MotorizedSpecFormComponent
//           isMotorized={isMotorized}
//           motorizedSpec={motorizedSpec}
//           onChange={handleMotorizedSpecChange}
//         />

//         <div className="mt-8 flex items-center justify-end space-x-4">
//           <button
//             type="button"
//             onClick={() => navigate(-1)}
//             className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
//           >
//             Скасувати
//           </button>
//           <button
//             type="submit"
//             disabled={isLoading || isUploading}
//             className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
//           >
//             {isLoading || isUploading
//               ? "Публікація..."
//               : "Опублікувати оголошення"}
//           </button>
//         </div>
//       </form>
//     </div>
//   );

//   };

// export default CreateListingPage;