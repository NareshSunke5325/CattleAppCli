import React from 'react';
import {
  Alert,
  Dimensions,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAppDispatch, useAppSelector } from '../store/store';
import { logout } from '../store/slices/authSlice';
import { Color } from '../theme';

const DEVICE_HEIGHT = Dimensions.get('window').height;

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  function logoutCalled() {
    Alert.alert('', 'Are you sure you want to logout from Cattle Yard Management?', [
      {
        text: 'Yes',
        onPress: () => {
          dispatch(logout());
          navigation.navigate('LoginScreen');
        },
      },
      { text: 'No', onPress: () => null },
    ]);
  }

  return (
    <ImageBackground
      style={{
        flex: 1,
        backgroundColor: Color.bgColor,
        justifyContent: 'flex-start',
        height: DEVICE_HEIGHT,
      }}
    >
      <SafeAreaView style={[styles.container, styles.horizontal]}>
        <View style={{ backgroundColor: Color.bgColor }}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                navigation.dispatch(DrawerActions.openDrawer());
              }}
            >
              <Icon name="menu" color={'#fff'} size={35} />
            </TouchableOpacity>
            <Text style={styles.subTitle}>Profile</Text>
            <Text style={{ width: '33%' }}></Text>
          </View>
          <ScrollView style={{ height: DEVICE_HEIGHT - 88 }}>
            <View style={styles.profileHeader}>
              <Icon
                style={styles.profileIcon}
                name="person"
                color={'black'}
                size={100}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>Yard Manager</Text>
                <Text style={styles.profileEmail}>manager@cattleyard.com.au</Text>
              </View>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoText}>Employee ID: YM001</Text>
              <Text style={styles.infoText}>Role: Livestock Coordinator</Text>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoText}>Phone: +61 400 123 456</Text>
              <Text style={styles.infoText}>Location: NSW Regional Cattle Yard</Text>
              <Text style={styles.infoText}>Start Date: 2023-01-15</Text>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoText}>Department: Livestock Management</Text>
              <Text style={styles.infoText}>Specialization: Cattle Operations</Text>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={logoutCalled}>
              <Icon name="logout" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'flex-start',
    backgroundColor: Color.primary,
  },
  horizontal: {
    flexDirection: 'column',
  },
  header: {
    backgroundColor: Color.primary,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderBottomColor: 'darkgray',
    borderBottomWidth: 1,
    marginBottom: 0,
  },
  headerButton: {
    width: '33%',
    paddingLeft: 10,
    alignContent: 'center',
    alignSelf: 'center',
  },
  subTitle: {
    width: '34%',
    textAlign: 'center',
    fontSize: 20,
    color: '#fff',
  },
  profileHeader: {
    backgroundColor: Color.primaryLight,
    width: '100%',
    height: 200,
    borderBottomColor: 'lightgray',
    borderBottomWidth: 1,
    paddingTop: 20,
    justifyContent: 'space-between',
  },
  profileIcon: {
    alignSelf: 'center',
    borderRadius: 50,
    borderWidth: 1,
  },
  profileInfo: {
    alignItems: 'center',
    bottom: 10,
  },
  profileName: {
    fontSize: 20,
    marginBottom: 10,
    color: '#fff',
  },
  profileEmail: {
    fontSize: 15,
    color: '#fff',
  },
  infoSection: {
    left: '10%',
    alignItems: 'center',
    marginTop: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: 'gray',
    paddingBottom: 10,
    width: '80%',
  },
  infoText: {
    color: Color.primary,
    fontWeight: '500',
    fontSize: 15,
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: Color.error,
    borderRadius: 12,
    padding: 16,
    margin: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});