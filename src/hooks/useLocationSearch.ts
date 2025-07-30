import { useState, useCallback, useRef } from 'react';

export interface LocationSearchResult {
  displayName: string;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  country?: string;
  region?: string;
  type: 'city' | 'town' | 'village' | 'hamlet';
}

interface PhotonItem {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    name?: string;
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    country?: string;
    state?: string;
    osm_key?: string;
    osm_value?: string;
    osm_type?: string;
    extent?: [number, number, number, number];
  };
}

// Використовуємо публічний CORS-дружній API
const PHOTON_BASE_URL = 'https://photon.komoot.io';
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

export const useLocationSearch = () => {
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const searchLocations = useCallback(async (query: string, countryCode?: string) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 Пошук населених пунктів:', query, 'в країні:', countryCode);
      
      let data: { features: PhotonItem[] } | null = null;
      
      // Спочатку пробуємо Photon API
      try {
        const params = new URLSearchParams({
          q: query,
          limit: '8',
          lang: 'uk',
          ...(countryCode && { osm_tag: `place:city,place:town,place:village,place:hamlet` })
        });

        const response = await fetch(`${PHOTON_BASE_URL}/api?${params}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });

        if (response.ok) {
          data = await response.json();
        }
      } catch (_photonError) {
        console.log('⚠️ Photon API недоступний, використовуємо Nominatim fallback');
      }

      // Якщо Photon не спрацював, використовуємо Nominatim
      if (!data) {
        const params = new URLSearchParams({
          q: query,
          format: 'geojson',
          addressdetails: '1',
          limit: '8',
          'accept-language': 'uk,ru,en',
          ...(countryCode && { countrycodes: countryCode.toLowerCase() })
        });

        const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
          headers: {
            'User-Agent': 'ToAgro-Frontend/1.0'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        data = await response.json();
      }
      
      console.log('📍 Результати пошуку:', data);

      if (!data || !data.features) {
        setResults([]);
        return;
      }

      const processedResults: LocationSearchResult[] = data.features
        .filter((item: PhotonItem) => {
          // Фільтруємо тільки населені пункти
          const osmValue = item.properties.osm_value;
          return osmValue && ['city', 'town', 'village', 'hamlet'].includes(osmValue);
        })
        .map((item: PhotonItem) => {
          const props = item.properties;
          const [lng, lat] = item.geometry.coordinates;
          
          // Визначаємо тип населеного пункту
          let type: 'city' | 'town' | 'village' | 'hamlet' = 'village';
          if (props.osm_value === 'city') type = 'city';
          else if (props.osm_value === 'town') type = 'town';
          else if (props.osm_value === 'village') type = 'village';
          else if (props.osm_value === 'hamlet') type = 'hamlet';

          // Визначаємо назву населеного пункту
          const name = 
            props.name ||
            props.city ||
            props.town ||
            props.village ||
            props.hamlet ||
            'Невідомий населений пункт';

          const region = props.state;
          
          return {
            displayName: `${name}${region ? `, ${region}` : ''}${props.country ? `, ${props.country}` : ''}`,
            name: name,
            coordinates: {
              lat: lat,
              lng: lng
            },
            ...(props.country && { country: props.country }),
            ...(region && { region }),
            type
          };
        })
        .slice(0, 6); // Обмежуємо до 6 результатів

      setResults(processedResults);
      
    } catch (err) {
      console.error('❌ Помилка пошуку населених пунктів:', err);
      setError(err instanceof Error ? err.message : 'Невідома помилка пошуку');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const debouncedSearch = useCallback((query: string, countryCode?: string) => {
    // Очищуємо попередній таймер
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Встановлюємо новий таймер
    timeoutRef.current = setTimeout(() => {
      searchLocations(query, countryCode);
    }, 500);
  }, [searchLocations]);

  return {
    results,
    isLoading,
    error,
    searchLocations: debouncedSearch,
    clearResults: () => setResults([])
  };
};
