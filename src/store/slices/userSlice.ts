// store/slices/userSlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import urls from '../../utils/http/urls';

const API_BASE_URL = urls.API_BASE_URL;

// User interfaces
export interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  phone?: string;
  active: boolean;
  roles: string[];
  tasks?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AccountActivity {
  id: number;
  userId: number;
  action: string;
  client: 'MOBILE' | 'WEB' | 'DESKTOP';
  ip: string;
  deviceId: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
  failureReason?: string;
}

export interface UserRoles {
  roles: string[];
  currentRole: string;
}

interface PageInfo {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

interface FetchUsersResponse {
  content: User[];
  page: PageInfo;
}

interface UserState {
  // Users data
  users: User[];
  usersLoading: boolean;
  usersError: string | null;
  totalPages: number;
  currentPage: number;
  totalElements: number;
  pageSize: number;
  
  // Account activity
  accountActivity: AccountActivity[];
  activityLoading: boolean;
  activityError: string | null;
  
  // User roles
  userRoles: UserRoles | null;
  rolesLoading: boolean;
  rolesError: string | null;
}

const initialState: UserState = {
  // Users state
  users: [],
  usersLoading: false,
  usersError: null,
  totalPages: 0,
  currentPage: 0,
  totalElements: 0,
  pageSize: 10,
  
  // Activity state
  accountActivity: [],
  activityLoading: false,
  activityError: null,
  
  // Roles state
  userRoles: null,
  rolesLoading: false,
  rolesError: null,
};

// ==================== USERS ACTIONS ====================

// Fetch users with pagination and offline cache
export const fetchUsers = createAsyncThunk<
  FetchUsersResponse,
  { page?: number; size?: number },
  { state: any }
>(
  'users/fetchUsers',
  async ({ page = 0, size = 10 }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = state.auth.accessToken;

      const response = await axios.get(`${API_BASE_URL}/users`, {
        params: { page, size },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Save page in AsyncStorage
      await AsyncStorage.setItem(`users_page_${page}`, JSON.stringify(response.data));

      return response.data;
    } catch (err: any) {
      // Load cached page if offline
      const cached = await AsyncStorage.getItem(`users_page_${page}`);
      if (cached) {
        return JSON.parse(cached);
      }

      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data || 'Failed to fetch users');
      }
      return rejectWithValue('An unexpected error occurred');
    }
  }
);

// Load cached users for offline support
export const loadCachedUsers = createAsyncThunk(
  'users/loadCachedUsers',
  async (_, { rejectWithValue }) => {
    try {
      const users: User[] = [];
      let currentPage = 0;
      let totalPages = 0;
      let totalElements = 0;
      let pageSize = 10;

      // Load first page for initial display
      const cached = await AsyncStorage.getItem(`users_page_0`);
      if (cached) {
        const pageData: FetchUsersResponse = JSON.parse(cached);
        users.push(...pageData.content);
        totalPages = pageData.page.totalPages;
        totalElements = pageData.page.totalElements;
        pageSize = pageData.page.size;
        currentPage = 0;
      }

      return {
        users,
        totalPages,
        currentPage,
        totalElements,
        pageSize,
      };
    } catch (err) {
      return rejectWithValue('Failed to load cached users');
    }
  }
);

// Add new user
export const addUser = createAsyncThunk<
  User,
  Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
  { state: any }
>(
  'users/addUser',
  async (userData, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = state.auth.accessToken;

      const response = await axios.post(`${API_BASE_URL}/users`, userData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data || 'Failed to add user');
      }
      return rejectWithValue('An unexpected error occurred');
    }
  }
);

// ==================== ACCOUNT ACTIVITY ACTIONS ====================

export const fetchAccountActivity = createAsyncThunk<
  AccountActivity[],
  { page?: number; size?: number },
  { state: any }
>(
  'users/fetchAccountActivity',
  async ({ page = 0, size = 3 }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = state.auth.accessToken;

      const response = await axios.get(`${API_BASE_URL}/account/activity`, {
        params: { page, size },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      await AsyncStorage.setItem('account_activity', JSON.stringify(response.data.content));

      return response.data.content;
    } catch (err: any) {
      const cached = await AsyncStorage.getItem('account_activity');
      if (cached) {
        return JSON.parse(cached);
      }

      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data || 'Failed to fetch account activity');
      }
      return rejectWithValue('An unexpected error occurred');
    }
  }
);

// ==================== USER ROLES ACTIONS ====================

export const fetchUserRoles = createAsyncThunk(
  'users/fetchUserRoles',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = state.auth.accessToken;

      const response = await axios.get(`${API_BASE_URL}/user/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      await AsyncStorage.setItem('user_roles', JSON.stringify(response.data));

      return response.data;
    } catch (err: any) {
      const cached = await AsyncStorage.getItem('user_roles');
      if (cached) {
        return JSON.parse(cached);
      }

      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data || 'Failed to fetch user roles');
      }
      return rejectWithValue('An unexpected error occurred');
    }
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    // Reset the entire user slice to initial state
    resetUsers: (state) => {
      // Reset all state to initial values
      state.users = [];
      state.usersLoading = false;
      state.usersError = null;
      state.totalPages = 0;
      state.currentPage = 0;
      state.totalElements = 0;
      state.pageSize = 10;
      
      state.accountActivity = [];
      state.activityLoading = false;
      state.activityError = null;
      
      state.userRoles = null;
      state.rolesLoading = false;
      state.rolesError = null;
      
      // Clear cached data from AsyncStorage
      // Note: This is async but we don't need to wait for it
      const clearAsyncStorage = async () => {
        try {
          // Get all keys from AsyncStorage
          const keys = await AsyncStorage.getAllKeys();
          
          // Filter keys related to users
          const userKeys = keys.filter(key => 
            key.startsWith('users_page_') || 
            key === 'account_activity' ||
            key === 'user_roles'
          );
          
          // Remove all user-related keys
          if (userKeys.length > 0) {
            await AsyncStorage.multiRemove(userKeys);
          }
          console.log('🗑️ Cleared user data from AsyncStorage');
        } catch (error) {
          console.error('❌ Error clearing users AsyncStorage:', error);
        }
      };
      
      clearAsyncStorage();
    },
    clearUsers: (state) => {
      state.users = [];
      state.usersError = null;
      state.accountActivity = [];
      state.activityError = null;
      state.userRoles = null;
      state.rolesError = null;
      
      // Clear cached data
      AsyncStorage.multiRemove([
        ...Object.keys(AsyncStorage).filter(key => key.startsWith('users_page_')),
        'account_activity',
        'user_roles'
      ]);
    },
    updateUserStatus: (state, action) => {
      const { userId, active } = action.payload;
      const user = state.users.find((u) => u.id === userId);
      if (user) {
        user.active = active;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // ==================== USERS CASES ====================
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.usersLoading = true;
        state.usersError = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.users = action.payload.content;
        state.totalPages = action.payload.page.totalPages;
        state.currentPage = action.payload.page.number;
        state.totalElements = action.payload.page.totalElements;
        state.pageSize = action.payload.page.size;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.usersLoading = false;
        state.usersError = action.payload as string || 'Failed to fetch users';
      })
      // Load cached users
      .addCase(loadCachedUsers.pending, (state) => {
        state.usersLoading = true;
        state.usersError = null;
      })
      .addCase(loadCachedUsers.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.users = action.payload.users;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
        state.totalElements = action.payload.totalElements;
        state.pageSize = action.payload.pageSize;
      })
      .addCase(loadCachedUsers.rejected, (state, action) => {
        state.usersLoading = false;
        state.usersError = action.payload as string;
      })
      // Add user
      .addCase(addUser.pending, (state) => {
        state.usersLoading = true;
        state.usersError = null;
      })
      .addCase(addUser.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.users.unshift(action.payload); // Add to beginning
        state.totalElements += 1;
      })
      .addCase(addUser.rejected, (state, action) => {
        state.usersLoading = false;
        state.usersError = action.payload as string;
      })
      
      // ==================== ACTIVITY CASES ====================
      .addCase(fetchAccountActivity.pending, (state) => {
        state.activityLoading = true;
        state.activityError = null;
      })
      .addCase(fetchAccountActivity.fulfilled, (state, action) => {
        state.activityLoading = false;
        state.accountActivity = action.payload;
      })
      .addCase(fetchAccountActivity.rejected, (state, action) => {
        state.activityLoading = false;
        state.activityError = action.payload as string;
      })
      
      // ==================== ROLES CASES ====================
      .addCase(fetchUserRoles.pending, (state) => {
        state.rolesLoading = true;
        state.rolesError = null;
      })
      .addCase(fetchUserRoles.fulfilled, (state, action) => {
        state.rolesLoading = false;
        state.userRoles = action.payload;
      })
      .addCase(fetchUserRoles.rejected, (state, action) => {
        state.rolesLoading = false;
        state.rolesError = action.payload as string;
      });
  },
});

export const { 
  resetUsers, // Add this export
  clearUsers, 
  updateUserStatus,
} = userSlice.actions;

export default userSlice.reducer;