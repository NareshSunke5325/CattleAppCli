import { FC } from 'react';
import { StackNavigationOptions } from '@react-navigation/stack';
import LoginScreen from '../components/LoginScreen';
import YardsScreen from '../components/YardsScreen';
import LivestockScreen from '../components/LivestockScreen';
import TaskRosterScreen from '../components/TaskRosterScreen';
import Dashboard from '../components/Dashboard';
import OrderScreen from '../components/OrderScreen';
import NotificationsScreen from '../components/NotificationsScreen';
import UsersScreen from '../components/UsersScreen';

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
    {
    name: 'Dashboard',
    component: Dashboard,
    options,
  },
   {
    name: 'YardsScreen',
    component: YardsScreen,
    options,
  },
    {
    name: 'LivestockScreen',
    component: LivestockScreen,
    options,
  },
    {
    name: 'TaskRosterScreen',
    component: TaskRosterScreen,
    options,
  },
    {
    name: 'OrderScreen',
    component: OrderScreen,
    options,
  },
    {
    name: 'NotificationsScreen',
    component: NotificationsScreen,
    options,
  },
    {
    name: 'UsersScreen',
    component: UsersScreen,
    options,
  },

];

export default StackRoutesList;