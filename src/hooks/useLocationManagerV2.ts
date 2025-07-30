import { useState, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';

// Типи для менеджера локації
export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface LocationData {
  countryId: string;
  countryName: string;
  regionId: string;
  regionName: string;
  communityId: string;
  communityName: string;
  locationName: string;
  coordinates: LocationCoordinates;
}

export interface LocationSource {
  type: 'user_browser' | 'user_map_click' | 'user_manual' | 'geocoding';
  timestamp: number;
  priority: number; // Вищий пріоритет = важливіше
}

export interface LocationState {
  // Поточні дані
  current: Partial<LocationData>;
  
  // Джерела даних для кожного поля
  sources: {
    coordinates?: LocationSource;
    country?: LocationSource;
    region?: LocationSource;
    community?: LocationSource;
    locationName?: LocationSource;
  };
  
  // Статуси
  isLoadingBrowserLocation: boolean;
  isGeocodingInProgress: boolean;
  
  // Налаштування
  useUserLocationByDefault: boolean;
  preserveManualInput: boolean; // Зберігати введені користувачем дані
}

// Пріоритети джерел даних
const SOURCE_PRIORITIES = {
  user_manual: 100,      // Найвищий пріоритет - користувач ввів вручну
  user_map_click: 80,    // Користувач обрав на карті
  user_browser: 60,      // Браузерна геолокація
  geocoding: 40,         // Автоматичне геокодування
} as const;

interface Countries {
  id: number;
  name: string;
  code: string;
  latitude?: number;
  longitude?: number;
}

interface GeocodeResponse {
  address: {
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    suburb?: string;
    county?: string;
    state?: string;
    region?: string;
    country?: string;
    country_code?: string;
  };
  display_name: string;
}

export const useLocationManager = (
  countries: Countries[] = [],
  initialState?: Partial<LocationState>
) => {
  const [state, setState] = useState<LocationState>({
    current: {},
    sources: {},
    isLoadingBrowserLocation: false,
    isGeocodingInProgress: false,
    useUserLocationByDefault: true,
    preserveManualInput: true,
    ...initialState,
  });

  const geocodingTimeoutRef = useRef<number | undefined>(undefined);

  // Утиліти для роботи з джерелами (мемоізовані)
  const createSource = useCallback((type: LocationSource['type']): LocationSource => ({
    type,
    timestamp: Date.now(),
    priority: SOURCE_PRIORITIES[type],
  }), []);

  const shouldUpdateField = useCallback((
    field: keyof typeof state.sources,
    newSource: LocationSource
  ): boolean => {
    const currentSource = state.sources[field];
    
    // Якщо поля немає - завжди оновлюємо
    if (!currentSource) return true;
    
    // Якщо включено збереження ручного вводу і поле було введено вручну
    if (state.preserveManualInput && currentSource.type === 'user_manual') {
      return newSource.type === 'user_manual'; // Оновлюємо тільки якщо знову ручний ввід
    }
    
    // Інакше порівнюємо пріоритети
    return newSource.priority >= currentSource.priority;
  }, [state]);

  // Функція геокодування з дебаунсом
  const geocodeCoordinates = useCallback(async (coords: LocationCoordinates) => {
    // Скасовуємо попередній запит
    if (geocodingTimeoutRef.current) {
      clearTimeout(geocodingTimeoutRef.current);
    }

    setState(prev => ({ ...prev, isGeocodingInProgress: true }));

    return new Promise<void>((resolve) => {
      geocodingTimeoutRef.current = window.setTimeout(async () => {
        try {
          const response = await axios.get<GeocodeResponse>(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=18&addressdetails=1`,
            {
              headers: { 'Accept-Language': 'uk' },
              timeout: 10000,
            }
          );

          const address = response.data.address;
          const source = createSource('geocoding');

          // Знаходимо країну
          const country = countries.find(c => 
            c.code?.toLowerCase() === address.country_code?.toLowerCase() ||
            c.name?.toLowerCase() === address.country?.toLowerCase()
          );

          setState(prev => {
            const newState = { ...prev };

            // Перевіряємо чи можемо оновити кожне поле
            const canUpdateCountry = !newState.sources.country || 
              shouldUpdateField('country', source);
            const canUpdateLocationName = !newState.sources.locationName || 
              shouldUpdateField('locationName', source);
            const canUpdateRegion = !newState.sources.region || 
              shouldUpdateField('region', source);
            const canUpdateCommunity = !newState.sources.community || 
              shouldUpdateField('community', source);

            // Оновлюємо дані тільки якщо вони мають пріоритет
            if (country && canUpdateCountry) {
              newState.current.countryId = String(country.id);
              newState.current.countryName = country.name;
              newState.sources.country = source;
            }

            // Населений пункт
            const locationName = address.city || address.town || address.village || 
                               address.hamlet || address.suburb || '';
            if (locationName && canUpdateLocationName) {
              newState.current.locationName = locationName;
              newState.sources.locationName = source;
            }

            // Регіон
            const regionName = address.state || address.region || '';
            if (regionName && canUpdateRegion) {
              newState.current.regionName = regionName;
              newState.sources.region = source;
            }

            // Громада (для України)
            if (country?.code === 'UA') {
              const communityName = address.county || '';
              if (communityName && canUpdateCommunity) {
                newState.current.communityName = communityName;
                newState.sources.community = source;
              }
            }

            newState.isGeocodingInProgress = false;
            return newState;
          });

          resolve();
        } catch (error) {
          console.warn('Помилка геокодування:', error);
          setState(prev => ({ ...prev, isGeocodingInProgress: false }));
          resolve();
        }
      }, 500); // Дебаунс 500мс
    });
  }, [countries, createSource, shouldUpdateField]);

  // Дії з мемоізацією
  const actions = useMemo(() => ({
    setCoordinatesFromBrowser: (coords: LocationCoordinates) => {
      const source = createSource('user_browser');
      
      setState(prev => {
        const canUpdate = !prev.sources.coordinates || 
          shouldUpdateField('coordinates', source);
        
        if (canUpdate) {
          const newState = {
            ...prev,
            current: {
              ...prev.current,
              coordinates: coords,
            },
            sources: {
              ...prev.sources,
              coordinates: source,
            },
          };
          
          // Автоматичне геокодування якщо включено
          if (prev.useUserLocationByDefault) {
            geocodeCoordinates(coords);
          }
          
          return newState;
        }
        
        return prev;
      });
    },

    setCoordinatesFromMap: (coords: LocationCoordinates) => {
      const source = createSource('user_map_click');
      
      setState(prev => ({
        ...prev,
        current: {
          ...prev.current,
          coordinates: coords,
        },
        sources: {
          ...prev.sources,
          coordinates: source,
        },
      }));
      
      // Завжди геокодуємо при кліку на карті
      geocodeCoordinates(coords);
    },

    setManualField: (field: keyof LocationData, value: string) => {
      const source = createSource('user_manual');
      
      setState(prev => ({
        ...prev,
        current: {
          ...prev.current,
          [field]: value,
        },
        sources: {
          ...prev.sources,
          [field === 'countryId' || field === 'countryName' ? 'country' :
           field === 'regionId' || field === 'regionName' ? 'region' :
           field === 'communityId' || field === 'communityName' ? 'community' :
           field === 'locationName' ? 'locationName' : field]: source,
        },
      }));
    },

    requestBrowserLocation: async () => {
      setState(prev => ({ ...prev, isLoadingBrowserLocation: true }));
      
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 300000, // 5 хвилин кеш
          });
        });

        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        actions.setCoordinatesFromBrowser(coords);
      } catch (error) {
        console.warn('Помилка отримання геолокації:', error);
      } finally {
        setState(prev => ({ ...prev, isLoadingBrowserLocation: false }));
      }
    },

    forceGeocode: async (coords: LocationCoordinates) => {
      // Тимчасово відключаємо збереження ручного вводу
      const preserveOriginal = state.preserveManualInput;
      setState(prev => ({ ...prev, preserveManualInput: false }));
      
      await geocodeCoordinates(coords);
      
      // Відновлюємо налаштування
      setState(prev => ({ ...prev, preserveManualInput: preserveOriginal }));
    },

    reset: () => {
      setState({
        current: {},
        sources: {},
        isLoadingBrowserLocation: false,
        isGeocodingInProgress: false,
        useUserLocationByDefault: true,
        preserveManualInput: true,
      });
    },

    setUseUserLocationByDefault: (use: boolean) => {
      setState(prev => ({ ...prev, useUserLocationByDefault: use }));
    },

    setPreserveManualInput: (preserve: boolean) => {
      setState(prev => ({ ...prev, preserveManualInput: preserve }));
    },
  }), [createSource, shouldUpdateField, geocodeCoordinates, state.preserveManualInput]);

  return {
    state,
    actions,
    // Зручні геттери
    coordinates: state.current.coordinates,
    isLocationReady: !!(state.current.coordinates?.latitude && state.current.coordinates?.longitude),
    hasManualInput: Object.values(state.sources).some(source => source?.type === 'user_manual'),
  };
};

export default useLocationManager;
