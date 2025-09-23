import {FC} from 'react';
import MyTeams from '../components/MyTeams'
import Dashboard from '../components/Dashboard'
import ProfileScreen from '../components/ProfileScreen';
import { DrawerNavigationOptions } from '@react-navigation/drawer';
import About from '../components/About';
import MySkills from '../components/MySkills';
import MyLeaves from '../components/MyLeaves';


interface Route {
  name: string;
  component: FC;
  options?: DrawerNavigationOptions;
  iconName: string
}
const options: DrawerNavigationOptions = {
  headerShown: false,
  //gestureEnabled: true,
};
//Add your screen/page here
const DrawerRoutesList: Array<Route> = [
  {
    name: 'Dashboard',
    component: Dashboard,
    options,
    iconName: 'home'
  },
  
  {
    name: 'My Teams',
    component: MyTeams,
    options,
    iconName: 'groups'
  },
  
  {
    name: 'My Skills',
    component: MySkills,
    options,
    iconName: 'moving'
  },
  {
    name: 'My Leaves',
    component: MyLeaves,
    options,
    iconName: 'work-off'
  },
  {
    name: 'My Profile',
    component: ProfileScreen,
    options,
    iconName: 'person'
  },
  {
    name: 'About',
    component: About,
    options,
    iconName: 'info'
  },
  
  
  
  
 
];
export default DrawerRoutesList;
