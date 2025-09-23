import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { loginDetails, updateLoginDetails,updateTimeLog } from './user.action'
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserState {
  details: {
    designation : string,
    emailId : string,
    employeeId : number,
    expiration : string,
    mustChangePassword : boolean,
    name : string,
    role : string,
    token : string,
  },
  timeLog:{
    deviceID: string,
    employeeId : string,
    clockInTimestamp: string,
    location: string, 
    notes: string,
    status: string,
    event: string,
    employeeTimeLogId: string,
    clockOutTimestamp: string
  }
}

const initialState: UserState = {
  details: {
    designation : "",
    emailId : "",
    employeeId : 0,
    expiration : "",
    mustChangePassword : true,
    name : "",
    role : "",
    token : "",
  },
  timeLog: {
    deviceID: "",
    employeeId : "",
    event: "",
    clockInTimestamp: "",
    location: "", 
    notes: "",
    employeeTimeLogId: "",
    status: "",
    clockOutTimestamp:""
  }
}

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    reset: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(loginDetails.fulfilled, (state, action: PayloadAction<any>) => {
        console.log("loginnnnnn action.payload*********************%%%%%%%%%%%%%%$$$$$$$$$$$$$$::::", action.payload)
       AsyncStorage.setItem("ACCESSTOKEN", action.payload.token);
        return {
            ...state,
            details: action.payload
        }
    }),
    builder.addCase(updateLoginDetails.fulfilled, (state, action: PayloadAction<any>) => {
      console.log("updateLoginDetailsupdateLoginDetailsupdateLoginDetails action.payload::::", action.payload)
      return {
          ...state,
          details: action.payload
      }
    }),
    builder.addCase(updateTimeLog.fulfilled, (state, action: PayloadAction<any>) => {
      console.log("submitTimeLogsubmitTimeLogsubmitTimeLogsubmitTimeLog action.payload::::", action.payload)
      return {
          ...state,
          timeLog: action.payload
      }
    })
  
    
} 
})

// Action creators are generated for each case reducer function
export const { reset } = userSlice.actions

export default userSlice.reducer