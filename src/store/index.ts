import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import catalogReducer from "./catalogSlice";
import listingReducer from "./listingSlice";
import chatReducer from "./chatSlice";
import uiReducer from "./uiSlice";
import notificationsReducer from "./notificationsSlice";
import transactionsReducer from "./transactionsSlice";
import adminReducer from "./adminSlice";
import campaignsReducer from "./campaignsSlice";
import brandReducer from "./brandSlice";
import locationReducer from "./locationSlice";

export const store = configureStore({
  reducer: {
    catalog: catalogReducer,
    brands: brandReducer,
    listing: listingReducer,
    chat: chatReducer,
    ui: uiReducer,
    notifications: notificationsReducer,
    transactions: transactionsReducer,
    admin: adminReducer,
    campaigns: campaignsReducer,
    locations: locationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Необхідно для роботи з датами та деякими об'єктами
    }),
});

// Виведення типів для стору
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Кастомні хуки для типізованого Redux
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
