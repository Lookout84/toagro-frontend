# Нова система визначення локації

## Проблеми старої системи

1. **Складні useEffect ланцюжки** - викликали безліч перерендерів і втрату даних
2. **Ручне управління станом** - легко було втратити введені користувачем дані
3. **Змішана логіка** - геолокація, геокодування і форма в одному місці
4. **Відсутність централізованого керування** - різні компоненти керували одними даними
5. **Проблема збереження ручного вводу** - автоматичне геокодування стирало дані користувача

## Новий підхід - Location State Manager

### Архітектура

```
useLocationManagerV2 (хук)
    ↓
LocationManager (UI компонент)
    ↓
LocationWithMap (інтегрований компонент з картою)
    ↓
CreateListingPageV2 (приклад використання)
```

### Ключові особливості

#### 1. **Пріоритетна система джерел даних**
- `user_manual: 100` - Найвищий пріоритет (користувач ввів вручну)
- `user_map_click: 80` - Користувач обрав на карті
- `user_browser: 60` - Браузерна геолокація
- `geocoding: 40` - Автоматичне геокодування

#### 2. **Захист ручного вводу**
- Коли `preserveManualInput = true`, поля введені вручну не перезаписуються
- Можна форсувати оновлення через `forceGeocode()`
- Візуальні індикатори джерела кожного поля

#### 3. **Дебаунс і оптимізація**
- Геокодування з дебаунсом 500мс
- Скасування попередніх запитів
- Мемоізація функцій через `useCallback` і `useMemo`

#### 4. **Чіткі стани і переходи**
- `isLoadingBrowserLocation` - завантаження геолокації
- `isGeocodingInProgress` - процес геокодування
- Відстеження джерел для кожного поля

## Використання

### Базове використання

```tsx
import LocationWithMap from '../components/ui/LocationWithMap';

const MyForm = () => {
  const [formData, setFormData] = useState({
    countryId: '',
    locationName: '',
    latitude: undefined,
    longitude: undefined,
    useMyLocation: true,
  });

  const handleLocationChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <LocationWithMap
      countries={countries}
      value={formData}
      onChange={handleLocationChange}
      mapLoaded={mapLoaded}
      showDebugInfo={true} // Для розробки
    />
  );
};
```

### Розширене використання хука

```tsx
import { useLocationManager } from '../hooks/useLocationManagerV2';

const MyComponent = () => {
  const locationManager = useLocationManager(countries, {
    preserveManualInput: true,
    useUserLocationByDefault: true,
  });

  const { state, actions, coordinates, isLocationReady } = locationManager;

  // Автоматичний запит геолокації
  useEffect(() => {
    actions.requestBrowserLocation();
  }, []);

  // Обробка кліку на карті
  const handleMapClick = (coords) => {
    actions.setCoordinatesFromMap(coords);
  };

  // Ручний ввід
  const handleManualInput = (field, value) => {
    actions.setManualField(field, value);
  };

  return (
    <div>
      {/* Ваш UI */}
    </div>
  );
};
```

## API хука useLocationManagerV2

### State (стан)
```tsx
interface LocationState {
  current: Partial<LocationData>;        // Поточні дані
  sources: Record<string, LocationSource>; // Джерела кожного поля
  isLoadingBrowserLocation: boolean;     // Завантаження геолокації
  isGeocodingInProgress: boolean;        // Процес геокодування
  useUserLocationByDefault: boolean;     // Використовувати геолокацію за замовчуванням
  preserveManualInput: boolean;          // Захищати ручний ввід
}
```

### Actions (дії)
```tsx
interface LocationActions {
  setCoordinatesFromBrowser: (coords) => void;   // Координати з браузера
  setCoordinatesFromMap: (coords) => void;       // Координати з карти
  setManualField: (field, value) => void;        // Ручний ввід поля
  requestBrowserLocation: () => Promise<void>;   // Запит геолокації
  forceGeocode: (coords) => Promise<void>;       // Форсоване геокодування
  reset: () => void;                             // Скидання стану
  setUseUserLocationByDefault: (use) => void;    // Налаштування автозапиту
  setPreserveManualInput: (preserve) => void;    // Налаштування захисту
}
```

### Helpers (допоміжні)
```tsx
const {
  coordinates,          // Поточні координати
  isLocationReady,      // Чи готові координати
  hasManualInput,       // Чи є ручний ввід
} = useLocationManager();
```

## Переваги нової системи

1. **Збереження даних користувача** - ручний ввід не губиться
2. **Прозорість** - видно звідки походить кожне поле
3. **Продуктивність** - оптимізовані запити, дебаунс
4. **Тестування** - легко тестувати через чіткі стани
5. **Розширюваність** - легко додавати нові джерела даних
6. **Надійність** - обробка помилок, timeout'и

## Тестування

Для тестування використовуйте `CreateListingPageV2.tsx` з увімкненим `showDebugInfo={true}`.

Debug панель показує:
- Поточні координати
- Джерело кожного поля
- Стан захисту ручного вводу
- Статус геокодування

## Міграція зі старої системи

1. Замініть `useGeolocation` на `useLocationManagerV2`
2. Замініть `LocationSelector` на `LocationWithMap` 
3. Видаліть складні `useEffect` для геолокації
4. Перенесіть логіку обробки змін до `handleLocationChange`

## Приклади сценаріїв

### Сценарій 1: Автоматична геолокація
1. Користувач заходить на сторінку
2. Автоматично запитується геолокація
3. Координати геокодуються → заповнюється країна і місто
4. Користувач може змінити дані вручну

### Сценарій 2: Ручний ввід з захистом
1. Користувач вводить місто вручну
2. Потім дозволяє геолокацію
3. Геолокація НЕ перезаписує введене місто
4. Координати оновлюються, але місто залишається

### Сценарій 3: Клік по карті
1. Користувач клікає на карті
2. Координати оновлюються миттєво
3. Запускається геокодування для нових координат
4. Заповнюються поля країни і міста

Ця система вирішує всі проблеми попередньої реалізації і забезпечує надійну роботу з локацією.
