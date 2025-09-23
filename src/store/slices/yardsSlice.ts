import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5577/api/v1';

interface Yard {
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

interface YardsState {
  yards: Yard[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
}

const initialState: YardsState = {
  yards: [],
  loading: false,
  error: null,
  totalPages: 0,
  currentPage: 0,
};

interface FetchYardsResponse {
  content: Yard[];
  totalPages: number;
  number: number;
}

export const fetchYards = createAsyncThunk<FetchYardsResponse, { page?: number; size?: number }, { state: any }>(
  'yards/fetch',
  async ({ page = 0, size = 9 }, { getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.accessToken;

      // Mock data for development
      const mockYards: Yard[] = [
        {
          id: 1,
          code: 'Y-NSW-01',
          name: 'North Yard',
          capacity: 200,
          status: 'ACTIVE',
          location: 'North Section, NSW',
          deckCount: 8,
          decksOccupied: 5,
          decksAvailable: 3,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-15',
        },
        {
          id: 2,
          code: 'Y-NSW-02',
          name: 'South Yard',
          capacity: 150,
          status: 'ACTIVE',
          location: 'South Section, NSW',
          deckCount: 6,
          decksOccupied: 4,
          decksAvailable: 2,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-15',
        },
        {
          id: 3,
          code: 'Y-NSW-03',
          name: 'West Yard',
          capacity: 250,
          status: 'MAINTENANCE',
          location: 'West Section, NSW',
          deckCount: 10,
          decksOccupied: 0,
          decksAvailable: 0,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-15',
        },
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      return {
        content: mockYards,
        totalPages: 1,
        number: 0,
      };
    } catch (err: any) {
      throw new Error(err.response?.data || 'Failed to fetch yards');
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
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchYards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchYards.fulfilled, (state, action) => {
        state.loading = false;
        state.yards = action.payload.content;
        state.totalPages = action.payload.totalPages || 0;
        state.currentPage = action.payload.number || 0;
      })
      .addCase(fetchYards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch yards';
      });
  },
});

export const { clearYards } = yardsSlice.actions;
export default yardsSlice.reducer;