import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5577/api/v1';

// -------------------- Types --------------------
export interface YardData {
  id: string;
  name: string;
  code: string;
  capacity: number;
  occupied: number;
  revenue: number;
}

export interface HerdType {
  type: string;
  count: number;
  percentage: number;
}

export interface DashboardStats {
  totalCapacity: number;
  activeYards: number;
  occupiedDecks: number;
  availableDecks: number;
  utilization: number;
}

export interface DashboardState {
  stats: DashboardStats | null;
  yards: YardData[];
  herdTypes: HerdType[];
  loading: boolean; // renamed from isLoading for consistency
  error: string | null;
}

// -------------------- Initial State --------------------
const initialState: DashboardState = {
  stats: null,
  yards: [],
  herdTypes: [],
  loading: false,
  error: null,
};

// -------------------- Thunks --------------------

// Fetch dashboard data from API
export const fetchDashboard = createAsyncThunk(
  'dashboard/fetch',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = state.auth.accessToken;

      const response = await axios.get(`${API_BASE_URL}/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || 'Failed to fetch dashboard');
    }
  }
);

// -------------------- Slice --------------------
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearDashboard: (state) => {
      state.stats = null;
      state.yards = [];
      state.herdTypes = [];
      state.error = null;
    },
    // ✅ Handy for dev/testing
    setMockData: (state) => {
      state.stats = {
        totalCapacity: 600,
        activeYards: 5,
        occupiedDecks: 9,
        availableDecks: 12,
        utilization: 43,
      };
      state.yards = [
        { id: '1', name: 'North Yard', code: 'Y-NSW-01', capacity: 200, occupied: 120, revenue: 850 },
        { id: '2', name: 'Overflow Yard', code: 'Y-NSW-05', capacity: 150, occupied: 90, revenue: 420 },
        { id: '3', name: 'West Yard', code: 'Y-NSW-04', capacity: 250, occupied: 180, revenue: 216 },
      ];
      state.herdTypes = [
        { type: 'COWS', count: 2, percentage: 40 },
        { type: 'CALVES', count: 1, percentage: 20 },
        { type: 'BULLS', count: 1, percentage: 20 },
        { type: 'MIXED', count: 1, percentage: 20 },
      ];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;

        // ✅ Map API response into our typed state
        state.stats = action.payload.stats;
        state.yards = action.payload.yards;
        state.herdTypes = action.payload.herdTypes;
        state.error = null;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearDashboard, setMockData } = dashboardSlice.actions;
export default dashboardSlice.reducer;
