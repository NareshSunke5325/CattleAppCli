import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import urls from '../../utils/http/urls';

const API_BASE_URL = urls.API_BASE_URL;

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: any;
  loading: boolean;
  error: string | null;
  rememberMe: boolean;
  lastLogin: string | null;
  offlineMode: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  user: null,
  loading: false,
  error: null,
  rememberMe: false,
  lastLogin: null,
  offlineMode: false,
};

// AsyncStorage configuration for redux-persist
const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['isAuthenticated', 'accessToken', 'refreshToken', 'user', 'rememberMe', 'lastLogin', 'offlineMode'],
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (
    credentials: { 
      username: string; 
      password: string; 
      rememberMe?: boolean;
    }, 
    { rejectWithValue }
  ) => {
    try {
      const payload = {
        username: credentials.username,
        password: credentials.password,
        deviceId: '',
        client: 'MOBILE',
      };

      const response = await axios.post(`${API_BASE_URL}/auth/login`, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000, // 10 seconds timeout
      });

      return {
        ...response.data,
        rememberMe: credentials.rememberMe || false,
        username: credentials.username,
      };
    } catch (err: any) {
      // Check if it's a network error for offline mode
      if (err.code === 'NETWORK_ERROR' || err.message?.includes('Network Error')) {
        return rejectWithValue('Network error. Please check your connection.');
      }
      return rejectWithValue(err.response?.data || 'Login failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (
    {
      accessToken,
      refreshToken,
      allSessions = false
    }: { 
      accessToken: string; 
      refreshToken: string;
      allSessions?: boolean;
    }, 
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/logout`,
        {
          refreshToken,
          client: 'MOBILE',
          allSessions: allSessions,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );

      return response.data;
    } catch (err: any) {
      // Even if logout API fails, we still clear local state
      // So we don't reject the action, we fulfill it with offline data
      return { offline: true, message: 'Offline logout completed' };
    }
  }
);

// Thunk to check token validity and handle offline mode
export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { getState, dispatch }) => {
    const state = getState() as { auth: AuthState };
    const { accessToken, refreshToken, rememberMe, lastLogin } = state.auth;

    // If no tokens, not authenticated
    if (!accessToken || !refreshToken) {
      return { isValid: false, offline: false };
    }

    // Check if token is expired (basic check - you might want to use JWT decode)
    if (lastLogin) {
      const loginTime = new Date(lastLogin).getTime();
      const currentTime = new Date().getTime();
      const hoursSinceLogin = (currentTime - loginTime) / (1000 * 60 * 60);
      
      // If token is older than 24 hours and rememberMe is false, auto logout
      if (!rememberMe && hoursSinceLogin > 24) {
        dispatch(logout());
        return { isValid: false, offline: false };
      }
    }

    // If rememberMe is true and we have tokens, allow offline access
    if (rememberMe) {
      return { isValid: true, offline: true };
    }

    return { isValid: true, offline: false };
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.isAuthenticated = false;
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.error = null;
      state.rememberMe = false;
      state.lastLogin = null;
      state.offlineMode = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    setTokens: (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      state.lastLogin = new Date().toISOString();
    },
    setOfflineMode: (state, action: PayloadAction<boolean>) => {
      state.offlineMode = action.payload;
    },
    setRememberMe: (state, action: PayloadAction<boolean>) => {
      state.rememberMe = action.payload;
    },
    // Action to restore auth state from storage
    restoreAuthState: (state, action: PayloadAction<Partial<AuthState>>) => {
      return {
        ...state,
        ...action.payload,
        loading: false,
        error: null,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.offlineMode = false;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;

        const payload = action.payload as {
          accessToken: string;
          refreshToken: string;
          tokenType: string;
          expiresInSeconds: number;
          rememberMe: boolean;
          username: string;
        };

        state.accessToken = payload.accessToken;
        state.refreshToken = payload.refreshToken;
        state.user = { username: payload.username };
        state.rememberMe = payload.rememberMe;
        state.lastLogin = new Date().toISOString();
        state.offlineMode = false;
        state.error = null;

        console.log('Login successful - Remember Me:', payload.rememberMe);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Login failed';
        state.isAuthenticated = false;
        state.accessToken = null;
        state.refreshToken = null;
        state.user = null;
        state.rememberMe = false;
        state.offlineMode = false;
      })
      
      // Logout cases
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.accessToken = null;
        state.refreshToken = null;
        state.user = null;
        state.error = null;
        state.rememberMe = false;
        state.lastLogin = null;
        state.offlineMode = false;
      })
      .addCase(logoutUser.rejected, (state) => {
        // Even if logout API fails, clear local auth state
        state.loading = false;
        state.isAuthenticated = false;
        state.accessToken = null;
        state.refreshToken = null;
        state.user = null;
        state.error = null;
        state.rememberMe = false;
        state.lastLogin = null;
        state.offlineMode = false;
      })
      
      // Check auth status cases
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        const { isValid, offline } = action.payload;
        
        if (!isValid) {
          state.isAuthenticated = false;
          state.offlineMode = false;
        } else {
          state.isAuthenticated = true;
          state.offlineMode = offline;
        }
        
        state.loading = false;
      })
      .addCase(checkAuthStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.loading = false;
        state.offlineMode = false;
      });
  },
});

// Create persisted reducer
const persistedAuthReducer = persistReducer(authPersistConfig, authSlice.reducer);

export const { 
  logout, 
  clearError, 
  setTokens, 
  setOfflineMode, 
  setRememberMe,
  restoreAuthState 
} = authSlice.actions;

export default persistedAuthReducer;