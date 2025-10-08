// store/slices/notificationsSlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import urls from '../../utils/http/urls';

const API_BASE_URL = urls.API_BASE_URL;

export interface Notification {
  id: number;
  bookingId: number;
  bookingStatus: 'SCHEDULED' | 'IN_PROGRESS' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  contactName: string;
  contactPhone: string;
  remarks: string;
  channel: 'SMS' | 'EMAIL';
  success: boolean;
  error: string | null;
  sentAt: string;
  read?: boolean; // Add this optional property
}

interface PageInfo {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

interface FetchNotificationsResponse {
  content: Notification[];
  page: PageInfo;
}

interface NotificationsState {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  totalElements: number;
  pageSize: number;
  unreadCount: number;
  readNotifications: number[]; // Add this to track read notifications
}

const initialState: NotificationsState = {
  notifications: [],
  loading: false,
  error: null,
  totalPages: 0,
  currentPage: 0,
  totalElements: 0,
  pageSize: 20,
  unreadCount: 0,
  readNotifications: [], // Initialize read notifications array
};

// Fetch notifications with pagination
export const fetchNotifications = createAsyncThunk<
  FetchNotificationsResponse,
  { page?: number; size?: number },
  { state: any }
>(
  'notifications/fetchNotifications',
  async ({ page = 0, size = 20 }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = state.auth.accessToken;

      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        params: { page, size },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Save to AsyncStorage for offline access
      await AsyncStorage.setItem(`notifications_page_${page}`, JSON.stringify(response.data));

      return response.data;
    } catch (err: any) {
      // Load cached data if offline
      const cached = await AsyncStorage.getItem(`notifications_page_${page}`);
      if (cached) {
        return JSON.parse(cached);
      }

      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data || 'Failed to fetch notifications');
      }
      return rejectWithValue('An unexpected error occurred');
    }
  }
);

// Load cached notifications - FIXED return type
export const loadCachedNotifications = createAsyncThunk(
  'notifications/loadCachedNotifications',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const existingReadNotifications = state.notifications.readNotifications || [];
      
      const notifications: Notification[] = [];
      let currentPage = 0;
      let totalPages = 0;
      let totalElements = 0;
      let pageSize = 20;

      // Load first page for initial display
      const cached = await AsyncStorage.getItem(`notifications_page_0`);
      if (cached) {
        const pageData: FetchNotificationsResponse = JSON.parse(cached);
        
        // Mark notifications as read based on stored readNotifications
        const notificationsWithReadStatus = pageData.content.map(notification => ({
          ...notification,
          read: existingReadNotifications.includes(notification.id)
        }));
        
        notifications.push(...notificationsWithReadStatus);
        totalPages = pageData.page.totalPages;
        totalElements = pageData.page.totalElements;
        pageSize = pageData.page.size;
        currentPage = 0;
      }

      // Load read notifications from storage
      const readNotificationsStorage = await AsyncStorage.getItem('read_notifications');
      const readNotifications = readNotificationsStorage 
        ? JSON.parse(readNotificationsStorage) 
        : existingReadNotifications;

      // Calculate unread count
      const unreadCount = notifications.filter(n => !n.read).length;

      return {
        notifications,
        totalPages,
        currentPage,
        totalElements,
        pageSize,
        unreadCount,
        readNotifications,
        loading: false,
        error: null,
      };
    } catch (err) {
      return rejectWithValue('Failed to load cached notifications');
    }
  }
);

// Mark notification as read - FIXED implementation
export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId: number, { getState }) => {
    const state = getState() as any;
    const currentReadNotifications = state.notifications.readNotifications || [];
    
    // Add to read notifications if not already there
    if (!currentReadNotifications.includes(notificationId)) {
      const updatedReadNotifications = [...currentReadNotifications, notificationId];
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('read_notifications', JSON.stringify(updatedReadNotifications));
      
      return notificationId;
    }
    
    return notificationId;
  }
);

// Clear all notifications
export const clearAllNotifications = createAsyncThunk(
  'notifications/clearAll',
  async (_, { rejectWithValue }) => {
    try {
      // Clear from AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const notificationKeys = keys.filter(key => key.startsWith('notifications_page_'));
      await AsyncStorage.multiRemove(notificationKeys);
      await AsyncStorage.removeItem('read_notifications');
      
      return;
    } catch (err) {
      return rejectWithValue('Failed to clear notifications');
    }
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // Reset the entire notifications slice to initial state
    resetNotifications: (state) => {
      // Reset all state to initial values
      state.notifications = [];
      state.loading = false;
      state.error = null;
      state.totalPages = 0;
      state.currentPage = 0;
      state.totalElements = 0;
      state.pageSize = 20;
      state.unreadCount = 0;
      state.readNotifications = [];
      
      // Clear cached data from AsyncStorage
      // Note: This is async but we don't need to wait for it
      const clearAsyncStorage = async () => {
        try {
          // Get all keys from AsyncStorage
          const keys = await AsyncStorage.getAllKeys();
          
          // Filter keys related to notifications
          const notificationKeys = keys.filter(key => 
            key.startsWith('notifications_page_') || 
            key === 'read_notifications'
          );
          
          // Remove all notification-related keys
          if (notificationKeys.length > 0) {
            await AsyncStorage.multiRemove(notificationKeys);
          }
        } catch (error) {
          console.error('Error clearing notifications AsyncStorage:', error);
        }
      };
      
      clearAsyncStorage();
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.error = null;
      state.totalPages = 0;
      state.currentPage = 0;
      state.totalElements = 0;
      state.unreadCount = 0;
      state.readNotifications = [];
    },
    markNotificationRead: (state, action) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n.id === notificationId);
      
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
        
        // Add to read notifications array if not already there
        if (!state.readNotifications.includes(notificationId)) {
          state.readNotifications.push(notificationId);
        }
      }
    },
    resetUnreadCount: (state) => {
      state.unreadCount = 0;
    },
    setReadNotifications: (state, action) => {
      state.readNotifications = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        
        // Merge new notifications with existing read status
        const newNotifications = action.payload.content.map(notification => ({
          ...notification,
          read: state.readNotifications.includes(notification.id)
        }));
        
        state.notifications = newNotifications;
        state.totalPages = action.payload.page.totalPages;
        state.currentPage = action.payload.page.number;
        state.totalElements = action.payload.page.totalElements;
        state.pageSize = action.payload.page.size;
        
        // Update unread count
        state.unreadCount = newNotifications.filter(n => !n.read).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch notifications';
      })
      // Load cached notifications - FIXED
      .addCase(loadCachedNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
        state.totalElements = action.payload.totalElements;
        state.pageSize = action.payload.pageSize;
        state.unreadCount = action.payload.unreadCount;
        state.readNotifications = action.payload.readNotifications;
      })
      .addCase(loadCachedNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Mark as read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notificationId = action.payload;
        const notification = state.notifications.find(n => n.id === notificationId);
        
        if (notification && !notification.read) {
          notification.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
          
          if (!state.readNotifications.includes(notificationId)) {
            state.readNotifications.push(notificationId);
          }
        }
      })
      // Clear all notifications
      .addCase(clearAllNotifications.fulfilled, (state) => {
        state.notifications = [];
        state.unreadCount = 0;
        state.totalElements = 0;
        state.currentPage = 0;
        state.totalPages = 0;
        state.readNotifications = [];
      });
  },
});

export const { 
  resetNotifications, // Add this export
  clearNotifications, 
  markNotificationRead, 
  resetUnreadCount,
  setReadNotifications 
} = notificationsSlice.actions;
export default notificationsSlice.reducer;