import { FC } from 'react';
import { StackNavigationOptions } from '@react-navigation/stack';
import LoginScreen from '../components/LoginScreen';

interface Route {
  name: string;
  component: FC;
  options?: StackNavigationOptions;
}

const options: StackNavigationOptions = {
  headerShown: false,
  gestureEnabled: false,
};

const StackRoutesList: Array<Route> = [
  {
    name: 'LoginScreen',
    component: LoginScreen,
    options,
  },
];

export default StackRoutesList;