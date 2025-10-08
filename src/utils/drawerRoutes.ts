import { FC } from 'react';
import { DrawerNavigationOptions } from '@react-navigation/drawer';
import Dashboard from '../components/Dashboard';
import YardsScreen from '../components/YardsScreen';
import LivestockScreen from '../components/LivestockScreen';
import ProfileScreen from '../components/ProfileScreen';
import TaskRosterScreen from '../components/TaskRosterScreen';
import OrderScreen from '../components/OrderScreen';
import NotificationsScreen from '../components/NotificationsScreen';
import UsersScreen from '../components/UsersScreen';

interface Route {
  name: string;
  component: FC;
  options?: DrawerNavigationOptions;
  iconName: string;
}

const options: DrawerNavigationOptions = {
  headerShown: false,
};

const DrawerRoutesList: Array<Route> = [
  {
    name: 'Dashboard',
    component: Dashboard,
    options,
    iconName: 'dashboard',
  },
  {
    name: 'Yards',
    component: YardsScreen,
    options,
    iconName: 'location-on',
  },
   {
    name: 'Livestock',
    component: LivestockScreen,
    options,
    iconName: 'pets',
  },
  {
    name: 'Roster',
    component: TaskRosterScreen,
    options,
    iconName: 'fact-check',
  },
  {
    name: 'OrderScreen',
    component: OrderScreen,
    options,
    iconName: 'shopping-cart',
  },
  {
    name: 'NotificationsScreen',
    component: NotificationsScreen,
    options,
    iconName: 'notifications',
  },
  {
    name: 'UsersScreen',
    component: UsersScreen,
    options,
    iconName: 'notifications',
  },
  {
    name: 'Profile',
    component: ProfileScreen,
    options,
    iconName: 'person',
  },
];

export default DrawerRoutesList;