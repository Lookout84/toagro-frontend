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
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await listingsAPI.getById(id);

      // Додаємо логування для перевірки структури відповіді
      console.log("API response for listing:", response);

      // Перевіряємо структуру і використовуємо правильний шлях
      if (response.data && response.data.data) {
        // Якщо дані приходять у вигляді { data: { data: LISTING } }
        return response.data.data;
      } else if (response.data && response.data.listing) {
        // Альтернативний шлях: { data: { listing: LISTING } }
        return response.data.listing;
      } else if (response.data) {
        // Дані приходять прямо в полі data
        return response.data;
      } else {
        // Якщо структура зовсім інша
        console.error("Unexpected API response structure:", response);
        return rejectWithValue("Неочікувана структура відповіді API");
      }
    } catch (error: unknown) {
      // Обробка помилки залишається без змін
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response
      ) {
        return rejectWithValue(
          // @ts-expect-error: dynamic access
          error.response.data?.message || "Помилка завантаження оголошення"
        );
      }
      return rejectWithValue("Помилка завантаження оголошення");
    }
  }
);

export const fetchUserListings = createAsyncThunk(
  "listing/fetchUserListings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await listingsAPI.getUserListings();
      return response.data.data.listings;
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
        return rejectWithValue(
          message || "Помилка завантаження ваших оголошень"
        );
      }
      return rejectWithValue("Помилка завантаження ваших оголошень");
    }
  }
);

// Створення оголошення

export const createListing = createAsyncThunk(
  "listings/create",
  async (listingData: any, { rejectWithValue }) => {
    try {
      const response = await listingsAPI.create(listingData);
      return response.data.data.listing;
    } catch (error) {
      // Обробка помилок
      return rejectWithValue(
        (error as any).response?.data?.error || "Не вдалося створити оголошення"
      );
    }
  }
);

export const updateListing = createAsyncThunk(
  "listing/updateListing",
  async (
    { id, formData }: { id: number; formData: FormData },
    { rejectWithValue, dispatch }
  ) => {
    try {
      console.log(`Оновлення оголошення #${id} із ${formData.getAll('images').length} зображеннями`);
      
      // Для відлагодження FormData
      if (process.env.NODE_ENV === 'development') {
        console.log("FormData contents:");
        for (const pair of formData.entries()) {
          console.log(pair[0], pair[1]);
        }
      }

      const response = await listingsAPI.update(id, formData);
      console.log("Відповідь сервера:", response.data);
      
      // Оновлюємо дані оголошення після успішного оновлення
      dispatch(setCurrentListing(response.data.data || response.data));
      
      return response.data.data || response.data;
    } catch (error: unknown) {
      console.error("Помилка при оновленні оголошення:", error);
      
      // Додаємо більше інформації про помилку
      let errorMessage = "Помилка оновлення оголошення";
      
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response
      ) {
        const responseData = error.response.data as { message?: string; error?: string };
        if (responseData?.message) {
          errorMessage = responseData.message;
        } else if (responseData?.error) {
          errorMessage = responseData.error;
        }
        
        // Виводимо інформацію про статус для налагодження
        const statusCode = 'status' in error.response ? error.response.status : 'unknown';
        console.error(`Статус відповіді: ${statusCode}`, responseData);
        
        // Особлива обробка для помилки авторизації
        if ('status' in error.response && error.response.status === 401) {
          return rejectWithValue({
            message: "Авторизація закінчилась. Будь ласка, увійдіть знову, але НЕ втратьте дані.",
            authError: true
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
        state.currentListing = action.payload; // тут має бути саме оголошення
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
        state.error = action.payload as string;
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
  }
});

export const { clearCurrentListing, setCurrentListing, setSimilarListings } = listingSlice.actions;
export default listingSlice.reducer;
