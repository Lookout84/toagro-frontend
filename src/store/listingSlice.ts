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
      return response.data.data.listing;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Помилка завантаження оголошення",
      );
    }
  },
);

export const fetchUserListings = createAsyncThunk(
  "listing/fetchUserListings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await listingsAPI.getUserListings();
      return response.data.data.listings;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Помилка завантаження ваших оголошень",
      );
    }
  },
);

export const createListing = createAsyncThunk(
  "listing/createListing",
  async (formData: any, { rejectWithValue }) => {
    try {
      const response = await listingsAPI.create(formData);
      toast.success("Оголошення успішно створено!");
      return response.data.data.listing;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Помилка створення оголошення";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  },
);

export const updateListing = createAsyncThunk(
  "listing/updateListing",
  async (
    { id, formData }: { id: number; formData: any },
    { rejectWithValue },
  ) => {
    try {
      const response = await listingsAPI.update(id, formData);
      toast.success("Оголошення успішно оновлено!");
      return response.data.data.listing;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Помилка оновлення оголошення";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  },
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
  },
);

// Створення Redux slice
const listingSlice = createSlice({
  name: "listing",
  initialState,
  reducers: {
    clearCurrentListing: (state) => {
      state.currentListing = null;
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
        state.error = null;
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
          (listing) => listing.id === action.payload.id,
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
          (listing) => listing.id !== action.payload,
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

export const { clearCurrentListing, setSimilarListings } = listingSlice.actions;
export default listingSlice.reducer;
