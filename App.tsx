import React, { useEffect, useRef } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  ImageBackground,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';

import { store, persistor, useAppSelector } from './src/store/store';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import DrawerRoutesList from './src/utils/drawerRoutes';
import StackRoutesList from './src/utils/stackRoutes';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Color } from './src/theme';
import { TouchableOpacity as GHTouchableOpacity } from 'react-native-gesture-handler';
import moment from 'moment';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();
const DEVICE_HEIGHT = Dimensions.get('window').height;
const DEVICE_WIDTH = Dimensions.get('window').width;

const DrawerNavigation = () => {
  const navigation = useNavigation<any>();

  return (
    <Drawer.Navigator
      screenOptions={{
        drawerStyle: {
          backgroundColor: 'transparent',
          width: DEVICE_WIDTH * 0.85,
        },
        overlayColor: 'rgba(0,0,0,0.5)',
        drawerType: 'slide',
        drawerActiveTintColor: Color.primaryLight,
        drawerInactiveTintColor: 'rgba(255,255,255,0.8)',
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: '600',
          marginLeft: -10,
        },
        drawerItemStyle: {
          borderRadius: 12,
          marginHorizontal: 12,
          marginVertical: 2,
          paddingVertical: 4,
        },
        drawerActiveBackgroundColor: 'rgba(255,255,255,0.15)',
      }}
      drawerContent={(props) => {
        return (
          <ImageBackground
            source={{
              uri: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMmU4YjU3IiBzdG9wLW9wYWNpdHk9IjEiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iNTAlIiBzdG9wLWNvbG9yPSIjNGNhZjUwIiBzdG9wLW9wYWNpdHk9IjEiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzFmNWYzZiIgc3RvcC1vcGFjaXR5PSIxIiAvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9InVybCgjZ3JhZGllbnQpIiAvPgo8L3N2Zz4K',
            }}
            style={{ flex: 1 }}
          >
            <View
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: Color.primary,
              }}
            />

            <SafeAreaView style={{ flex: 0, backgroundColor: 'transparent' }} />
            <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
              <DrawerContentScrollView
                contentContainerStyle={{ paddingTop: 0 }}
                style={{ backgroundColor: 'transparent' }}
                {...props}
                scrollIndicatorInsets={{ right: 1 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Enhanced Profile Header */}
                <GHTouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('Profile')}
                  style={drawerStyles.profileContainer}
                >
                  <View style={drawerStyles.profileBackgroundPattern} />

                  <View style={drawerStyles.profileContent}>
                    {/* Avatar Section */}
                    <View style={drawerStyles.avatarContainer}>
                      <View style={drawerStyles.avatarWrapper}>
                        <View style={drawerStyles.avatar}>
                          <Text style={drawerStyles.avatarText}>M</Text>
                        </View>
                        <View style={drawerStyles.onlineIndicator} />
                      </View>
                    </View>

                    {/* User Info */}
                    <View style={drawerStyles.userInfoContainer}>
                      <Text style={drawerStyles.userName}>Yard Manager</Text>
                      <Text style={drawerStyles.userEmail}>manager@cattleyard.com.au</Text>

                      <View style={drawerStyles.roleBadge}>
                        <Icon name="verified-user" size={12} color="white" />
                        <Text style={drawerStyles.roleText}>Manager</Text>
                      </View>
                    </View>

                    {/* Profile Stats */}
                    <View style={drawerStyles.profileStats}>
                      <View style={drawerStyles.statItem}>
                        <Text style={drawerStyles.statValue}>{moment().format('MMM DD')}</Text>
                        <Text style={drawerStyles.statLabel}>Today</Text>
                      </View>
                      <View style={drawerStyles.statDivider} />
                      <View style={drawerStyles.statItem}>
                        <Text style={drawerStyles.statValue}>{moment().format('ddd')}</Text>
                        <Text style={drawerStyles.statLabel}>Day</Text>
                      </View>
                    </View>
                  </View>

                  <View style={drawerStyles.profileArrow}>
                    <Icon name="keyboard-arrow-right" size={24} color="rgba(255,255,255,0.7)" />
                  </View>
                </GHTouchableOpacity>

                {/* Navigation Section Header */}
                <View style={drawerStyles.navigationHeader}>
                  <View style={drawerStyles.navigationHeaderLine} />
                  <Text style={drawerStyles.navigationHeaderText}>Navigation</Text>
                  <View style={drawerStyles.navigationHeaderLine} />
                </View>

                {/* Enhanced Drawer Items */}
                <View style={drawerStyles.drawerItemsContainer}>
                  <DrawerItemList {...props} />
                </View>

                {/* App Info Footer */}
                <View style={drawerStyles.footerContainer}>
                  <View style={drawerStyles.footerDivider} />

                  <View style={drawerStyles.appInfoContainer}>
                    <View style={drawerStyles.appIconContainer}>
                      <Icon name="agriculture" size={24} color="rgba(255,255,255,0.8)" />
                    </View>
                    <View>
                      <Text style={drawerStyles.appName}>Cattle Yard Management</Text>
                      <Text style={drawerStyles.appVersion}>Version 1.0.0</Text>
                    </View>
                  </View>

                  <View style={drawerStyles.quickActionsContainer}>
                    <TouchableOpacity style={drawerStyles.quickActionButton}>
                      <Icon name="help-outline" size={20} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                    <TouchableOpacity style={drawerStyles.quickActionButton}>
                      <Icon name="settings" size={20} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                    <TouchableOpacity style={drawerStyles.quickActionButton}>
                      <Icon name="info-outline" size={20} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                  </View>

                  <Text style={drawerStyles.copyrightText}>
                    © {moment().format('YYYY')} All rights reserved
                  </Text>
                </View>
              </DrawerContentScrollView>
            </SafeAreaView>
          </ImageBackground>
        );
      }}
    >
      <Drawer.Group>
        {DrawerRoutesList.map((route, i) => {
          const { name, component, options, iconName } = route;
          return (
            <Drawer.Screen
              options={{
                ...options,
                drawerIcon: ({ focused, color }) => (
                  <View
                    style={[
                      drawerStyles.drawerIconContainer,
                      { backgroundColor: focused ? 'rgba(255,255,255,0.1)' : 'transparent' },
                    ]}
                  >
                    <Icon
                      name={iconName}
                      size={24}
                      color={focused ? Color.primaryLight : 'rgba(255,255,255,0.8)'}
                    />
                  </View>
                ),
              }}
              key={i}
              name={name}
              component={component}
            />
          );
        })}
      </Drawer.Group>
    </Drawer.Navigator>
  );
};

const AnimatedDots = () => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animate(dot1, 0);
    animate(dot2, 200);
    animate(dot3, 400);
  }, []);

  return (
    <View style={loadingStyles.loadingIndicator}>
      <Animated.View style={[loadingStyles.loadingDot, { opacity: dot1 }]} />
      <Animated.View style={[loadingStyles.loadingDot, { opacity: dot2 }]} />
      <Animated.View style={[loadingStyles.loadingDot, { opacity: dot3 }]} />
    </View>
  );
};

function App(): JSX.Element {

  
  return (
    <Provider store={store}>
      <PersistGate
        loading={
          <View style={loadingStyles.container}>
            <View style={loadingStyles.loadingCard}>
              <View style={loadingStyles.logoContainer}>
                <Icon name="agriculture" size={60} color={Color.primary} />
              </View>
              <Text style={loadingStyles.loadingTitle}>Cattle Yard Management</Text>
              <Text style={loadingStyles.loadingSubtitle}>Loading your workspace...</Text>
              <View style={loadingStyles.loadingIndicator}>
                <View style={loadingStyles.loadingDot} />
               <AnimatedDots />
              </View>
            </View>
          </View>
        }
        persistor={persistor}
      >
        <StatusBar barStyle="light-content" backgroundColor={Color.primary} />

        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="LoginScreen"
            screenOptions={{
              headerStyle: {
                backgroundColor: Color.primary,
                elevation: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 18,
              },
              headerTitleAlign: 'center',
              cardStyle: { backgroundColor: Color.bgColor },
            }}
          >
            <Stack.Group>
              {StackRoutesList.map((route, i) => {
                const { name, component, options } = route;
                return (
                  <Stack.Screen options={options} key={i} name={name} component={component} />
                );
              })}
              <Stack.Screen
                name="Home"
                component={DrawerNavigation}
                options={{ headerShown: false }}
              />
            </Stack.Group>
          </Stack.Navigator>
        </NavigationContainer>
      </PersistGate>
    </Provider>
  );
}

const drawerStyles = StyleSheet.create({
  profileContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    marginHorizontal: 12,
    marginVertical: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#fff',
    shadowColor: '#ece8e8ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  profileBackgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  profileContent: {
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: 'white',
  },
  userInfoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
    textAlign: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  roleText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 16,
  },
  profileArrow: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -12,
  },
  navigationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
  },
  navigationHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  navigationHeaderText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginHorizontal: 12,
    letterSpacing: 1,
  },
  drawerItemsContainer: {
    paddingHorizontal: 8,
  },
  drawerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  footerContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  footerDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
  },
  appInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  appIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  appVersion: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  quickActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  copyrightText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
});

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Color.primary,
  },
  loadingCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    minWidth: 280,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(46, 139, 87, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Color.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: 'rgba(46, 139, 87, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
  },
  loadingIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Color.primary,
    marginHorizontal: 4,
  },
});

export default App;