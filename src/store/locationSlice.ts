import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { locationsAPI } from "../api/apiClient";

// Додано countryId до Region, Community, Location
interface Region {
  id: number;
  name: string;
  code?: string;
  countryId?: number;
}

interface Community {
  id: number;
  name: string;
  regionId: number;
}

interface Location {
  id: number;
  settlement: string;
  communityId: number;
  countryId: number;
  latitude?: number;
  longitude?: number;
}

interface LocationState {
  regions: Region[];
  communities: Community[];
  locations: Location[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: LocationState = {
  regions: [],
  communities: [],
  locations: [],
  status: "idle",
  error: null,
};

// Додаємо countryId як опціональний параметр
export const fetchRegions = createAsyncThunk<Region[], number | string | undefined>(
  "locations/fetchRegions",
  async (countryId, { rejectWithValue }) => {
    try {
      const response = await locationsAPI.getRegions(countryId);
      // Якщо API повертає { status, data }, то треба response.data.data
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Не вдалося завантажити області"
      );
    }
  }
);

export const fetchCommunities = createAsyncThunk<Community[], number | string>(
  "locations/fetchCommunities",
  async (regionId, { rejectWithValue }) => {
    try {
      const response = await locationsAPI.getCommunities(regionId);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Не вдалося завантажити громади"
      );
    }
  }
);

export const fetchLocations = createAsyncThunk<Location[], number | string>(
  "locations/fetchLocations",
  async (communityId, { rejectWithValue }) => {
    try {
      const response = await locationsAPI.getLocations(communityId);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Не вдалося завантажити населені пункти"
      );
    }
  }
);

const locationSlice = createSlice({
  name: "locations",
  initialState,
  reducers: {
    clearCommunities(state) {
      state.communities = [];
    },
    clearLocations(state) {
      state.locations = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Regions
      .addCase(fetchRegions.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchRegions.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.regions = action.payload;
        state.communities = [];
        state.locations = [];
      })
      .addCase(fetchRegions.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      // Communities
      .addCase(fetchCommunities.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.communities = [];
        state.locations = [];
      })
      .addCase(fetchCommunities.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.communities = action.payload;
        state.locations = [];
      })
      .addCase(fetchCommunities.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
        state.communities = [];
        state.locations = [];
      })
      // Locations
      .addCase(fetchLocations.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.locations = [];
      })
      .addCase(fetchLocations.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.locations = action.payload;
      })
      .addCase(fetchLocations.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
        state.locations = [];
      });
  },
});

export const { clearCommunities, clearLocations } = locationSlice.actions;
export default locationSlice.reducer;