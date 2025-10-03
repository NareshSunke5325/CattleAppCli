import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import urls from '../../utils/http/urls';

const API_BASE_URL = urls.API_BASE_URL;

interface Yard {
  herdCount: any;
  id: number;
  code: string;
  name: string;
  capacity: number;
  status: string;
  location: string;
  deckCount: number;
  decksOccupied: number;
  decksAvailable: number;
  createdAt: string;
  updatedAt: string;
}

interface PageInfo {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

interface FetchYardsResponse {
  content: Yard[];
  page: PageInfo;
}

interface YardsState {
  yards: Yard[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  totalElements: number;
  pageSize: number;
}

const initialState: YardsState = {
  yards: [],
  loading: false,
  error: null,
  totalPages: 0,
  currentPage: 0,
  totalElements: 0,
  pageSize: 9,
};

// Fetch yards with pagination and offline cache
export const fetchYards = createAsyncThunk<
  FetchYardsResponse,
  { page?: number; size?: number },
  { state: any }
>(
  'yards/fetchYards',
  async ({ page = 0, size = 9 }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = state.auth.accessToken;

      const response = await axios.get(`${API_BASE_URL}/yards`, {
        params: { page, size },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Save each page in AsyncStorage
      await AsyncStorage.setItem(`yards_page_${page}`, JSON.stringify(response.data));

      return response.data;
    } catch (err: any) {
      // Load cached page if offline
      const cached = await AsyncStorage.getItem(`yards_page_${page}`);
      if (cached) {
        return JSON.parse(cached);
      }

      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data || 'Failed to fetch yards');
      }
      return rejectWithValue('An unexpected error occurred');
    }
  }
);

// Load cached yards for offline support
export const loadCachedYards = createAsyncThunk<YardsState, void>(
  'yards/loadCachedYards',
  async (_, { rejectWithValue }) => {
    try {
      const yards: Yard[] = [];
      let currentPage = 0;
      let totalPages = 0;
      let totalElements = 0;
      let pageSize = 9;

      // Only load the first page for initial display
      const cached = await AsyncStorage.getItem(`yards_page_0`);
      if (cached) {
        const pageData: FetchYardsResponse = JSON.parse(cached);
        yards.push(...pageData.content);
        totalPages = pageData.page.totalPages;
        totalElements = pageData.page.totalElements;
        pageSize = pageData.page.size;
        currentPage = 0;
      }

      return {
        yards,
        totalPages,
        currentPage,
        totalElements,
        pageSize,
        loading: false,
        error: null,
      };
    } catch (err) {
      return rejectWithValue('Failed to load cached yards');
    }
  }
);

const yardsSlice = createSlice({
  name: 'yards',
  initialState,
  reducers: {
    clearYards: (state) => {
      state.yards = [];
      state.error = null;
      state.totalPages = 0;
      state.currentPage = 0;
      state.totalElements = 0;
      // Clear cached yards
      AsyncStorage.multiRemove(Object.keys(AsyncStorage).filter(key => key.startsWith('yards_page_')));
    },
    updateYardStatus: (state, action) => {
      const { yardId, status } = action.payload;
      const yard = state.yards.find((y) => y.id === yardId);
      if (yard) {
        yard.status = status;
      }
    },
    clearYardsList: (state) => {
      state.yards = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch yards
      .addCase(fetchYards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchYards.fulfilled, (state, action) => {
        state.loading = false;
        state.yards = action.payload.content;
        state.totalPages = action.payload.page.totalPages;
        state.currentPage = action.payload.page.number;
        state.totalElements = action.payload.page.totalElements;
        state.pageSize = action.payload.page.size;
      })
      .addCase(fetchYards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch yards';
      })
      // Load cached yards
      .addCase(loadCachedYards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadCachedYards.fulfilled, (state, action) => {
        state.loading = false;
        state.yards = action.payload.yards;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
        state.totalElements = action.payload.totalElements;
        state.pageSize = action.payload.pageSize;
      })
      .addCase(loadCachedYards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearYards, updateYardStatus, clearYardsList } = yardsSlice.actions;
export default yardsSlice.reducer;