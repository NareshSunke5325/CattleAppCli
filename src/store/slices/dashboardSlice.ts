import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5577/api/v1';

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
  loading: boolean;
  error: string | null;
  data: any;
}

const initialState: DashboardState = {
  stats: null,
  yards: [],
  herdTypes: [],
  loading: false,
  error: null,
  data: null,
};

export const fetchDashboard = createAsyncThunk(
  'dashboard/fetch',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = state.auth.accessToken;

      // Mock data for development
      const mockData = {
        stats: {
          totalCapacity: 600,
          activeYards: 5,
          occupiedDecks: 9,
          availableDecks: 12,
          utilization: 43,
        },
        yards: [
          { id: '1', name: 'North Yard', code: 'Y-NSW-01', capacity: 200, occupied: 120, revenue: 450 },
          { id: '2', name: 'South Yard', code: 'Y-NSW-02', capacity: 150, occupied: 90, revenue: 320 },
          { id: '3', name: 'West Yard', code: 'Y-NSW-03', capacity: 250, occupied: 180, revenue: 680 },
        ],
        herdTypes: [
          { type: 'COWS', count: 2, percentage: 40 },
          { type: 'CALVES', count: 1, percentage: 20 },
          { type: 'BULLS', count: 1, percentage: 20 },
          { type: 'MIXED', count: 1, percentage: 20 },
        ],
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return mockData;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || 'Failed to fetch dashboard');
    }
  }
);

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
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.stats = action.payload.stats;
        state.yards = action.payload.yards;
        state.herdTypes = action.payload.herdTypes;
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;