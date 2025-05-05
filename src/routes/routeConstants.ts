// Константи маршрутів
export const ROUTES = {
  HOME: "/",
  CATALOG: "/catalog",
  CATALOG_BY_CATEGORY: "/catalog/:categorySlug",
  LISTING_DETAILS: "/listings/:id",
  CREATE_LISTING: "/listings/create",
  PROFILE: "/profile",
  PROFILE_LISTINGS: "/profile/listings",
  PROFILE_COMPARE: "/profile/compare",
  PROFILE_SETTINGS: "/profile/settings",
  CHAT: "/chat",
  CHAT_WITH_USER: "/chat/:userId",
  LOGIN: "/login",
  REGISTER: "/register",
};

// Функції для генерації шляхів з параметрами
export const generatePath = {
  catalogByCategory: (categorySlug: string) => `/catalog/${categorySlug}`,
  listingDetails: (id: number | string) => `/listings/${id}`,
  chatWithUser: (userId: number | string) => `/chat/${userId}`,
};
