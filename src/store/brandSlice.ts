import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { brandsAPI } from "../api/apiClient";
import { Brand } from "../types/api";

export interface BrandState {
  brands: Brand[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: BrandState = {
  brands: [],
  status: "idle",
  error: null,
};

// Fetch all brands
export const fetchBrands = createAsyncThunk("brands/fetchBrands", async () => {
  const response = await brandsAPI.getAll();
  return response.data;
});

const brandSlice = createSlice({
  name: "brands",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBrands.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.brands = action.payload;
      })
      .addCase(fetchBrands.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch brands";
      });
  },
});

export default brandSlice.reducer;