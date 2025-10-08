import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { persistReducer, persistStore } from 'redux-persist';

import authReducer from './slices/authSlice';
import dashboardReducer from './slices/dashboardSlice';
import yardsReducer from './slices/yardsSlice';
import livestockReducer from './slices/livestockSlice';
import rosterReducer from './slices/rosterSlice';
import orderReducer from './slices/orderSlice';
import notificationsReducer from './slices/notificationsSlice';
import usersSlice from './slices/userSlice'; 


const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'roster', 'yards', 'livestock', 'order','notifications',], // Add 'order' to whitelist
};

const rootReducer = combineReducers({
  auth: authReducer,
  dashboard: dashboardReducer,
  yards: yardsReducer,
  roster: rosterReducer,
  livestock: livestockReducer,
  order: orderReducer, 
  notifications: notificationsReducer,
  users: usersSlice, // Add users slice here
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

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

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;