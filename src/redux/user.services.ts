import { Alert, Linking, PermissionsAndroid, Platform } from "react-native"
// import { BarangayResponseData } from "../interfaces/address/BarangayResponseData"
// import { CityResponseData } from "../interfaces/address/CityResponseData"
import { baseURL } from "../utils/http"
//import Geolocation from 'react-native-geolocation-service';

export const getEmployeeLoginDetails = async (data: any) => {
    const response = await baseURL.post(`/api/Auth/SignIn`, data)
    console.log("response:::::",response);
    return response.data
}
//--
export const getSingUpSubmit = async (data: any) => {
    const response = await baseURL.post(`/api/Auth/SignUp`, data)
    console.log("response:::::",response);
    return response
}


export const VerifyOtpAndSetPassword = async (data: any) => {
    const response = await baseURL.post(`/api/Auth/VerifyOtpAndSetPassword`, data)
    console.log("response:::::",response);
    return response
}

export const getEmployeeDetails = async (employeeId: string | number) => {
  try {
    const response = await baseURL.get(`/api/Employee/Employee/${employeeId}`);
    console.log("response:::::", response);
    return response;
  } catch (error) {
    console.error("Error fetching employee details:", error);
    throw error;  // so caller can handle it
  }
}






export const updateEmployeeLoginDetails = async (data: any) => {
    console.log("updateEmployeeLoginDetails::::::",data);
    return data;
    // const response = await baseURL.post(`/SignIn`, data)
    // console.log("response:::::",response);
    // return response.data
}

export const updateUserTimeLog = async (data: any) => {
    console.log("updateUserTimeLogupdateUserTimeLog::::::",data);
    return data;
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