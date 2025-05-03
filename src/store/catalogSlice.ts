import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { categoriesAPI, listingsAPI } from '../api/apiClient';

// Інтерфейси для типізації
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: number;
  children?: Category[];
  _count?: {
    listings: number;
  };
}

export interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  location: string;
  category: string;
  categoryId?: number;
  images: string[];
  views: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    name: string;
    avatar?: string;
  };
}

interface FilterParams {
  category?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'price' | 'views';
  sortOrder?: 'asc' | 'desc';
}

interface ListingsResponse {
  listings: Listing[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

interface CatalogState {
  categories: Category[];
  categoryTree: Category[];
  currentCategory: Category | null;
  listings: Listing[];
  filters: FilterParams;
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// Початковий стан
const initialState: CatalogState = {
  categories: [],
  categoryTree: [],
  currentCategory: null,
  listings: [],
  filters: {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
  meta: {
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  },
  status: 'idle',
  error: null,
};

// Асинхронні thunks для запитів до API
export const fetchCategories = createAsyncThunk(
  'catalog/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await categoriesAPI.getAll();
      return response.data.data.categories;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Помилка завантаження категорій');
    }
  }
);

export const fetchCategoryTree = createAsyncThunk(
  'catalog/fetchCategoryTree',
  async (_, { rejectWithValue }) => {
    try {
      const response = await categoriesAPI.getTree();
      return response.data.data.categoryTree;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Помилка завантаження дерева категорій');
    }
  }
);

export const fetchCategoryBySlug = createAsyncThunk(
  'catalog/fetchCategoryBySlug',
  async (slug: string, { rejectWithValue }) => {
    try {
      const response = await categoriesAPI.getBySlug(slug);
      return response.data.data.category;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Категорію не знайдено');
    }
  }
);

export const fetchListings = createAsyncThunk(
  'catalog/fetchListings',
  async (params: FilterParams, { rejectWithValue }) => {
    try {
      const response = await listingsAPI.getAll(params);
      return response.data.data as ListingsResponse;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Помилка завантаження оголошень');
    }
  }
);

// Створення Redux slice
const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<FilterParams>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.filters.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Обробка результатів fetchCategories
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      
      // Обробка результатів fetchCategoryTree
      .addCase(fetchCategoryTree.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCategoryTree.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.categoryTree = action.payload;
      })
      .addCase(fetchCategoryTree.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      
      // Обробка результатів fetchCategoryBySlug
      .addCase(fetchCategoryBySlug.pending, (state) => {
        state.status = 'loading';
        state.currentCategory = null;
      })
      .addCase(fetchCategoryBySlug.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentCategory = action.payload;
      })
      .addCase(fetchCategoryBySlug.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
        state.currentCategory = null;
      })
      
      // Обробка результатів fetchListings
      .addCase(fetchListings.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchListings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.listings = action.payload.listings;
        state.meta = action.payload.meta;
      })
      .addCase(fetchListings.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const { setFilters, resetFilters, setCurrentPage } = catalogSlice.actions;
export default catalogSlice.reducer;