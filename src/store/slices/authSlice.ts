import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5577/api/v1';

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: any;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  user: null,
  loading: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { username: string; password: string }) => {
    const payload = {
      username: credentials.username,
      password: credentials.password,
      deviceId: '',
      client: 'MOBILE',
    };

    const response = await axios.post(`${API_BASE_URL}/auth/login`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    return response.data;
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (
    {
      accessToken,
      refreshToken,
    }: { accessToken: string; refreshToken: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/logout`,
        {
          refreshToken,
          client: 'MOBILE',
          allSessions: true,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || 'Logout failed');
    }
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
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;

        const payload = action.payload as {
          accessToken: string;
          refreshToken: string;
          tokenType: string;
          expiresInSeconds: number;
        };

        state.accessToken = payload.accessToken;
        state.refreshToken = payload.refreshToken;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.accessToken = null;
        state.refreshToken = null;
        state.user = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;