import { Alert, Linking, PermissionsAndroid, Platform } from "react-native"
// import { BarangayResponseData } from "../interfaces/address/BarangayResponseData"
// import { CityResponseData } from "../interfaces/address/CityResponseData"
import { baseURL } from "../utils/http"
//import Geolocation from 'react-native-geolocation-service';

export const postChangePassword = async (data: any) => {
    const response = await baseURL.post(`/ChangePassword`, data)
    return response.status;
}

export const postClockIn = async (data: any) => {
    const response = await baseURL.post(`/TimeLog/ClockIn`, data)
    console.log("ClockIn response:::::",response.data);
    return response.data;
}
export const postClockOut = async (data: any) => {
    const response = await baseURL.post(`/TimeLog/ClockOut`, data)
    console.log("ClockOut response:::::",response);
    return response.data;
}



export const getEmployeeDetails = async (id: number) => {
    const response = await baseURL.get(`Employee/${id}`)
    return response.data
}
export const getAllTechnology = async () => {
    const response = await baseURL.get(`Technology`)
    return response.data
}
export const getEmployeeSkills = async (id:number) => {
    const response = await baseURL.get(`/Skill/${id}`)
    return response.data
}
export const postEmpSkill = async (data: any) => {
    const response = await baseURL.post(`/Skill`, data)
    console.log("postEmpSkill response:::::",response);
    return response.data;
}

export const getEmployeeLeaveBalance = async (id:number) => {
    const response = await baseURL.get(`/api/Leave/LeaveBalance/Employee/${id}`)
    return response.data
}

export const getPendingLeaveList = async (id:number) => {
    const response = await baseURL.get(`/PendingLeaves/Manager`)
    return response.data
}

export const postEmpLeave = async (data: any) => {
    const response = await baseURL.post(`/Leave`, data)
    console.log("postEmpLeave response:::::",response);
    return response.status;
}

export const getPendingLeaves = async (id:number) => {
    const response = await baseURL.get(`/LeaveHistory/Employee/${id}`)
    return response.data
}

export const postCancelEmployeeLeave = async (data: any) => {
    const response = await baseURL.post(`/Leaves/Cancel`, data);
    console.log("postCancelEmployeeLeave response:::::",response);
    return response.status;
}

export const postManagerApproveRejectLeave = async (data: any) => {
    const response = await baseURL.post(`/Leaves/Approve`, data)
    return response.status;
}




// export const getAllCityByProvinceApi = async (id: number) => {
//     const response = await httpCore.get<CityResponseData>(`locations/provinces/${id}/cities`)
//     return response.data.cities
// }

// export const getAllBarangayByCityApi = async (id: number) => {
//     const response = await httpCore.get<BarangayResponseData>(`locations/cities/${id}/barangays`)
//     return response.data.barangays
// }

// export const checkUserLocationEnabled = async () => {
//     if (Platform.OS === 'ios') {
//         const auth = await Geolocation.requestAuthorization("whenInUse");
//         return auth;
        
//     } else {
//         const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
//         return granted;
//     }
// }