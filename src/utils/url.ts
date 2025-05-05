/**
 * Утиліти для роботи з URL та маршрутами
 */

/**
 * Генерує URL з параметрами запиту
 * @param baseUrl - базовий URL
 * @param params - параметри запиту у вигляді об'єкта
 * @returns URL з параметрами запиту
 */
export function buildUrl(
  baseUrl: string,
  params: Record<string, any> = {},
): string {
  const url = new URL(baseUrl, window.location.origin);

  // Додаємо параметри до URL
  Object.entries(params).forEach(([key, value]) => {
    // Пропускаємо undefined та null
    if (value === undefined || value === null) {
      return;
    }

    // Додаємо параметр до URL
    url.searchParams.append(key, String(value));
  });

  return url.toString();
}

/**
 * Розбирає параметри запиту з URL
 * @param search - рядок параметрів запиту (window.location.search)
 * @returns об'єкт з параметрами запиту
 */
export function parseQueryParams(search: string): Record<string, string> {
  const searchParams = new URLSearchParams(search);
  const params: Record<string, string> = {};

  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return params;
}

/**
 * Генерує маршрут з параметрами
 * @param route - шаблон маршруту (наприклад, "/listings/:id")
 * @param params - параметри маршруту
 * @returns маршрут з підставленими параметрами
 */
export function generatePath(
  route: string,
  params: Record<string, string | number> = {},
): string {
  let path = route;

  // Заміняємо параметри в шляху
  Object.entries(params).forEach(([key, value]) => {
    path = path.replace(`:${key}`, String(value));
  });

  return path;
}

/**
 * Перевіряє, чи поточний шлях співпадає з шаблоном
 * @param pathname - поточний шлях
 * @param pattern - шаблон для перевірки
 * @param exact - точна відповідність (без підшляхів)
 * @returns true, якщо шлях співпадає з шаблоном
 */
export function matchPath(
  pathname: string,
  pattern: string,
  exact = false,
): boolean {
  // Очищаємо шлях від кінцевого слешу
  const normalizedPath =
    pathname.endsWith("/") && pathname !== "/"
      ? pathname.slice(0, -1)
      : pathname;

  // Замінюємо параметри в шаблоні на регулярний вираз
  const patternRegex = pattern
    .replace(/:[^/]+/g, "([^/]+)") // Заміна :param на захоплюючу групу
    .replace(/\//g, "\\/"); // Екранування слешів

  // Створюємо регулярний вираз
  const regex = exact
    ? new RegExp(`^${patternRegex}$`)
    : new RegExp(`^${patternRegex}(?:\\/.*)?$`);

  return regex.test(normalizedPath);
}

/**
 * Отримує базовий домен з URL
 * @param url - URL для обробки
 * @returns базовий домен
 */
export function getDomainFromUrl(url: string): string {
  try {
    const { hostname } = new URL(url);
    // Видаляємо www. якщо присутній
    return hostname.replace(/^www\./, "");
  } catch (e) {
    return "";
  }
}

/**
 * Перевіряє, чи є URL зовнішнім
 * @param url - URL для перевірки
 * @returns true, якщо URL є зовнішнім
 */
export function isExternalUrl(url: string): boolean {
  if (!url) return false;

  // Якщо URL починається з протоколу, він вважається зовнішнім
  if (/^https?:\/\//.test(url)) {
    try {
      const { hostname } = new URL(url);
      // URL є зовнішнім, якщо домен відрізняється від поточного
      return hostname !== window.location.hostname;
    } catch (e) {
      return false;
    }
  }

  // URL без протоколу вважається внутрішнім
  return false;
}
