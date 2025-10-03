import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { persistReducer, persistStore } from 'redux-persist';

import authReducer from './slices/authSlice';
import dashboardReducer from './slices/dashboardSlice';
import yardsReducer from './slices/yardsSlice';
import livestockReducer from './slices/livestockSlice';
import rosterSlice from './slices/rosterSlice';


const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
 whitelist: ['auth', 'roster', 'yards', 'livestock'], // Only persist auth state
};

const rootReducer = combineReducers({
  auth: authReducer,
  dashboard: dashboardReducer,
  yards: yardsReducer,
   roster: rosterSlice,
  livestock: livestockReducer,
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