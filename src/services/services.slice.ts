import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { getEmployeeProfile } from './services.action';
import { profile } from '../interfaces/profile';

export interface ServicesState {
    cities: any[],
    profile: profile[]
} 
const initialState: ServicesState = {
    cities: [],
    profile: []
}
export const serviceSlice = createSlice({
    name: 'employee',
    initialState,
    reducers: {
        reset: () => initialState,
    },
    extraReducers: (builder) => {
       
        builder.addCase(getEmployeeProfile.fulfilled, (state, action: PayloadAction<any>) => {
            const profile:  profile[] = action.payload.profile;
            return {
                ...state,
                profile
            }
        })
    }  
})
export const { reset } = serviceSlice.actions;
export default serviceSlice.reducer;