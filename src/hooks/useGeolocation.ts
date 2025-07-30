import { useState, useCallback } from 'react';

interface GeolocationState {
  userLatitude: number | null;
  userLongitude: number | null;
  loading: boolean;
  error: GeolocationPositionError | null;
}

interface GeolocationHook {
  state: GeolocationState;
  requestLocation: () => void;
  clearError: () => void;
}

export const useGeolocation = (): GeolocationHook => {
  const [state, setState] = useState<GeolocationState>({
    userLatitude: null,
    userLongitude: null,
    loading: false,
    error: null,
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.warn('Геолокація не підтримується цим браузером');
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('Геолокація успішна:', { latitude, longitude });
        
        setState({
          userLatitude: latitude,
          userLongitude: longitude,
          loading: false,
          error: null,
        });
      },
      (error) => {
        console.warn('Помилка геолокації:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000, // 5 хвилин
      }
    );
  }, []);

  return {
    state,
    requestLocation,
    clearError,
  };
};

// Хук для зворотного геокодування з резервними варіантами
export const useReverseGeocode = () => {
  const [loading, setLoading] = useState(false);

  // Функція з таймаутом для fetch з покращеною обробкою помилок
  const fetchWithTimeout = async (url: string, timeout: number = 10000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`⏰ Таймаут ${timeout}ms для URL: ${url}`);
      controller.abort();
    }, timeout);
    
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Toagro/1.0 (https://toagro.com)',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Поліпшена обробка різних типів помилок
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.warn(`🚫 Запит скасовано (timeout ${timeout}ms): ${url}`);
          throw new Error(`Таймаут запиту (${timeout}ms)`);
        } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          console.warn(`🌐 Мережева помилка: ${url}`);
          throw new Error('Мережева помилка');
        } else {
          console.warn(`❌ Помилка fetch: ${error.message}`);
          throw error;
        }
      }
      
      throw error;
    }
  };

  const geocodeCoordinates = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    
    console.log(`🌍 Початок геокодування для координат: ${lat}, ${lng}`);
    
    // Список резервних сервісів геокодування з різними таймаутами
    const geocodingServices = [
      {
        name: 'Nominatim OSM',
        url: `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=uk,en`,
        timeout: 8000,
        parseResponse: (data: unknown) => data
      },
      {
        name: 'Photon Komoot',
        url: `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&lang=uk`,
        timeout: 6000,
        parseResponse: (data: unknown) => {
          // Перетворюємо відповідь Photon у формат Nominatim
          const photonData = data as { features?: Array<{ properties?: Record<string, unknown> }> };
          if (photonData.features && photonData.features[0]) {
            const feature = photonData.features[0];
            return {
              address: feature.properties || {},
              display_name: (feature.properties?.name as string) || `${lat}, ${lng}`
            };
          }
          return null;
        }
      },
      {
        name: 'Nominatim Qwant',
        url: `https://nominatim.qwant.com/v1/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=uk,en`,
        timeout: 10000,
        parseResponse: (data: unknown) => data
      }
    ];

    let lastError: Error | null = null;

    // Пробуємо кожний сервіс по черзі
    for (const service of geocodingServices) {
      try {
        console.log(`🌐 Спроба геокодування через ${service.name} (timeout: ${service.timeout}ms):`, service.url);
        
        const response = await fetchWithTimeout(service.url, service.timeout);
        
        if (!response.ok) {
          const errorMsg = `HTTP ${response.status}: ${response.statusText}`;
          console.warn(`❌ ${service.name} HTTP помилка:`, errorMsg);
          throw new Error(errorMsg);
        }
        
        const rawResult = await response.json();
        console.log(`📝 Сира відповідь від ${service.name}:`, rawResult);
        
        const result = service.parseResponse(rawResult) as { address?: unknown; display_name?: string } | null;
        
        if (result && (result.address || result.display_name)) {
          console.log(`✅ Геокодування успішне через ${service.name}:`, result);
          setLoading(false);
          return result;
        } else {
          console.warn(`⚠️ Порожня відповідь від ${service.name}:`, rawResult);
          throw new Error(`Порожня відповідь від ${service.name}`);
        }
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Невідома помилка';
        console.warn(`❌ Помилка ${service.name}:`, errorMsg);
        lastError = error instanceof Error ? error : new Error(errorMsg);
        
        // Якщо це не останній сервіс, продовжуємо
        if (service !== geocodingServices[geocodingServices.length - 1]) {
          console.log(`🔄 Переходимо до наступного сервісу...`);
          await new Promise(resolve => setTimeout(resolve, 500)); // Коротка пауза між запитами
          continue;
        }
      }
    }

    // Якщо всі сервіси не спрацювали, повертаємо мок-дані
    console.error('❌ Всі сервіси геокодування не спрацювали:', lastError?.message || 'Невідома помилка');
    
    // Повертаємо базові дані з координатами
    const mockResult = {
      address: {
        country: 'Україна',
        country_code: 'ua',
        city: `Місто ${lat.toFixed(2)}`,
        state: 'Невідома область'
      },
      display_name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      lat: lat.toString(),
      lon: lng.toString()
    };
    
    console.log('🔧 Використовуємо резервні дані:', mockResult);
    setLoading(false);
    return mockResult;
    
  }, []);

  return {
    geocodeCoordinates,
    loading,
  };
};
