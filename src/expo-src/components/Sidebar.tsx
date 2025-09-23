import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
const API_BASE_URL = 'http://localhost:5577/api/v1';

interface SidebarProps {
  isVisible: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  route: string;
  color?: string;
}


const Sidebar: React.FC<SidebarProps> = ({ isVisible, onClose }) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { user, refreshToken } = useSelector((state: RootState) => state.auth);

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'dashboard',
      route: 'Dashboard',
      color: '#4CAF50',
    },
    {
      id: 'livestock',
      title: 'Livestock',
      icon: 'pets',
      route: 'Livestock',
      color: '#2196F3',
    },
    {
      id: 'yards',
      title: 'Yards',
      icon: 'location-on',
      route: 'Yards',
      color: '#FF9800',
    },
    {
      id: 'rosters',
      title: 'Rosters',
      icon: 'people',
      route: 'Rosters',
      color: '#9C27B0',
    },
    {
      id: 'orders',
      title: 'Orders',
      icon: 'shopping-cart',
      route: 'Orders',
      color: '#607D8B',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'notifications',
      route: 'Notifications',
      color: '#FF5722',
    },
  ];

  const handleNavigation = (route: string) => {
    onClose();
    navigation.navigate(route as never);
  };

const handleLogout = () => {
  Alert.alert(
    'Logout',
    'Are you sure you want to logout?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            const { accessToken, refreshToken } = 
              (useSelector((state: RootState) => state.auth)); // 👈 get from redux

            await axios.post(
              `${API_BASE_URL}/auth/logout`,
              {
                refreshToken: refreshToken || '',
                client: 'MOBILE',
                allSessions: true,
              },
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            // ✅ clear redux state after success
            dispatch({ type: 'auth/logout' });
            onClose();
          } catch (error: any) {
            console.error('Logout failed:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        },
      },
    ]
  );
};


  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} />
      <SafeAreaView style={styles.sidebar}>
        <ScrollView style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Icon name="agriculture" size={32} color="#4CAF50" />
              <Text style={styles.appName}>Morven Hub</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Icon name="person" size={24} color="#fff" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {user?.name || 'Manager'}
              </Text>
              <Text style={styles.userRole}>Signed in as Manager</Text>
            </View>
          </View>

          {/* Menu Items */}
          <View style={styles.menuSection}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleNavigation(item.route)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                  <Icon name={item.icon} size={20} color="#fff" />
                </View>
                <Text style={styles.menuText}>{item.title}</Text>
                <Icon name="chevron-right" size={20} color="#ccc" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout */}
          <View style={styles.logoutSection}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#f44336' }]}>
                <Icon name="logout" size={20} color="#fff" />
              </View>
              <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    width: 280,
    backgroundColor: '#fff',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userRole: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  menuSection: {
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  logoutSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  logoutText: {
    color: '#f44336',
  },
});

export default Sidebar;