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
  // Маршрути аутентифікації
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    VERIFY_EMAIL: "/auth/verify/:token",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password/:token",
    PROFILE: "/auth/me",
    CHANGE_PASSWORD: "/auth/change-password",
  },

  // Маршрути оголошень
  LISTINGS: {
    BASE: "/listings",
    DETAIL: "/listings/:id",
    USER_LISTINGS: "/listings/user/me",
  },

  // Маршрути категорій
  CATEGORIES: {
    BASE: "/categories",
    DETAIL: "/categories/:id",
    BY_SLUG: "/categories/slug/:slug",
    TREE: "/categories/tree",
  },

  // Маршрути чату
  CHAT: {
    MESSAGES: "/chat/messages",
    CONVERSATIONS: "/chat/conversations",
    CONVERSATION_DETAIL: "/chat/conversations/:userId",
    MARK_AS_READ: "/chat/conversations/:userId/read",
    UNREAD_COUNT: "/chat/unread",
  },

  // Маршрути транзакцій
  TRANSACTIONS: {
    BASE: "/transactions",
    DETAIL: "/transactions/:transactionId",
    CALLBACK: "/transactions/callback",
  },

  // Маршрути сповіщень
  NOTIFICATIONS: {
    TEST_EMAIL: "/notifications/test-email",
    TEST_SMS: "/notifications/test-sms",
    TEST_PUSH: "/notifications/test-push",
    SETTINGS: "/notifications/settings",
    PREFERENCES: "/notifications/preferences",
    HISTORY: "/notifications/history",
    HISTORY_DETAIL: "/notifications/history/:id",
    MARK_ALL_READ: "/notifications/history/read",
    MARK_READ: "/notifications/history/:id/read",
    SEND: "/notifications/send",
    SEND_TEMPLATE: "/notifications/send-template",
    TEMPLATES: "/notifications/templates",
    TEMPLATE_DETAIL: "/notifications/templates/:id",
  },

  // Маршрути масових сповіщень
  BULK_NOTIFICATIONS: {
    EMAIL: "/bulk-notifications/email",
    SMS: "/bulk-notifications/sms",
    PUSH: "/bulk-notifications/push",
    TASKS: "/bulk-notifications/tasks",
    TASK_DETAIL: "/bulk-notifications/tasks/:id",
    ACTIVE_JOBS: "/bulk-notifications/active-jobs",
    FILTER_USERS: "/bulk-notifications/filter-users",
  },

  // Маршрути кампаній
  CAMPAIGNS: {
    BASE: "/campaigns",
    DETAIL: "/campaigns/:id",
    TYPES: "/campaigns/types",
    STATUSES: "/campaigns/statuses",
    ANALYTICS: "/campaigns/:id/analytics",
    TEST: "/campaigns/test",
    DUPLICATE: "/campaigns/:id/duplicate",
    ACTIVATE: "/campaigns/:id/activate",
    PAUSE: "/campaigns/:id/pause",
    CANCEL: "/campaigns/:id/cancel",
    MESSAGES: "/campaigns/:id/messages",
  },

  // Маршрути адміністратора
  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    USERS: "/admin/users",
    USER_ROLE: "/admin/users/:id/role",
    LISTINGS: "/admin/listings",
    PAYMENTS: "/admin/payments",
    CATEGORIES: "/admin/categories",
  },

  // Маршрути управління чергами
  QUEUES: {
    BASE: "/queues",
    LIST: "/queues/list",
    PURGE: "/queues/:queueName/purge",
    DETAIL: "/queues/:queueName",
    TEST: "/queues/:queueName/test",
    MESSAGES: "/queues/:queueName/messages",
    CONSUMERS: "/queues/consumers",
  },

  // Маршрути запланованих завдань
  SCHEDULED_TASKS: {
    LISTING_DEACTIVATION: "/scheduled-tasks/listing/:id/schedule-deactivation",
    PAYMENT_REMINDER: "/scheduled-tasks/payment/:id/reminder",
    TASK: "/scheduled-tasks/task",
    BATCH: "/scheduled-tasks/batch",
    RECURRING: "/scheduled-tasks/recurring",
    BASE: "/scheduled-tasks",
    DETAIL: "/scheduled-tasks/:id",
    TYPES: "/scheduled-tasks/types",
    RECURRING_DETAIL: "/scheduled-tasks/recurring/:id",
  },

  // Перевірка працездатності
  HEALTH: {
    CHECK: "/health",
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
