import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { adminAPI } from "../api/apiClient";
import { User, Listing, Transaction, AdminDashboardStats } from "../types/api";

interface AdminState {
  dashboardStats: AdminDashboardStats | null;
  users: User[];
  adminListings: Listing[];
  adminPayments: Transaction[];
  usersMeta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  listingsMeta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  paymentsMeta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  dashboardStats: null,
  users: [],
  adminListings: [],
  adminPayments: [],
  usersMeta: {
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  },
  listingsMeta: {
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  },
  paymentsMeta: {
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  },
  isLoading: false,
  error: null,
};

// Асинхронні thunks для запитів до API
export const fetchDashboardStats = createAsyncThunk(
  "admin/fetchDashboardStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getDashboardStats();
      return response.data.data.stats;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Помилка завантаження статистики дашборду";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchAdminUsers = createAsyncThunk(
  "admin/fetchUsers",
  async (params: { page?: number; limit?: number; search?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getUsers(params);
      return response.data.data;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Помилка завантаження користувачів";
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateUserRole = createAsyncThunk(
  "admin/updateUserRole",
  async ({ userId, role }: { userId: number; role: string }, { rejectWithValue }) => {
    try {
      const response = await adminAPI.updateUserRole(userId, role);
      return response.data.data.user;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Помилка оновлення ролі користувача";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchAdminListings = createAsyncThunk(
  "admin/fetchListings",
  async (params: { page?: number; limit?: number; search?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getListings(params);
      return response.data.data;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Помилка завантаження оголошень";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchAdminPayments = createAsyncThunk(
  "admin/fetchPayments",
  async (params: { page?: number; limit?: number; search?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getPayments(params);
      return response.data.data;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error && error.message
          ? error.message
          : "Помилка завантаження платежів";
      return rejectWithValue(errorMessage);
    }
  }
);

// Створення Redux slice
const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    resetAdminState: (state) => {
      state.dashboardStats = null;
      state.users = [];
      state.adminListings = [];
      state.adminPayments = [];
      state.usersMeta.page = 1;
      state.listingsMeta.page = 1;
      state.paymentsMeta.page = 1;
    },
  },
  extraReducers: (builder) => {
    // Обробка fetchDashboardStats
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboardStats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

    // Обробка fetchAdminUsers
      .addCase(fetchAdminUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload.users;
        state.usersMeta = action.payload.meta;
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

    // Обробка updateUserRole
      .addCase(updateUserRole.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserRole.fulfilled, (state, action) => {
        state.isLoading = false;
        // Оновлюємо роль користувача в списку
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      .addCase(updateUserRole.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

    // Обробка fetchAdminListings
      .addCase(fetchAdminListings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminListings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.adminListings = action.payload.listings;
        state.listingsMeta = action.payload.meta;
      })
      .addCase(fetchAdminListings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

    // Обробка fetchAdminPayments
      .addCase(fetchAdminPayments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminPayments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.adminPayments = action.payload.transactions;
        state.paymentsMeta = action.payload.meta;
      })
      .addCase(fetchAdminPayments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetAdminState } = adminSlice.actions;

export default adminSlice.reducer;