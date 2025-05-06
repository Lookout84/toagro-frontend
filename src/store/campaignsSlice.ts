import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { campaignsAPI } from "../api/apiClient";
import { Campaign, CampaignAnalytics } from "../types/api";

interface CampaignsState {
  campaigns: Campaign[];
  currentCampaign: Campaign | null;
  campaignAnalytics: CampaignAnalytics | null;
  campaignTypes: string[];
  campaignStatuses: string[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: CampaignsState = {
  campaigns: [],
  currentCampaign: null,
  campaignAnalytics: null,
  campaignTypes: [],
  campaignStatuses: [],
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
export const fetchCampaigns = createAsyncThunk(
  "campaigns/fetchCampaigns",
  async (params: { page?: number; limit?: number; type?: string; status?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await campaignsAPI.getAll(params);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Помилка завантаження кампаній"
      );
    }
  }
);

export const fetchCampaignById = createAsyncThunk(
  "campaigns/fetchCampaignById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await campaignsAPI.activate(id);
      return response.data.data.campaign;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Помилка активації кампанії"
      );
    }
  }
);

export const pauseCampaign = createAsyncThunk(
  "campaigns/pauseCampaign",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await campaignsAPI.pause(id);
      return response.data.data.campaign;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Помилка призупинення кампанії"
      );
    }
  }
);

export const cancelCampaign = createAsyncThunk(
  "campaigns/cancelCampaign",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await campaignsAPI.cancel(id);
      return response.data.data.campaign;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Помилка скасування кампанії"
      );
    }
  }
);

export const duplicateCampaign = createAsyncThunk(
  "campaigns/duplicateCampaign",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await campaignsAPI.duplicate(id);
      return response.data.data.campaign;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Помилка дублювання кампанії"
      );
    }
  }
);

// Створення Redux slice
const campaignsSlice = createSlice({
  name: "campaigns",
  initialState,
  reducers: {
    resetCampaignsState: (state) => {
      state.campaigns = [];
      state.currentCampaign = null;
      state.campaignAnalytics = null;
      state.meta.page = 1;
    },
    setCampaignFilter: (state, action: PayloadAction<{ type?: string; status?: string }>) => {
      state.meta.page = 1; // Скидаємо сторінку при зміні фільтрів
    },
  },
  extraReducers: (builder) => {
    // Обробка fetchCampaigns
    builder
      .addCase(fetchCampaigns.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        state.isLoading = false;
        state.campaigns = action.payload.campaigns;
        state.meta = action.payload.meta;
      })
      .addCase(fetchCampaigns.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

    // Обробка fetchCampaignById
      .addCase(fetchCampaignById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCampaignById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCampaign = action.payload;
      })
      .addCase(fetchCampaignById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

    // Обробка fetchCampaignAnalytics
      .addCase(fetchCampaignAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCampaignAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.campaignAnalytics = action.payload;
      })
      .addCase(fetchCampaignAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

    // Обробка fetchCampaignTypes
      .addCase(fetchCampaignTypes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCampaignTypes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.campaignTypes = action.payload;
      })
      .addCase(fetchCampaignTypes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

    // Обробка fetchCampaignStatuses
      .addCase(fetchCampaignStatuses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCampaignStatuses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.campaignStatuses = action.payload;
      })
      .addCase(fetchCampaignStatuses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

    // Обробка createCampaign
      .addCase(createCampaign.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCampaign.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCampaign = action.payload;
        // Додаємо нову кампанію на початок списку, якщо список вже існує
        if (state.campaigns.length > 0) {
          state.campaigns.unshift(action.payload);
        }
      })
      .addCase(createCampaign.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

    // Обробка updateCampaign
      .addCase(updateCampaign.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCampaign.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCampaign = action.payload;
        // Оновлюємо кампанію в списку
        const index = state.campaigns.findIndex(campaign => campaign.id === action.payload.id);
        if (index !== -1) {
          state.campaigns[index] = action.payload;
        }
      })
      .addCase(updateCampaign.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

    // Обробка deleteCampaign
      .addCase(deleteCampaign.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteCampaign.fulfilled, (state, action) => {
        state.isLoading = false;
        // Видаляємо кампанію зі списку
        state.campaigns = state.campaigns.filter(campaign => campaign.id !== action.payload);
        // Якщо поточна кампанія - це видалена, очищаємо її
        if (state.currentCampaign && state.currentCampaign.id === action.payload) {
          state.currentCampaign = null;
          state.campaignAnalytics = null;
        }
      })
      .addCase(deleteCampaign.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

    // Обробка activateCampaign
      .addCase(activateCampaign.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(activateCampaign.fulfilled, (state, action) => {
        state.isLoading = false;
        // Оновлюємо поточну кампанію, якщо вона активована
        if (state.currentCampaign && state.currentCampaign.id === action.payload.id) {
          state.currentCampaign = action.payload;
        }
        // Оновлюємо кампанію в списку
        const index = state.campaigns.findIndex(campaign => campaign.id === action.payload.id);
        if (index !== -1) {
          state.campaigns[index] = action.payload;
        }
      })
      .addCase(activateCampaign.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

    // Обробка pauseCampaign
      .addCase(pauseCampaign.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(pauseCampaign.fulfilled, (state, action) => {
        state.isLoading = false;
        // Оновлюємо поточну кампанію, якщо вона призупинена
        if (state.currentCampaign && state.currentCampaign.id === action.payload.id) {
          state.currentCampaign = action.payload;
        }
        // Оновлюємо кампанію в списку
        const index = state.campaigns.findIndex(campaign => campaign.id === action.payload.id);
        if (index !== -1) {
          state.campaigns[index] = action.payload;
        }
      })
      .addCase(pauseCampaign.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

    // Обробка cancelCampaign
      .addCase(cancelCampaign.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelCampaign.fulfilled, (state, action) => {
        state.isLoading = false;
        // Оновлюємо поточну кампанію, якщо вона скасована
        if (state.currentCampaign && state.currentCampaign.id === action.payload.id) {
          state.currentCampaign = action.payload;
        }
        // Оновлюємо кампанію в списку
        const index = state.campaigns.findIndex(campaign => campaign.id === action.payload.id);
        if (index !== -1) {
          state.campaigns[index] = action.payload;
        }
      })
      .addCase(cancelCampaign.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

    // Обробка duplicateCampaign
      .addCase(duplicateCampaign.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(duplicateCampaign.fulfilled, (state, action) => {
        state.isLoading = false;
        // Додаємо нову кампанію в список
        state.campaigns.unshift(action.payload);
      })
      .addCase(duplicateCampaign.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetCampaignsState, setCampaignFilter } = campaignsSlice.actions;

export default campaignsSlice.reducer; = await campaignsAPI.getById(id);
      return response.data.data.campaign;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Помилка завантаження кампанії"
      );
    }
  }
);

export const fetchCampaignAnalytics = createAsyncThunk(
  "campaigns/fetchCampaignAnalytics",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await campaignsAPI.getAnalytics(id);
      return response.data.data.analytics;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Помилка завантаження аналітики кампанії"
      );
    }
  }
);

export const fetchCampaignTypes = createAsyncThunk(
  "campaigns/fetchCampaignTypes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await campaignsAPI.getTypes();
      return response.data.data.types;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Помилка завантаження типів кампаній"
      );
    }
  }
);

export const fetchCampaignStatuses = createAsyncThunk(
  "campaigns/fetchCampaignStatuses",
  async (_, { rejectWithValue }) => {
    try {
      const response = await campaignsAPI.getStatuses();
      return response.data.data.statuses;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Помилка завантаження статусів кампаній"
      );
    }
  }
);

export const createCampaign = createAsyncThunk(
  "campaigns/createCampaign",
  async (campaignData: any, { rejectWithValue }) => {
    try {
      const response = await campaignsAPI.create(campaignData);
      return response.data.data.campaign;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Помилка створення кампанії"
      );
    }
  }
);

export const updateCampaign = createAsyncThunk(
  "campaigns/updateCampaign",
  async ({ id, data }: { id: number; data: any }, { rejectWithValue }) => {
    try {
      const response = await campaignsAPI.update(id, data);
      return response.data.data.campaign;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Помилка оновлення кампанії"
      );
    }
  }
);

export const deleteCampaign = createAsyncThunk(
  "campaigns/deleteCampaign",
  async (id: number, { rejectWithValue }) => {
    try {
      await campaignsAPI.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Помилка видалення кампанії"
      );
    }
  }
);

export const activateCampaign = createAsyncThunk(
  "campaigns/activateCampaign",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await campaignsAPI.activate(id);
      return response.data.data.campaign;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Помилка активації кампанії"
      );
    }
  }
);