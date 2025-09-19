import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { listingsAPI } from "../api/apiClient";
import { Listing } from "./catalogSlice";
import { toast } from "react-toastify";

interface ListingState {
  currentListing: Listing | null;
  userListings: Listing[];
  similarListings: Listing[];
  isLoading: boolean;
  error: string | null;
}

// Початковий стан
const initialState: ListingState = {
  currentListing: null,
  userListings: [],
  similarListings: [],
  isLoading: false,
  error: null,
};

// Асинхронні thunks для запитів до API
export const fetchListingById = createAsyncThunk(
  "listing/fetchListingById",
  async (id: number, { rejectWithValue, dispatch }) => {
    try {
      console.log("🔍 Fetching listing with ID:", id);
      const response = await listingsAPI.getById(id);

      // Додаємо логування для перевірки структури відповіді
      console.log("📦 API response for listing:", response);

      let listing;
      // Перевіряємо структуру і використовуємо правильний шлях
      if (response.data && response.data.data && response.data.data.listing) {
        // API повертає { status, data: { listing: LISTING } }
        listing = response.data.data.listing;
        console.log("✅ Found listing in response.data.data.listing:", listing);
      } else if (response.data && response.data.data) {
        // Якщо дані приходять у вигляді { status, data: LISTING }
        listing = response.data.data;
        console.log("✅ Found listing in response.data.data:", listing);
      } else if (response.data && response.data.listing) {
        // Альтернативний шлях: { status, listing: LISTING }
        listing = response.data.listing;
        console.log("✅ Found listing in response.data.listing:", listing);
      } else if (response.data) {
        // Дані приходять прямо в полі data
        listing = response.data;
        console.log("✅ Found listing in response.data:", listing);
      } else {
        // Якщо структура зовсім інша
        console.error("❌ Unexpected API response structure:", response);
        return rejectWithValue("Неочікувана структура відповіді API");
      }

      if (!listing) {
        console.error("❌ No listing found in response");
        return rejectWithValue("Оголошення не знайдено");
      }

      console.log("🎯 Final listing object:", listing);

      // Якщо отримали оголошення і в ньому є userId, завантажуємо також інші оголошення цього користувача
      if (listing && listing.user && listing.user.id) {
        console.log("👤 Fetching user listings for user:", listing.user.id);
        try {
          dispatch(
            fetchUserListings({
              userId: listing.user.id,
              limit: 4,
              exclude: listing.id,
            })
          );
        } catch (userListingsError) {
          console.error(
            "⚠️ Не вдалося завантажити інші оголошення користувача:",
            userListingsError
          );
          // Продовжуємо виконання, навіть якщо не вдалося завантажити оголошення користувача
        }
      }

      return listing;
    } catch (error: unknown) {
      console.error("❌ Error fetching listing:", error);
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response
      ) {
        const data = error.response.data;
        const message =
          data && typeof data === "object" && "message" in data
            ? (data as { message?: string }).message
            : undefined;
        console.error("❌ API error message:", message);
        return rejectWithValue(
          message || "Помилка завантаження оголошення"
        );
      }
      return rejectWithValue("Помилка завантаження оголошення");
    }
  }
);

// Оновлюємо fetchUserListings, щоб він міг приймати параметри
export const fetchUserListings = createAsyncThunk(
  "listing/fetchUserListings",
  async (
    params: { userId: number; limit?: number; exclude?: number } | undefined,
    { rejectWithValue }
  ) => {
    try {
      let response;
      if (params && params.userId) {
        // Якщо передано userId, завантажуємо оголошення цього користувача
        response = await listingsAPI.getAll({
          userId: params.userId,
          limit: params.limit || 10,
          ...(params.exclude ? { exclude: params.exclude } : {}),
        });
      } else {
        // Інакше завантажуємо оголошення поточного користувача
        response = await listingsAPI.getUserListings();
      }

      // Обробляємо різні формати відповіді
      if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data.listings)
      ) {
        return response.data.data.listings;
      }
      if (response.data && Array.isArray(response.data.listings)) {
        return response.data.listings;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response
      ) {
        const data = error.response.data;
        const message =
          data && typeof data === "object" && "message" in data
            ? (data as { message?: string }).message
            : undefined;
        return rejectWithValue(message || "Помилка завантаження оголошень");
      }
      return rejectWithValue("Помилка завантаження оголошень");
    }
  }
);

// Створення оголошення
export const createListing = createAsyncThunk(
  "listing/createListing",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await listingsAPI.create(formData);
      
      // Логуємо успішну відповідь
      console.log("Listing created successfully:", response.data);
      
      return response.data.data || response.data;
    } catch (error: any) {
      // Детальніше логуємо помилки
      console.error("Create listing API error:", error);
      
      if (error.response) {
        console.error("Error response status:", error.response.status);
        console.error("Error response headers:", error.response.headers);
        console.error("Error response data:", error.response.data);
        
        // Логуємо весь об'єкт помилки
        console.error("Full error response object:", JSON.stringify(error.response.data, null, 2));
        
        return rejectWithValue({
          status: error.response.status,
          data: error.response.data,
          message: error.response.data?.message || "Помилка створення оголошення"
        });
      }
      
      return rejectWithValue("Помилка створення оголошення");
    }
  }
);
// export const createListing = createAsyncThunk(
//   "listings/create",
//   async (listingData: any, { rejectWithValue }) => {
//     try {
//       const response = await listingsAPI.create(listingData);
//       // Якщо API повертає { status, data: { listing: ... } }
//       if (response.data && response.data.data && response.data.data.listing) {
//         return response.data.data.listing;
//       }
//       // Якщо API повертає { status, listing: ... }
//       if (response.data && response.data.listing) {
//         return response.data.listing;
//       }
//       // Якщо API повертає просто об'єкт
//       return response.data;
//     } catch (error) {
//       return rejectWithValue(
//         (error as any).response?.data?.error || "Не вдалося створити оголошення"
//       );
//     }
//   }
// );

export const updateListing = createAsyncThunk(
  "listing/updateListing",
  async (
    { id, formData }: { id: number; formData: FormData },
    { rejectWithValue, dispatch }
  ) => {
    try {
      console.log(
        `Оновлення оголошення #${id} із ${formData.getAll("images").length} зображеннями`
      );

      if (process.env.NODE_ENV === "development") {
        console.log("FormData contents:");
        for (const pair of formData.entries()) {
          console.log(pair[0], pair[1]);
        }
      }

      const response = await listingsAPI.update(id, formData);
      console.log("Відповідь сервера:", response.data);

      // Оновлюємо дані оголошення після успішного оновлення
      if (response.data && response.data.data) {
        dispatch(setCurrentListing(response.data.data));
        return response.data.data;
      } else if (response.data && response.data.listing) {
        dispatch(setCurrentListing(response.data.listing));
        return response.data.listing;
      } else {
        dispatch(setCurrentListing(response.data));
        return response.data;
      }
    } catch (error: unknown) {
      console.error("Помилка при оновленні оголошення:", error);

      let errorMessage = "Помилка оновлення оголошення";

      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response
      ) {
        const responseData = error.response.data as {
          message?: string;
          error?: string;
        };
        if (responseData?.message) {
          errorMessage = responseData.message;
        } else if (responseData?.error) {
          errorMessage = responseData.error;
        }

        const statusCode =
          "status" in error.response ? error.response.status : "unknown";
        console.error(`Статус відповіді: ${statusCode}`, responseData);

        if ("status" in error.response && error.response.status === 401) {
          return rejectWithValue({
            message:
              "Авторизація закінчилась. Будь ласка, увійдіть знову, але НЕ втратьте дані.",
            authError: true,
          });
        }
      }

      return rejectWithValue({ message: errorMessage });
    }
  }
);

export const deleteListing = createAsyncThunk(
  "listing/deleteListing",
  async (id: number, { rejectWithValue }) => {
    try {
      await listingsAPI.delete(id);
      toast.success("Оголошення успішно видалено!");
      return id;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Помилка видалення оголошення";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// Створення Redux slice
const listingSlice = createSlice({
  name: "listing",
  initialState,
  reducers: {
    clearCurrentListing: (state) => {
      state.currentListing = null;
    },
    setCurrentListing: (state, action: PayloadAction<Listing>) => {
      state.currentListing = action.payload;
    },
    setSimilarListings: (state, action: PayloadAction<Listing[]>) => {
      state.similarListings = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Обробка результатів fetchListingById
    builder
      .addCase(fetchListingById.pending, (state) => {
        state.isLoading = true;
        state.currentListing = null;
      })
      .addCase(fetchListingById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentListing = action.payload;
      })
      .addCase(fetchListingById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Обробка результатів fetchUserListings
      .addCase(fetchUserListings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserListings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userListings = action.payload;
      })
      .addCase(fetchUserListings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Обробка результатів createListing
      .addCase(createListing.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createListing.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userListings.push(action.payload);
      })
      .addCase(createListing.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Обробка результатів updateListing
      .addCase(updateListing.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateListing.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentListing = action.payload;

        // Оновлюємо оголошення в списку оголошень користувача
        const index = state.userListings.findIndex(
          (listing) => listing.id === action.payload.id
        );
        if (index !== -1) {
          state.userListings[index] = action.payload;
        }
      })
      .addCase(updateListing.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          typeof action.payload === "string"
            ? action.payload
            : (action.payload as any)?.message ||
              "Помилка оновлення оголошення";
      })

      // Обробка результатів deleteListing
      .addCase(deleteListing.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteListing.fulfilled, (state, action) => {
        state.isLoading = false;

        // Видаляємо оголошення зі списку оголошень користувача
        state.userListings = state.userListings.filter(
          (listing) => listing.id !== action.payload
        );

        // Якщо видаляємо поточне оголошення, очищаємо його
        if (
          state.currentListing &&
          state.currentListing.id === action.payload
        ) {
          state.currentListing = null;
        }
      })
      .addCase(deleteListing.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentListing, setCurrentListing, setSimilarListings } =
  listingSlice.actions;
export default listingSlice.reducer;
