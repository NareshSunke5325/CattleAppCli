// store.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';

import authReducer from './slices/authSlice';
import dashboardReducer from './slices/dashBoardSlice';
import yardsReducer from './slices/yardsSlices';

// 🔹 redux-persist config
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth'], // persist only auth slice
};

// 🔹 combine all reducers
const rootReducer = combineReducers({
  auth: authReducer,
  dashboard: dashboardReducer,
  yards: yardsReducer,
});

// 🔹 wrap rootReducer with persistReducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// 🔹 configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/PAUSE',
          'persist/FLUSH',
          'persist/PURGE',
          'persist/REGISTER',
        ],
      },
    }),
});

// 🔹 persistor for redux-persist
export const persistor = persistStore(store);

// 🔹 types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
