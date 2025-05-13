/**
 * Утиліти для форматування даних
 */

/**
 * Форматує ціну в гривнях
 * @param price - ціна для форматування
 * @returns форматована ціна з валютою
 */
// export function formatPrice(price: number): string {
//   return new Intl.NumberFormat("uk-UA", {
//     style: "currency",
//     currency: "UAH",
//     minimumFractionDigits: 0,
//     maximumFractionDigits: 0,
//   }).format(price);
// }

/**
 * Форматує дату в локальному форматі
 * @param dateString - дата у вигляді рядка або об'єкта Date
 * @param options - опції форматування
 * @returns форматована дата
 */
export function formatDate(
  dateString: string | Date,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  }
): string {
  const date =
    typeof dateString === "string" ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat("uk-UA", options).format(date);
}

/**
 * Форматує дату відносно поточного часу (наприклад, "5 хвилин тому")
 * @param dateString - дата у вигляді рядка або об'єкта Date
 * @returns відносний час
 */
export function formatRelativeTime(dateString: string | Date): string {
  const date =
    typeof dateString === "string" ? new Date(dateString) : dateString;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Менше хвилини
  if (diffInSeconds < 60) {
    return "щойно";
  }

  // Менше години
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${pluralize(diffInMinutes, "хвилина", "хвилини", "хвилин")} тому`;
  }

  // Менше доби
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${pluralize(diffInHours, "година", "години", "годин")} тому`;
  }

  // Менше тижня
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return "вчора";
  }
  if (diffInDays < 7) {
    return `${diffInDays} ${pluralize(diffInDays, "день", "дні", "днів")} тому`;
  }

  // Повна дата
  return formatDate(date);
}

/**
 * Форматує число в український формат
 * @param number - число для форматування
 * @returns форматоване число
 */
export function formatNumber(number: number): string {
  return new Intl.NumberFormat("uk-UA").format(number);
}

/**
 * Форматує розмір файлу в людиночитабельний формат
 * @param bytes - розмір в байтах
 * @param decimals - кількість десяткових знаків
 * @returns форматований розмір
 */
export function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Байт";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Байт", "КБ", "МБ", "ГБ", "ТБ"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Скорочує текст до вказаної довжини
 * @param text - текст для скорочення
 * @param maxLength - максимальна довжина
 * @param suffix - суфікс, який додається в кінці (за замовчуванням "...")
 * @returns скорочений текст
 */
export function truncateText(
  text: string,
  maxLength: number,
  suffix = "..."
): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Допоміжна функція для українських відмінків (для форматування відносного часу)
 * @param number - число
 * @param one - форма для 1
 * @param few - форма для 2-4
 * @param many - форма для 5-20
 * @returns правильна форма слова
 */
function pluralize(
  number: number,
  one: string,
  few: string,
  many: string
): string {
  if (number % 10 === 1 && number % 100 !== 11) {
    return one;
  }
  if ([2, 3, 4].includes(number % 10) && ![12, 13, 14].includes(number % 100)) {
    return few;
  }
  return many;
}

/**
 * Повертає символ валюти для заданого коду валюти
 * @param currency - код валюти (UAH, USD, EUR)
 * @returns символ валюти
 */
export function getCurrencySymbol(currency: string): string {
  switch (currency) {
    case "UAH":
      return "₴";
    case "USD":
      return "$";
    case "EUR":
      return "€";
    default:
      return "";
  }
}

/**
 * Форматує ціну в заданій валюті
 * @param price - ціна для форматування
 * @param currency - код валюти (UAH, USD, EUR)
 * @returns форматована ціна з валютою
 */
export function formatPrice(price: number, currency: string = "UAH"): string {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// /**
//  * Відображає ціну зі скороченим символом валюти
//  * @param price - ціна для форматування
//  * @param currency - код валюти (UAH, USD, EUR)
//  * @returns форматована ціна з символом валюти
//  */
// export function formatPriceWithSymbol(price: number | string, currency: string = "UAH"): string {
//   const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
//   if (isNaN(numericPrice)) return "";

//   const formattedNumber = new Intl.NumberFormat("uk-UA", {
//     minimumFractionDigits: 0,
//     maximumFractionDigits: 0,
//   }).format(numericPrice);

//   return `${formattedNumber} ${getCurrencySymbol(currency)}`;
// }
/**
 * Відображає ціну зі скороченим символом валюти
 * @param price - ціна для форматування
 * @param currency - код валюти (UAH, USD, EUR)
 * @returns форматована ціна з символом валюти
 */
// export function formatPriceWithSymbol(
//   price: number | string,
//   currency?: string
// ): string {
//   console.log("formatPriceWithSymbol called with:", price, currency);

//   // Переконуємось, що price є числом
//   const numericPrice = typeof price === "string" ? parseFloat(price) : price;
//   if (isNaN(numericPrice)) {
//     console.log("Invalid price");
//     return "Ціна не вказана";
//   }

//   console.log("Currency before normalization:", currency);

//   // ВИПРАВЛЕНО: Перевірка на undefined/null перед нормалізацією
//   const normalizedCurrency = currency ? String(currency).toUpperCase() : "UAH";

//   console.log("Normalized currency:", normalizedCurrency);

//   // Форматуємо число з роздільниками розрядів
//   const formattedNumber = new Intl.NumberFormat("uk-UA", {
//     minimumFractionDigits: 0,
//     maximumFractionDigits: 0,
//   }).format(numericPrice);

//   // Отримуємо символ валюти
//   let currencySymbol;
//   switch (normalizedCurrency) {
//     case "USD":
//       currencySymbol = "$";
//       break;
//     case "EUR":
//       currencySymbol = "€";
//       break;
//     case "UAH":
//     default:
//       currencySymbol = "₴";
//       break;
//   }

//   console.log("Final result:", `${formattedNumber} ${currencySymbol}`);

//   return `${formattedNumber} ${currencySymbol}`;
// }
/**
 * Форматує числове значення ціни з символом валюти
 */
export const formatPriceWithSymbol = (
  price: string | number,
  currencyCode = "UAH"
): string => {
  if (price === null || price === undefined) return "";

  // Нормалізуємо код валюти
  const normalizedCurrency = normalizeCurrency(currencyCode);

  // Перетворюємо price в число, якщо це рядок
  const numericPrice = typeof price === "string" ? parseFloat(price) : price;

  // Перевіряємо на NaN
  if (isNaN(numericPrice)) return "";

  try {
    // Використовуємо Intl.NumberFormat для правильного форматування
    return new Intl.NumberFormat("uk-UA", {
      style: "currency",
      currency: normalizedCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericPrice);
  } catch (error) {
    console.error(`Помилка форматування ціни ${price} ${currencyCode}:`, error);
    // Запасний варіант форматування
    return `${numericPrice.toLocaleString("uk-UA")} ${getCurrencySymbol(normalizedCurrency)}`;
  }
};

/**
 * Нормалізує код валюти до стандартного формату
 */
const normalizeCurrency = (currency?: string): string => {
  if (!currency) return "UAH";

  // Нормалізуємо та конвертуємо до верхнього регістру
  const normalized = currency.trim().toUpperCase();

  // Перевіряємо допустимі валюти
  if (["UAH", "USD", "EUR"].includes(normalized)) {
    return normalized;
  }

  return "UAH"; // За замовчуванням
};
