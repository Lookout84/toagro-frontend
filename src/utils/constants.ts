/**
 * Константи для використання в додатку
 */

// Пагінація
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  LISTINGS_PER_PAGE: 12,
  MAX_VISIBLE_PAGES: 5,
};

// Фільтри
export const FILTERS = {
  DEFAULT_SORT_BY: "createdAt",
  DEFAULT_SORT_ORDER: "desc" as "asc" | "desc",
  MAX_PRICE_INPUTS: 1000000,
};

// Порівняння товарів
export const COMPARE = {
  MAX_ITEMS: 3,
};

// Завантаження файлів
export const UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  MAX_IMAGES_PER_LISTING: 10,
};

// Валідація форм
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_TITLE_LENGTH: 100,
  MIN_TITLE_LENGTH: 5,
  MIN_DESCRIPTION_LENGTH: 20,
  MAX_DESCRIPTION_LENGTH: 2000,
};

// Повідомлення користувачу
export const MESSAGES = {
  // Успішні
  LOGIN_SUCCESS: "Вхід виконано успішно!",
  REGISTER_SUCCESS:
    "Реєстрація успішна! На вашу пошту надіслано лист для підтвердження.",
  LISTING_CREATED: "Оголошення успішно створено!",
  LISTING_UPDATED: "Оголошення успішно оновлено!",
  LISTING_DELETED: "Оголошення успішно видалено!",
  PROFILE_UPDATED: "Профіль успішно оновлено!",

  // Помилки
  LOGIN_ERROR: "Помилка входу. Перевірте логін та пароль.",
  REGISTER_ERROR: "Помилка реєстрації. Спробуйте ще раз.",
  LISTING_ERROR: "Помилка при роботі з оголошенням.",
  PROFILE_ERROR: "Помилка оновлення профілю.",
  NETWORK_ERROR: "Помилка мережі. Перевірте підключення до інтернету.",
  SERVER_ERROR: "Помилка сервера. Спробуйте пізніше.",

  // Підтвердження
  CONFIRM_DELETE:
    "Ви дійсно бажаєте видалити це оголошення? Цю дію неможливо скасувати.",
};

// API шляхи
export const API_PATHS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    PROFILE: "/auth/me",
    CHANGE_PASSWORD: "/auth/change-password",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
  },
  LISTINGS: {
    LIST: "/listings",
    DETAILS: "/listings/:id",
    USER_LISTINGS: "/listings/user/me",
  },
  CATEGORIES: {
    LIST: "/categories",
    TREE: "/categories/tree",
    BY_SLUG: "/categories/slug/:slug",
  },
  CHAT: {
    CONVERSATIONS: "/chat/conversations",
    MESSAGES: "/chat/conversations/:userId",
    SEND: "/chat/messages",
    READ: "/chat/conversations/:userId/read",
    UNREAD_COUNT: "/chat/unread",
  },
  TRANSACTIONS: {
    LIST: "/transactions",
    CREATE: "/transactions",
    DETAILS: "/transactions/:id",
  },
};

// Теми та кольори
export const THEMES = {
  LIGHT: "light",
  DARK: "dark",
};

// Стан авторизації
export const AUTH_STATUS = {
  LOADING: "loading",
  AUTHENTICATED: "authenticated",
  UNAUTHENTICATED: "unauthenticated",
};
