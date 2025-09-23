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
  // add other fields if needed
}

export const fetchYards = createAsyncThunk<FetchYardsResponse, { page?: number; size?: number }, { state: any }>(
  'yards/fetch',
  async ({ page = 0, size = 9 }, { getState }) => {
    const state = getState() as any;
    const token = state.auth.accessToken;
    
    const response = await axios.get(`${API_BASE_URL}/yards?page=${page}&size=${size}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data as FetchYardsResponse;
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