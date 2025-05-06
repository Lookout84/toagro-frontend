import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { transactionsAPI } from "../api/apiClient";
import { Transaction, CreateTransactionRequest } from "../types/api";

interface TransactionsState {
  transactions: Transaction[];
  currentTransaction: Transaction | null;
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: TransactionsState = {
  transactions: [],
  currentTransaction: null,
  meta: {
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  },
  isLoading: false,
  error: null,
};

// Асинхронні thunks для запитів до API
export const fetchTransactions = createAsyncThunk(
  "transactions/fetchTransactions",
  async (params: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await transactionsAPI.getAll(params);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Помилка завантаження транзакцій"
      );
    }
  }
);

export const fetchTransactionById = createAsyncThunk(
  "transactions/fetchTransactionById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await transactionsAPI.getById(id);
      return response.data.data.transaction;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Помилка завантаження транзакції"
      );
    }
  }
);

export const createTransaction = createAsyncThunk(
  "transactions/createTransaction",
  async (transactionData: CreateTransactionRequest, { rejectWithValue }) => {
    try {
      const response = await transactionsAPI.create(transactionData);
      return response.data.data.transaction;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Помилка створення транзакції"
      );
    }
  }
);

// Створення Redux slice
const transactionsSlice = createSlice({
  name: "transactions",
  initialState,
  reducers: {
    resetTransactionState: (state) => {
      state.transactions = [];
      state.currentTransaction = null;
      state.meta.page = 1;
    },
    setCurrentTransaction: (state, action: PayloadAction<Transaction | null>) => {
      state.currentTransaction = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Обробка fetchTransactions
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions = action.payload.transactions;
        state.meta = action.payload.meta;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

    // Обробка fetchTransactionById
      .addCase(fetchTransactionById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTransactionById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTransaction = action.payload;
      })
      .addCase(fetchTransactionById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

    // Обробка createTransaction
      .addCase(createTransaction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTransaction = action.payload;
        // Додаємо нову транзакцію на початок списку, якщо список вже існує
        if (state.transactions.length > 0) {
          state.transactions.unshift(action.payload);
        }
      })
      .addCase(createTransaction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetTransactionState, setCurrentTransaction } = transactionsSlice.actions;

export default transactionsSlice.reducer;