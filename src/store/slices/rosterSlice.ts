// src/store/slices/rosterSlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import urls from '../../utils/http/urls';

const API_BASE_URL = urls.API_BASE_URL;

interface Task {
  id: number;
  title: string;
  description: string;
  shiftId: number;
  workerId: number;
  bookingId: number | null;
  scheduledStart: string;
  scheduledEnd: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  taskType: string;
  foodType: string | null;
  foodQuantity: number | null;
  foodUnit: string | null;
  animalCount: number | null;
  notes: string | null;
  completedAt: string | null;
}

interface ProgressStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  completionRate: number;
}

interface PageInfo {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

interface FetchTasksResponse {
  content: Task[];
  page: PageInfo;
}

interface RosterState {
  tasks: Task[];
  progressStats: ProgressStats | null;
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  totalElements: number;
  pageSize: number;
}

const initialState: RosterState = {
  tasks: [],
  progressStats: null,
  loading: false,
  error: null,
  totalPages: 0,
  currentPage: 0,
  totalElements: 0,
  pageSize: 6, // Changed from 3 to 6 to match your component
};

// Fetch progress stats
export const fetchProgressStats = createAsyncThunk<ProgressStats, void, { state: any }>(
  'roster/fetchProgressStats',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = state.auth.accessToken;

      const response = await axios.get(`${API_BASE_URL}/tasks/kpis`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Cache progress stats
      await AsyncStorage.setItem('progressStats', JSON.stringify(response.data));

      return response.data;
    } catch (err: any) {
      // Try loading from cache if offline
      const cached = await AsyncStorage.getItem('progressStats');
      if (cached) {
        return JSON.parse(cached);
      }

      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data || 'Failed to fetch progress stats');
      }
      return rejectWithValue('An unexpected error occurred');
    }
  }
);

// Fetch tasks with pagination and offline cache - FIXED: Default size to 6
export const fetchTasks = createAsyncThunk<
  FetchTasksResponse,
  { page?: number; size?: number; sort?: string },
  { state: any }
>(
  'roster/fetchTasks',
  async ({ page = 0, size = 6, sort = 'scheduledStart,desc' }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = state.auth.accessToken;

      const response = await axios.get(`${API_BASE_URL}/tasks`, {
        params: { page, size, sort },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Save each page in AsyncStorage
      await AsyncStorage.setItem(`tasks_page_${page}`, JSON.stringify(response.data));

      return response.data;
    } catch (err: any) {
      // Load cached page if offline
      const cached = await AsyncStorage.getItem(`tasks_page_${page}`);
      if (cached) {
        return JSON.parse(cached);
      }

      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data || 'Failed to fetch tasks');
      }
      return rejectWithValue('An unexpected error occurred');
    }
  }
);

// Add this helper inside rosterSlice file (outside the slice)
export const loadCachedTasks = createAsyncThunk<RosterState, void>(
  'roster/loadCachedTasks',
  async (_, { rejectWithValue }) => {
    try {
      const tasks: Task[] = [];
      let currentPage = 0;
      let totalPages = 0;
      let totalElements = 0;
      let pageSize = 6; // Changed from 3 to 6

      // Only load the first page for initial display
      const cached = await AsyncStorage.getItem(`tasks_page_0`);
      if (cached) {
        const pageData: FetchTasksResponse = JSON.parse(cached);
        tasks.push(...pageData.content);
        totalPages = pageData.page.totalPages;
        totalElements = pageData.page.totalElements;
        pageSize = pageData.page.size;
        currentPage = 0;
      }

      return {
        tasks,
        totalPages,
        currentPage,
        totalElements,
        pageSize,
        progressStats: null,
        loading: false,
        error: null,
      };
    } catch (err) {
      return rejectWithValue('Failed to load cached tasks');
    }
  }
);

const rosterSlice = createSlice({
  name: 'roster',
  initialState,
  reducers: {
    // Reset the entire roster slice to initial state
    resetRoster: (state) => {
      // Reset all state to initial values
      state.tasks = [];
      state.progressStats = null;
      state.loading = false;
      state.error = null;
      state.totalPages = 0;
      state.currentPage = 0;
      state.totalElements = 0;
      state.pageSize = 6;
      
      // Clear cached data from AsyncStorage
      // Note: This is async but we don't need to wait for it
      const clearAsyncStorage = async () => {
        try {
          // Get all keys from AsyncStorage
          const keys = await AsyncStorage.getAllKeys();
          
          // Filter keys related to roster/tasks
          const rosterKeys = keys.filter(key => 
            key.startsWith('tasks_page_') || 
            key === 'progressStats'
          );
          
          // Remove all roster-related keys
          if (rosterKeys.length > 0) {
            await AsyncStorage.multiRemove(rosterKeys);
          }
          console.log('🗑️ Cleared roster data from AsyncStorage');
        } catch (error) {
          console.error('❌ Error clearing roster AsyncStorage:', error);
        }
      };
      
      clearAsyncStorage();
    },
    clearRoster: (state) => {
      state.tasks = [];
      state.progressStats = null;
      state.error = null;
      state.totalPages = 0;
      state.currentPage = 0;
      state.totalElements = 0;
      AsyncStorage.clear(); // Clear cached tasks and stats
    },
    updateTaskStatus: (state, action) => {
      const { taskId, status } = action.payload;
      const task = state.tasks.find((t) => t.id === taskId);
      if (task) {
        task.status = status;
      }
    },
    // Add a new reducer to clear tasks when changing pages
    clearTasks: (state) => {
      state.tasks = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Progress stats
      .addCase(fetchProgressStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProgressStats.fulfilled, (state, action) => {
        state.loading = false;
        state.progressStats = action.payload;
      })
      .addCase(fetchProgressStats.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to fetch progress stats';
      })
      // Tasks - FIXED: Always replace tasks, never append
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        // FIX: Always replace tasks with current page content
        state.tasks = action.payload.content;
        state.totalPages = action.payload.page.totalPages;
        state.currentPage = action.payload.page.number;
        state.totalElements = action.payload.page.totalElements;
        state.pageSize = action.payload.page.size;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to fetch tasks';
      })
      .addCase(loadCachedTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadCachedTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload.tasks;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
        state.totalElements = action.payload.totalElements;
        state.pageSize = action.payload.pageSize;
      })
      .addCase(loadCachedTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  resetRoster, // Add this export
  clearRoster, 
  updateTaskStatus, 
  clearTasks 
} = rosterSlice.actions;
export default rosterSlice.reducer;