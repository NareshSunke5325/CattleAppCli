import {Action, combineReducers, configureStore,ThunkAction } from '@reduxjs/toolkit'
import userReducer from '../user.slice'
import serviceReducer from '../../services/services.slice'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistStore, persistReducer } from 'redux-persist';

const persistConfig = {
    key: "user",
    storage: AsyncStorage,
  };
const persistedUserReducer = persistReducer(persistConfig, userReducer);

const rootReducer = combineReducers({
    user: persistedUserReducer,
    service: serviceReducer
});


export const store = configureStore({
    reducer: rootReducer,
        middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false // to read a component icon from state
    })
})
export const persistor = persistStore(store)

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export const useAppDispatch: () => AppDispatch = useDispatch 
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>
export default store;

