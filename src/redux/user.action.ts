import { createAsyncThunk } from "@reduxjs/toolkit";
import {getEmployeeLoginDetails, updateEmployeeLoginDetails, updateUserTimeLog } from "./user.services";


export const loginDetails = createAsyncThunk(
    'user/login',
    async (data: any) => {
        return await getEmployeeLoginDetails(data);
    } 
)

//====
export const signUpDetails = createAsyncThunk(
    'user/signUp',
    async (data: any) => {
        return data;
    } 
)


//==





export const updateLoginDetails = createAsyncThunk(
    'user/updateLogin',
    async (formData: any, {getState}: any) => {

        console.log("getState***********", getState(),formData);
         const { user } = getState(); // get state
         console.log("userdetails:::::",formData);
         return await updateEmployeeLoginDetails(formData);
        
        // formData = {...formData, userAccountId: user.data.id} // set userAccountId
        // let addressList = [...address.data];

    }
)
export const updateTimeLog = createAsyncThunk(
    'user/updateTimeLog',
    async (formData: any, {getState}: any) => {

        console.log("getState22222222222***********", getState(),formData);
         const { user } = getState(); // get state
         console.log("updateUserTimeLogupdateUserTimeLog formdata:::::",formData);
         return await updateUserTimeLog(formData);
        
        // formData = {...formData, userAccountId: user.data.id} // set userAccountId
        // let addressList = [...address.data];

    }
)


// export const getAllCitiesByProvince = createAsyncThunk(
//     'address/allCitiesByProvince',
//     async (provinceId: number) => {
//         return await getAllCityByProvinceApi(provinceId);
//     }
// )
// export const getAllBarangayByCity = createAsyncThunk(
//     'address/allBarangaysByCity',
//     async (cityId: number) => {
//         return await getAllBarangayByCityApi(cityId)
//     }
// )

// export const checkUserLocation  = createAsyncThunk(
//     'location/checkdevice',
//     async () => {
//         return await checkUserLocationEnabled()
//     }
// )