import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import urls from '../../utils/http/urls';

const API_BASE_URL = urls.API_BASE_URL;

export interface Order {
  id: number;
  yardId: number;
  herdId: number | null;
  requestedBy: number | null;
  source: string;
  contactName: string;
  contactPhone: string;
  requestedHerdType: string;
  requestedHeadCount: number;
  startTime: string;
  endTime: string;
  status: string;
  remarks: string | null;
}

export interface OrderStats {
  total: number;
  scheduled: number;
  inProgress: number;
  completed: number;
}

interface PageInfo {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

interface FetchOrdersResponse {
  content: Order[];
  page: PageInfo;
}

interface OrderState {
  orders: Order[];
  orderStats: OrderStats | null;
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  totalElements: number;
  pageSize: number;
}

const initialState: OrderState = {
  orders: [],
  orderStats: null,
  loading: false,
  error: null,
  totalPages: 0,
  currentPage: 0,
  totalElements: 0,
  pageSize: 4,
};

// Fetch order stats from /bookings/kpis
export const fetchOrderStats = createAsyncThunk<OrderStats, void, { state: any }>(
  'order/fetchOrderStats',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.auth.accessToken;

      console.log('📊 Fetching order stats...');
      const response = await axios.get(`${API_BASE_URL}/bookings/kpis`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('✅ Order stats received:', response.data);
      
      // Cache order stats
      await AsyncStorage.setItem('orderStats', JSON.stringify(response.data));

      return response.data;
    } catch (err: any) {
      console.log('❌ Error fetching order stats:', err);
      
      // Try loading from cache if offline
      try {
        const cached = await AsyncStorage.getItem('orderStats');
        if (cached) {
          console.log('📱 Using cached order stats');
          return JSON.parse(cached);
        }
      } catch (cacheError) {
        console.log('❌ Cache error:', cacheError);
      }

      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch order stats');
      }
      return rejectWithValue('An unexpected error occurred');
    }
  }
);

// Fetch orders with pagination from /bookings
export const fetchOrders = createAsyncThunk<
  FetchOrdersResponse,
  { page?: number; size?: number; sort?: string },
  { state: any }
>(
  'order/fetchOrders',
  async ({ page = 0, size = 4, sort = 'startTime,desc' }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.auth.accessToken;

      console.log(`📦 Fetching orders page ${page}, size ${size}...`);
      
      const response = await axios.get(`${API_BASE_URL}/bookings`, {
        params: { 
          page, 
          size, 
          sort 
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`✅ Orders received: ${response.data.content.length} orders`);
      
      // Save each page in AsyncStorage with timestamp
      const cacheData = {
        ...response.data,
        cachedAt: new Date().toISOString()
      };
      await AsyncStorage.setItem(`orders_page_${page}`, JSON.stringify(cacheData));

      return response.data;
    } catch (err: any) {
      console.log('❌ Error fetching orders:', err);
      
      // Load cached page if offline
      try {
        const cached = await AsyncStorage.getItem(`orders_page_${page}`);
        if (cached) {
          console.log(`📱 Using cached orders for page ${page}`);
          const cachedData = JSON.parse(cached);
          return cachedData;
        }
      } catch (cacheError) {
        console.log('❌ Cache error:', cacheError);
      }

      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.message || 'Failed to fetch orders';
        console.log('📡 API Error:', errorMessage);
        return rejectWithValue(errorMessage);
      }
      return rejectWithValue('An unexpected error occurred');
    }
  }
);

// Load cached orders for offline support
export const loadCachedOrders = createAsyncThunk(
  'order/loadCachedOrders',
  async (_, { rejectWithValue }) => {
    try {
      console.log('📱 Loading cached orders...');
      
      const orders: Order[] = [];
      let currentPage = 0;
      let totalPages = 0;
      let totalElements = 0;
      let pageSize = 4;

      // Load the first page for initial display
      const cached = await AsyncStorage.getItem(`orders_page_0`);
      if (cached) {
        const pageData: FetchOrdersResponse & { cachedAt?: string } = JSON.parse(cached);
        orders.push(...pageData.content);
        totalPages = pageData.page.totalPages;
        totalElements = pageData.page.totalElements;
        pageSize = pageData.page.size;
        currentPage = 0;
        
        console.log(`📱 Loaded ${orders.length} cached orders`);
        
        if (pageData.cachedAt) {
          console.log(`📱 Data cached at: ${pageData.cachedAt}`);
        }
      }

      // Load cached stats
      let orderStats = null;
      const cachedStats = await AsyncStorage.getItem('orderStats');
      if (cachedStats) {
        orderStats = JSON.parse(cachedStats);
        console.log('📱 Loaded cached order stats');
      }

      return {
        orders,
        totalPages,
        currentPage,
        totalElements,
        pageSize,
        orderStats,
        loading: false,
        error: null,
      };
    } catch (err) {
      console.log('❌ Error loading cached orders:', err);
      return rejectWithValue('Failed to load cached orders');
    }
  }
);

// Update order status
export const updateOrderStatus = createAsyncThunk<
  Order,
  { orderId: number; status: string },
  { state: any }
>(
  'order/updateOrderStatus',
  async ({ orderId, status }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.auth.accessToken;

      console.log(`🔄 Updating order ${orderId} status to ${status}...`);
      
      const response = await axios.patch(
        `${API_BASE_URL}/bookings/${orderId}/status`,
        { status },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ Order status updated successfully');
      return response.data;
    } catch (err: any) {
      console.log('❌ Error updating order status:', err);
      
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data?.message || 'Failed to update order status');
      }
      return rejectWithValue('An unexpected error occurred');
    }
  }
);

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    // Reset the entire order slice to initial state
    resetOrders: (state) => {
      // Reset all state to initial values
      state.orders = [];
      state.orderStats = null;
      state.loading = false;
      state.error = null;
      state.totalPages = 0;
      state.currentPage = 0;
      state.totalElements = 0;
      state.pageSize = 4;
      
      // Clear cached data from AsyncStorage
      // Note: This is async but we don't need to wait for it
      const clearAsyncStorage = async () => {
        try {
          // Get all keys from AsyncStorage
          const keys = await AsyncStorage.getAllKeys();
          
          // Filter keys related to orders
          const orderKeys = keys.filter(key => 
            key.startsWith('orders_page_') || 
            key === 'orderStats'
          );
          
          // Remove all order-related keys
          if (orderKeys.length > 0) {
            await AsyncStorage.multiRemove(orderKeys);
          }
          console.log('🗑️ Cleared order data from AsyncStorage');
        } catch (error) {
          console.error('❌ Error clearing orders AsyncStorage:', error);
        }
      };
      
      clearAsyncStorage();
    },
    clearOrders: (state) => {
      state.orders = [];
      state.orderStats = null;
      state.error = null;
      state.totalPages = 0;
      state.currentPage = 0;
      state.totalElements = 0;
    },
    setOrderStatus: (state, action) => {
      const { orderId, status } = action.payload;
      const order = state.orders.find((o) => o.id === orderId);
      if (order) {
        order.status = status;
      }
    },
    clearOrdersList: (state) => {
      state.orders = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Order stats
      .addCase(fetchOrderStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderStats.fulfilled, (state, action) => {
        state.loading = false;
        state.orderStats = action.payload;
      })
      .addCase(fetchOrderStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Orders
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.content;
        state.totalPages = action.payload.page.totalPages;
        state.currentPage = action.payload.page.number;
        state.totalElements = action.payload.page.totalElements;
        state.pageSize = action.payload.page.size;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Load cached orders
      .addCase(loadCachedOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadCachedOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.orders;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
        state.totalElements = action.payload.totalElements;
        state.pageSize = action.payload.pageSize;
        state.orderStats = action.payload.orderStats;
      })
      .addCase(loadCachedOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update order status
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const updatedOrder = action.payload;
        const index = state.orders.findIndex(order => order.id === updatedOrder.id);
        if (index !== -1) {
          state.orders[index] = updatedOrder;
        }
      });
  },
});

export const { 
  resetOrders, // Add this export
  clearOrders, 
  setOrderStatus, 
  clearOrdersList, 
  clearError 
} = orderSlice.actions;

export default orderSlice.reducer;