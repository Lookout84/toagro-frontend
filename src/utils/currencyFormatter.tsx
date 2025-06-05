/**
 * Утиліти для форматування валюти
 */

/**
 * Форматування числа у грошовий формат UAH
 * @param amount - сума для форматування
 * @param options - додаткові опції форматування
 * @returns форматована сума у вигляді рядка
 */
export const formatCurrency = (
  amount: number | undefined,
  options?: {
    currency?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    locale?: string;
  }
): string => {
  if (amount === undefined || amount === null) {
    return '';
  }

  const {
    currency = 'UAH',
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
    locale = 'uk-UA',
  } = options || {};

  // Визначення символа валюти для особливих випадків
  const currencySymbol = 
    currency === 'UAH' ? '₴' : 
    currency === 'USD' ? '$' : 
    currency === 'EUR' ? '€' : '';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(amount);
  } catch (error) {
    // Якщо Intl.NumberFormat не підтримується або сталася помилка,
    // використовуємо запасний варіант
    const formattedNumber = amount.toFixed(maximumFractionDigits);
    return `${currencySymbol}${formattedNumber}`;
  }
};

/**
 * Форматування числа у грошовий формат без зазначення валюти (тільки число)
 * @param amount - сума для форматування
 * @param options - додаткові опції форматування
 * @returns форматована сума у вигляді рядка
 */
export const formatNumber = (
  amount: number | undefined,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    locale?: string;
  }
): string => {
  if (amount === undefined || amount === null) {
    return '';
  }

  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
    locale = 'uk-UA',
  } = options || {};

  try {
    return new Intl.NumberFormat(locale, {
      style: 'decimal',
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(amount);
  } catch (error) {
    // Запасний варіант
    return amount.toFixed(maximumFractionDigits);
  }
};

/**
 * Додає символ валюти до числа без використання Intl.NumberFormat
 * @param amount - сума для форматування
 * @param options - додаткові опції форматування
 * @returns форматована сума у вигляді рядка
 */
export const formatSimpleCurrency = (
  amount: number | undefined,
  options?: {
    currency?: string;
    decimals?: number;
  }
): string => {
  if (amount === undefined || amount === null) {
    return '';
  }

  const { currency = 'UAH', decimals = 0 } = options || {};

  const currencySymbol = 
    currency === 'UAH' ? '₴' : 
    currency === 'USD' ? '$' : 
    currency === 'EUR' ? '€' : '';

  const formattedNumber = amount.toFixed(decimals);
  
  // Для валют типу USD, EUR символ ставиться спереду
  if (currency === 'USD' || currency === 'EUR') {
    return `${currencySymbol}${formattedNumber}`;
  }
  
  // Для гривні (UAH) символ ставиться після числа з пробілом
  return `${formattedNumber} ${currencySymbol}`;
};

/**
 * Перетворює рядок з валютою у число
 * @param currencyString - рядок з сумою та символом валюти
 * @returns число або null, якщо перетворення неможливе
 */
export const parseCurrency = (currencyString: string): number | null => {
  if (!currencyString) return null;
  
  // Видаляємо всі символи валют та пробіли
  const cleanedString = currencyString
    .replace(/[₴$€\s]/g, '')
    .replace(/,/g, '.');
  
  const parsed = parseFloat(cleanedString);
  
  return isNaN(parsed) ? null : parsed;
};

export default {
  formatCurrency,
  formatNumber,
  formatSimpleCurrency,
  parseCurrency,
};