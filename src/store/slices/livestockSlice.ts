import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import urls from '../../utils/http/urls';

const API_BASE_URL = urls.API_BASE_URL;

// Yard interfaces
interface Yard {
  id: number;
  code: string;
  name: string;
  capacity: number;
  status: string;
  location: string;
  herdCount: number;
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

// Livestock KPI interfaces
interface LivestockKPIs {
  herdTypeCounts: {
    COWS: number;
    BULLS: number;
    CALVES: number;
    MIXED: number;
  };
  statusCounts: {
    AVAILABLE: number;
    PARTIAL: number;
    FULL: number;
    MAINTENANCE: number;
  };
  capacity: {
    totalCapacityActiveYards: number;
    occupiedCapacity: number;
    yardCountActive: number;
  };
  decks: {
    totalDecks: number;
    decksOccupied: number;
    decksAvailable: number;
  };
  alerts: Array<{
    severity: 'INFO' | 'WARN' | 'ERROR';
    code: string;
    message: string;
    refId: number;
  }>;
}

// Combined state interface
interface LivestockState {
  // KPIs data
  kpis: LivestockKPIs | null;
  kpisLoading: boolean;
  kpisError: string | null;
  
  // Yards data
  yards: Yard[];
  yardsLoading: boolean;
  yardsError: string | null;
  totalPages: number;
  currentPage: number;
  totalElements: number;
  pageSize: number;
}

const initialState: LivestockState = {
  // KPIs state
  kpis: null,
  kpisLoading: false,
  kpisError: null,
  
  // Yards state
  yards: [],
  yardsLoading: false,
  yardsError: null,
  totalPages: 0,
  currentPage: 0,
  totalElements: 0,
  pageSize: 9,
};

// ==================== LIVESTOCK KPI ACTIONS ====================

// Fetch livestock KPIs with offline cache
export const fetchLivestockKPIs = createAsyncThunk(
  'livestock/fetchKPIs',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = state.auth.accessToken;

      const response = await axios.get(`${API_BASE_URL}/herds/kpis`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Cache the KPIs data
      await AsyncStorage.setItem('livestock_kpis', JSON.stringify(response.data));

      return response.data;
    } catch (err: any) {
      // Load from cache if offline
      const cached = await AsyncStorage.getItem('livestock_kpis');
      if (cached) {
        return JSON.parse(cached);
      }

      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data || 'Failed to fetch livestock KPIs');
      }
      return rejectWithValue('An unexpected error occurred');
    }
  }
);

// Load cached livestock KPIs
export const loadCachedLivestockKPIs = createAsyncThunk(
  'livestock/loadCachedKPIs',
  async (_, { rejectWithValue }) => {
    try {
      const cached = await AsyncStorage.getItem('livestock_kpis');
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (err) {
      return rejectWithValue('Failed to load cached livestock data');
    }
  }
);

// ==================== YARDS ACTIONS ====================

// Fetch yards with pagination and offline cache
export const fetchLivestockYards = createAsyncThunk<
  FetchYardsResponse,
  { page?: number; size?: number },
  { state: any }
>(
  'livestock/fetchYards',
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
      await AsyncStorage.setItem(`livestock_yards_page_${page}`, JSON.stringify(response.data));

      return response.data;
    } catch (err: any) {
      // Load cached page if offline
      const cached = await AsyncStorage.getItem(`livestock_yards_page_${page}`);
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
export const loadCachedLivestockYards = createAsyncThunk(
  'livestock/loadCachedYards',
  async (_, { rejectWithValue }) => {
    try {
      const yards: Yard[] = [];
      let currentPage = 0;
      let totalPages = 0;
      let totalElements = 0;
      let pageSize = 9;

      // Only load the first page for initial display
      const cached = await AsyncStorage.getItem(`livestock_yards_page_0`);
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
      };
    } catch (err) {
      return rejectWithValue('Failed to load cached yards');
    }
  }
);

const livestockSlice = createSlice({
  name: 'livestock',
  initialState,
  reducers: {
    // Reset the entire livestock slice to initial state
    resetLivestock: (state) => {
      // Clear KPIs
      state.kpis = null;
      state.kpisLoading = false;
      state.kpisError = null;
      
      // Clear yards
      state.yards = [];
      state.yardsLoading = false;
      state.yardsError = null;
      state.totalPages = 0;
      state.currentPage = 0;
      state.totalElements = 0;
      state.pageSize = 9;
      
      // Clear cached data from AsyncStorage
      // Note: This is async but we don't need to wait for it
      const clearAsyncStorage = async () => {
        try {
          // Get all keys from AsyncStorage
          const keys = await AsyncStorage.getAllKeys();
          
          // Filter keys related to livestock
          const livestockKeys = keys.filter(key => 
            key.startsWith('livestock_kpis') || 
            key.startsWith('livestock_yards_page_')
          );
          
          // Remove all livestock-related keys
          if (livestockKeys.length > 0) {
            await AsyncStorage.multiRemove(livestockKeys);
          }
        } catch (error) {
          console.error('Error clearing livestock AsyncStorage:', error);
        }
      };
      
      clearAsyncStorage();
    },
    clearLivestock: (state) => {
      // Clear KPIs
      state.kpis = null;
      state.kpisError = null;
      
      // Clear yards
      state.yards = [];
      state.yardsError = null;
      state.totalPages = 0;
      state.currentPage = 0;
      state.totalElements = 0;
      
      // Clear cached data
      AsyncStorage.multiRemove([
        'livestock_kpis',
        ...Object.keys(AsyncStorage).filter(key => key.startsWith('livestock_yards_page_'))
      ]);
    },
    updateLivestockKPI: (state, action) => {
      if (state.kpis) {
        state.kpis = { ...state.kpis, ...action.payload };
      }
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
      // ==================== KPI CASES ====================
      // Fetch KPIs
      .addCase(fetchLivestockKPIs.pending, (state) => {
        state.kpisLoading = true;
        state.kpisError = null;
      })
      .addCase(fetchLivestockKPIs.fulfilled, (state, action) => {
        state.kpisLoading = false;
        state.kpis = action.payload;
      })
      .addCase(fetchLivestockKPIs.rejected, (state, action) => {
        state.kpisLoading = false;
        state.kpisError = action.payload as string;
      })
      // Load cached KPIs
      .addCase(loadCachedLivestockKPIs.pending, (state) => {
        state.kpisLoading = true;
        state.kpisError = null;
      })
      .addCase(loadCachedLivestockKPIs.fulfilled, (state, action) => {
        state.kpisLoading = false;
        state.kpis = action.payload;
      })
      .addCase(loadCachedLivestockKPIs.rejected, (state, action) => {
        state.kpisLoading = false;
        state.kpisError = action.payload as string;
      })
      
      // ==================== YARDS CASES ====================
      // Fetch yards
      .addCase(fetchLivestockYards.pending, (state) => {
        state.yardsLoading = true;
        state.yardsError = null;
      })
      .addCase(fetchLivestockYards.fulfilled, (state, action) => {
        state.yardsLoading = false;
        state.yards = action.payload.content;
        state.totalPages = action.payload.page.totalPages;
        state.currentPage = action.payload.page.number;
        state.totalElements = action.payload.page.totalElements;
        state.pageSize = action.payload.page.size;
      })
      .addCase(fetchLivestockYards.rejected, (state, action) => {
        state.yardsLoading = false;
        state.yardsError = action.payload as string || 'Failed to fetch yards';
      })
      // Load cached yards
      .addCase(loadCachedLivestockYards.pending, (state) => {
        state.yardsLoading = true;
        state.yardsError = null;
      })
      .addCase(loadCachedLivestockYards.fulfilled, (state, action) => {
        state.yardsLoading = false;
        state.yards = action.payload.yards;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
        state.totalElements = action.payload.totalElements;
        state.pageSize = action.payload.pageSize;
      })
      .addCase(loadCachedLivestockYards.rejected, (state, action) => {
        state.yardsLoading = false;
        state.yardsError = action.payload as string;
      });
  },
});

export const { 
  resetLivestock, // Add this export
  clearLivestock, 
  updateLivestockKPI, 
  updateYardStatus, 
  clearYardsList 
} = livestockSlice.actions;

export default livestockSlice.reducer;