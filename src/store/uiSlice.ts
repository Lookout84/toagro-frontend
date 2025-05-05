import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  theme: "light" | "dark";
  mobileMenuOpen: boolean;
  lastSearches: string[];
  compareItems: number[];
  notifications: {
    id: string;
    type: "info" | "success" | "warning" | "error";
    message: string;
    autoClose?: boolean;
  }[];
}

// Початковий стан
const initialState: UiState = {
  theme: "light",
  mobileMenuOpen: false,
  lastSearches: [],
  compareItems: [],
  notifications: [],
};

// Створення Redux slice
const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    // Переключення теми
    toggleTheme: (state) => {
      state.theme = state.theme === "light" ? "dark" : "light";
    },

    // Встановлення конкретної теми
    setTheme: (state, action: PayloadAction<"light" | "dark">) => {
      state.theme = action.payload;
    },

    // Відкриття/закриття мобільного меню
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },

    // Встановлення стану мобільного меню
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileMenuOpen = action.payload;
    },

    // Додавання пошукового запиту в історію
    addSearchTerm: (state, action: PayloadAction<string>) => {
      const searchTerm = action.payload;

      // Видалення дублікатів перед додаванням
      state.lastSearches = state.lastSearches.filter(
        (term) => term !== searchTerm,
      );

      // Додавання нового запиту на початок масиву
      state.lastSearches.unshift(searchTerm);

      // Обмеження кількості збережених запитів (максимум 10)
      if (state.lastSearches.length > 10) {
        state.lastSearches = state.lastSearches.slice(0, 10);
      }
    },

    // Очищення історії пошуку
    clearSearchHistory: (state) => {
      state.lastSearches = [];
    },

    // Додавання товару до порівняння
    addToCompare: (state, action: PayloadAction<number>) => {
      const itemId = action.payload;

      // Перевірка, чи товар вже в списку порівняння
      if (!state.compareItems.includes(itemId)) {
        // Обмеження кількості товарів для порівняння (максимум 3)
        if (state.compareItems.length < 3) {
          state.compareItems.push(itemId);
        }
      }
    },

    // Видалення товару з порівняння
    removeFromCompare: (state, action: PayloadAction<number>) => {
      const itemId = action.payload;
      state.compareItems = state.compareItems.filter((id) => id !== itemId);
    },

    // Очищення списку порівняння
    clearCompare: (state) => {
      state.compareItems = [];
    },

    // Додавання сповіщення
    addNotification: (
      state,
      action: PayloadAction<{
        type: "info" | "success" | "warning" | "error";
        message: string;
        autoClose?: boolean;
      }>,
    ) => {
      const id = Date.now().toString();
      state.notifications.push({
        id,
        ...action.payload,
        autoClose: action.payload.autoClose !== false, // За замовчуванням true
      });
    },

    // Видалення сповіщення
    removeNotification: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== id,
      );
    },

    // Очищення всіх сповіщень
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  toggleMobileMenu,
  setMobileMenuOpen,
  addSearchTerm,
  clearSearchHistory,
  addToCompare,
  removeFromCompare,
  clearCompare,
  addNotification,
  removeNotification,
  clearNotifications,
} = uiSlice.actions;

export default uiSlice.reducer;
