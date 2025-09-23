import axios from 'axios';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';


const createAxiosInstance = (baseURL: string) => {
    console.log("base url::::",baseURL);
    const instance = axios.create({ 
        baseURL, 
        headers:{
            'Content-Type': 'application/json; charset=UTF-8',
            Accept: 'application/json'
        },
        timeout: 30000 // 30 seconds,
    });

    instance.interceptors.request.use(async (config) => {
       
    // set access token from storage then use it to Authorization header
    const token = await AsyncStorage.getItem('ACCESSTOKEN')
    if(token && config.url !== '/SignIn'){
        config.headers.Authorization =  `Bearer ${token}`;
    }
    console.log("configure::::",config);
      return config;
    });
    
    // every request always set authorization token from the user storage/state
    instance.interceptors.response.use(
        res => res,
        err => {
            const { message, details } = err.response.data;
            console.log("message error url::::",message,details);
            // if(message)
            // {
            //     if(!details.includes("Invalid city"))
            //     Alert.alert(message, details);  // I use the default alert for now, next time I will change it
            // }
            
        }
    );
    return instance;
}
// const baseURL = createAxiosInstance('https://dev-otsi-ems-api.azurewebsites.net/'); // staging
const baseURL = createAxiosInstance('https://otsi-portal.azurewebsites.net/'); // production





export { baseURL}