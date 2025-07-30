interface Country {
  id: number;
  name: string;
  code: string;
  latitude?: number;
  longitude?: number;
}

interface ProcessedAddress {
  country: Country;
  locationName: string;
  regionName: string;
  communityName: string; // Додаємо поле для громади/муніципалітету
}

/**
 * Мапа країн для покращеного розпізнавання
 */
const COUNTRY_MAPPING: Record<string, string[]> = {
  'UA': ['ukraine', 'україна', 'ua', 'ukr'],
  'PL': ['poland', 'польща', 'pl', 'pol'],
  'DE': ['germany', 'німеччина', 'de', 'ger', 'deu'],
  'RO': ['romania', 'румунія', 'ro', 'rou'],
  'HU': ['hungary', 'угорщина', 'hu', 'hun'],
  'SK': ['slovakia', 'словаччина', 'sk', 'svk'],
  'CZ': ['czech republic', 'czechia', 'чехія', 'cz', 'cze'],
  'MD': ['moldova', 'молдова', 'md', 'mda'],
  'BY': ['belarus', 'білорусь', 'by', 'blr'],
  'LT': ['lithuania', 'литва', 'lt', 'ltu'],
  'LV': ['latvia', 'латвія', 'lv', 'lva'],
  'EE': ['estonia', 'естонія', 'ee', 'est'],
};

/**
 * Обробляє адресу з геокодування та знаходить відповідну країну
 */
export const processGeocodeAddress = (
  address: Record<string, string>,
  countries: Country[]
): ProcessedAddress | null => {
  try {
    console.log('🔍 Початок обробки адреси геокодування:', address);
    console.log('🔍 Структура адреси:', Object.keys(address));
    console.log('🔍 Display name:', address.display_name);
    console.log('🔍 Всі поля адреси:', JSON.stringify(address, null, 2));
    
    // Пошук країни в адресі
    const countryName = address.country || address.country_code || '';
    if (!countryName) {
      console.warn('Країна не знайдена в адресі:', address);
      return null;
    }

    console.log('🔍 Пошук країни:', countryName, 'в списку:', countries.map(c => `${c.name} (${c.code})`));

    // Покращений пошук країни в списку доступних країн
    const country = countries.find(c => {
      const countryNameLower = countryName.toLowerCase();
      const countryCodeLower = c.code.toLowerCase();
      const countryDisplayNameLower = c.name.toLowerCase();
      
      // Пряме співпадіння назви або коду
      if (countryDisplayNameLower.includes(countryNameLower) || 
          countryCodeLower === countryNameLower) {
        return true;
      }
      
      // Пошук через мапу країн
      const mappings = COUNTRY_MAPPING[c.code.toUpperCase()];
      if (mappings && mappings.some(mapping => mapping === countryNameLower)) {
        return true;
      }
      
      return false;
    });

    if (!country) {
      console.warn('Країна не знайдена в списку доступних країн:', countryName);
      console.warn('Доступні країни:', countries.map(c => `${c.name} (${c.code})`));
      return null;
    }

    console.log('✅ Знайдена країна:', country);

    // Розширений пошук назви населеного пункту
    console.log('🏠 Доступні поля адреси для пошуку населеного пункту:', {
      city: address.city,
      town: address.town,
      village: address.village,
      hamlet: address.hamlet,
      locality: address.locality,
      municipality: address.municipality,
      suburb: address.suburb,
      city_district: address.city_district,
      district: address.district,
      county: address.county,
      state_district: address.state_district,
      postcode: address.postcode,
      road: address.road,
      house_number: address.house_number,
      display_name: address.display_name
    });

    console.log('🏛️ Доступні поля адреси для адміністративних одиниць:', {
      state: address.state,
      region: address.region,
      province: address.province,
      county: address.county,
      municipality: address.municipality,
      city_district: address.city_district,
      district: address.district,
      administrative: address.administrative
    });

    // Поліпшена логіка формування назви населеного пункту
    let locationName = '';
    
    // Спробуємо знайти населений пункт в порядку пріоритету
    const locationPriority = [
      address.city,
      address.town,
      address.village,
      address.hamlet,
      address.locality
    ];
    
    // Знаходимо перший непорожній населений пункт
    locationName = locationPriority.filter(Boolean)[0] || '';
    
    console.log('🔍 Перша спроба пошуку населеного пункту:', locationName);
    
    // Якщо не знайшли, пробуємо інші поля
    if (!locationName) {
      console.log('🔍 Друга спроба - пошук у вторинних полях');
      const secondaryPriority = [
        address.municipality,
        address.suburb,
        address.city_district,
        address.county
      ];
      locationName = secondaryPriority.filter(Boolean)[0] || '';
      console.log('🔍 Результат другої спроби:', locationName);
    }
    
    // Якщо все ще не знайшли, спробуємо розпарсити display_name
    if (!locationName && address.display_name) {
      console.log('🔍 Третя спроба - розбір display_name');
      const displayParts = address.display_name.split(',').map(part => part.trim());
      console.log('🔍 Розбираємо display_name:', displayParts);
      
      // Спеціальна логіка для українських адрес
      // Зазвичай структура: [вулиця], [населений пункт], [район], [область], [країна]
      if (displayParts.length >= 2) {
        // Пропускаємо першу частину, якщо вона схожа на вулицю або номер
        let startIndex = 0;
        const firstPart = displayParts[0];
        
        if (firstPart && (
          /^\d+/.test(firstPart) || // починається з числа
          firstPart.toLowerCase().includes('вулиця') ||
          firstPart.toLowerCase().includes('проспект') ||
          firstPart.toLowerCase().includes('бульвар') ||
          firstPart.toLowerCase().includes('площа') ||
          firstPart.toLowerCase().includes('street') ||
          firstPart.toLowerCase().includes('road')
        )) {
          startIndex = 1;
        }
        
        // Беремо наступну частину як населений пункт
        for (let i = startIndex; i < displayParts.length; i++) {
          const part = displayParts[i];
          
          // Перевіряємо чи part існує
          if (!part) continue;
          
          // Пропускаємо координати та країни
          if (!/^\d+\.\d+/.test(part) && 
              !COUNTRY_MAPPING[part.toUpperCase()] && 
              !part.toLowerCase().includes('україна') &&
              !part.toLowerCase().includes('ukraine') &&
              part.length > 2) {
            locationName = part;
            console.log('🔍 Знайдена назва з display_name:', locationName);
            break;
          }
        }
      }
    }
    
    // Якщо все ще порожньо, використовуємо більш розумний резерв
    if (!locationName) {
      console.log('🔍 Четверта спроба - розумний резерв');
      // Спробуємо взяти останню частину display_name (зазвичай найбільша адміністративна одиниця)
      if (address.display_name) {
        const parts = address.display_name.split(',').map(p => p.trim());
        console.log('🔍 Частини для резерву:', parts);
        
        // Беремо передостанню частину, якщо остання - це країна
        const lastPart = parts[parts.length - 1] || '';
        const secondLastPart = parts[parts.length - 2] || '';
        
        if (COUNTRY_MAPPING[lastPart.toUpperCase()] || lastPart.toLowerCase().includes('україна')) {
          locationName = secondLastPart || 'Невідоме місце';
        } else {
          locationName = lastPart || 'Невідоме місце';
        }
        console.log('🔍 Резервна назва:', locationName);
      } else {
        locationName = 'Невідоме місце';
      }
    }

    console.log('🏠 Обрана назва населеного пункту:', locationName);

    if (!locationName) {
      console.warn('Населений пункт не знайдений в адресі:', address);
      return null;
    }

    // Формування назви регіону (область/штат/провінція) з поліпшеним пошуком
    console.log('🔍 Пошук регіону в полях:', {
      state: address.state,
      region: address.region,
      province: address.province,
      county: address.county,
      'ISO3166-2-lvl4': address['ISO3166-2-lvl4'],
      'addr:state': address['addr:state']
    });

    const regionName = [
      address.state,
      address.region,
      address.province,
      address.county,
      address['ISO3166-2-lvl4'], // Додатковий стандарт ISO
      address['addr:state'] // OpenStreetMap адресна схема
    ].filter(Boolean)[0] || '';

    // Формування назви громади/муніципалітету/району з поліпшеним пошуком
    console.log('🔍 Пошук громади в полях:', {
      municipality: address.municipality,
      city_district: address.city_district,
      district: address.district,
      county: address.county,
      suburb: address.suburb,
      'addr:district': address['addr:district'],
      'addr:subdistrict': address['addr:subdistrict']
    });

    const communityName = [
      address.municipality,
      address.city_district,
      address.district,
      address.suburb,
      address['addr:district'], // OpenStreetMap адресна схема
      address['addr:subdistrict'], // Підрайон
      address.county
    ].filter(Boolean).find(item => item !== regionName) || '';

    console.log('🏛️ Знайдені адміністративні одиниці:', {
      regionName,
      communityName
    });

    return {
      country,
      locationName: locationName.trim(),
      regionName: regionName.trim(),
      communityName: communityName.trim()
    };
  } catch (error) {
    console.error('Помилка обробки адреси геокодування:', error);
    return null;
  }
};

/**
 * Перевіряє чи є координати валідними
 */
export const isValidCoordinates = (lat: number | null | undefined, lng: number | null | undefined): boolean => {
  return typeof lat === 'number' && typeof lng === 'number' && 
         lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

/**
 * Форматує координати для відображення
 */
export const formatCoordinates = (lat: number | null | undefined, lng: number | null | undefined): string => {
  if (!isValidCoordinates(lat, lng)) {
    return 'Невідомі координати';
  }
  return `${lat!.toFixed(6)}, ${lng!.toFixed(6)}`;
};
