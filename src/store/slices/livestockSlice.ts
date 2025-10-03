import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import urls from '../../utils/http/urls';

const API_BASE_URL = urls.API_BASE_URL;

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

interface LivestockState {
  kpis: LivestockKPIs | null;
  loading: boolean;
  error: string | null;
}

const initialState: LivestockState = {
  kpis: null,
  loading: false,
  error: null,
};

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

const livestockSlice = createSlice({
  name: 'livestock',
  initialState,
  reducers: {
    clearLivestock: (state) => {
      state.kpis = null;
      state.error = null;
      // Clear cached data
      AsyncStorage.removeItem('livestock_kpis');
    },
    updateLivestockKPI: (state, action) => {
      if (state.kpis) {
        state.kpis = { ...state.kpis, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch KPIs
      .addCase(fetchLivestockKPIs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLivestockKPIs.fulfilled, (state, action) => {
        state.loading = false;
        state.kpis = action.payload;
      })
      .addCase(fetchLivestockKPIs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Load cached KPIs
      .addCase(loadCachedLivestockKPIs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadCachedLivestockKPIs.fulfilled, (state, action) => {
        state.loading = false;
        state.kpis = action.payload;
      })
      .addCase(loadCachedLivestockKPIs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearLivestock, updateLivestockKPI } = livestockSlice.actions;
export default livestockSlice.reducer;