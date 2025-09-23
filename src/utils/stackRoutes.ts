import { FC } from 'react';
import { StackNavigationOptions } from '@react-navigation/stack';
import LoginScreen from '../components/LoginScreen'
import ChangePassword from '../components/ChangePassword'
import ManagerLeaves from '../components/ManagerLeaves';
import EmployeePendingLeaves from '../components/EmployeePendingLeaves';
import SignUpScreen from '../components/SignUpScreen';
import VerifyOtpScreen from '../components/VerifyOtpScreen';


interface Route {
  name: string;
  component: FC;
  options?: StackNavigationOptions;
}
const options: StackNavigationOptions = {
  headerShown: false,
  gestureEnabled: false,
};
//Add your screen/page here
const StackRoutesList: Array<Route> = [
  {
    name: 'LoginScreen',
    component: LoginScreen,
    options,
  },
  {
    name: 'SignUpScreen',
    component: SignUpScreen,
    options,
  },
   {
    name: 'VerifyOtpScreen',
    component: VerifyOtpScreen,
    options,
  },
  {
    name: 'ChangePassword',
    component: ChangePassword,
    options,
  },
  {
    name: 'ManagerLeaves',
    component: ManagerLeaves,
    options,
  },
  {
    name: 'EmployeePendingLeaves',
    component: EmployeePendingLeaves,
    options,
  },

];
export default StackRoutesList;
