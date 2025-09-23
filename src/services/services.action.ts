import { createAsyncThunk } from "@reduxjs/toolkit";
import {getEmployeeDetails, postChangePassword, getAllTechnology,
    getEmployeeSkills,postEmpSkill, postClockIn, postClockOut, getEmployeeLeaveBalance, 
    getPendingLeaveList, postEmpLeave, getPendingLeaves, postCancelEmployeeLeave, postManagerApproveRejectLeave } from "./services";


export const changePassword = createAsyncThunk(
    'employee/login',
    async (data: any) => {
        return await postChangePassword(data);
    } 
)

export const submitTimeLogClockIn = createAsyncThunk(
    'employee/timeLog/clockin',
    async (data: any) => {
        return await postClockIn(data);
    } 
)
export const submitTimeLogClockOut = createAsyncThunk(
    'employee/timeLog/clockout',
    async (data: any) => {
        return await postClockOut(data);
    } 
)

export const getEmployeeProfile = createAsyncThunk(
    'employee/details',
    async (id: number) => {
        return await getEmployeeDetails(id);
    } 
)
export const getTechnologyList = createAsyncThunk(
    'employee/allTechnology',
    async () => {
        return await getAllTechnology();
    } 
)
export const getSkillList = createAsyncThunk(
    'employee/skills',
    async (id: number) => {
        return await getEmployeeSkills(id);
    } 
)
export const postEmployeeSkill = createAsyncThunk(
    'employee/skills/post',
    async (data: any) => {
        return await postEmpSkill(data);
    } 
)

export const getLeaveBalance = createAsyncThunk(
    'employee/leaveBalance',
    async (id: number) => {
        return await getEmployeeLeaveBalance(id);
    } 
)

export const getManagerPendingLeaves = createAsyncThunk(
    'employee/managerPendingLeaves',
    async (id: number) => {
        return await getPendingLeaveList(id);
    } 
)

export const applyLeave = createAsyncThunk(
    'employee/postEmployeeLeave',
    async (data: any) => {
        return await postEmpLeave(data);
    } 
)

export const getEmployeePendingLeaves = createAsyncThunk(
    'employee/getEmployeePendingLeaves',
    async (data: any) => {
        return await getPendingLeaves(data);
    } 
)
export const cancelEmployeeLeaves = createAsyncThunk(
    'employee/cancelEmployeeLeave',
    async (data: any) => {
        return await postCancelEmployeeLeave(data);
    } 
)

export const approveManagerPendingLeaves = createAsyncThunk(
    'employee/approveManagerPendingLeaves',
    async (data: any) => {
        return await postManagerApproveRejectLeave(data);
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