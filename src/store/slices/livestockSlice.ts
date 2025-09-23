import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

interface Livestock {
  id: string;
  tagNumber: string;
  type: 'COW' | 'CALF' | 'BULL';
  breed: string;
  age: number;
  weight: number;
  healthStatus: 'HEALTHY' | 'SICK' | 'QUARANTINE';
  yardId: string;
  arrivalDate: string;
}

interface LivestockState {
  livestock: Livestock[];
  loading: boolean;
  error: string | null;
}

const initialState: LivestockState = {
  livestock: [],
  loading: false,
  error: null,
};

export const fetchLivestock = createAsyncThunk(
  'livestock/fetch',
  async (_, { rejectWithValue }) => {
    try {
      // Mock data for development
      const mockLivestock: Livestock[] = [
        {
          id: '1',
          tagNumber: 'C001',
          type: 'COW',
          breed: 'Angus',
          age: 3,
          weight: 450,
          healthStatus: 'HEALTHY',
          yardId: '1',
          arrivalDate: '2024-01-10',
        },
        {
          id: '2',
          tagNumber: 'B001',
          type: 'BULL',
          breed: 'Hereford',
          age: 4,
          weight: 650,
          healthStatus: 'HEALTHY',
          yardId: '1',
          arrivalDate: '2024-01-12',
        },
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return mockLivestock;
    } catch (err: any) {
      return rejectWithValue('Failed to fetch livestock');
    }
  }
);

const livestockSlice = createSlice({
  name: 'livestock',
  initialState,
  reducers: {
    clearLivestock: (state) => {
      state.livestock = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLivestock.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLivestock.fulfilled, (state, action) => {
        state.loading = false;
        state.livestock = action.payload;
      })
      .addCase(fetchLivestock.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearLivestock } = livestockSlice.actions;
export default livestockSlice.reducer;