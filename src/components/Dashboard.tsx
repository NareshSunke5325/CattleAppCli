import { createRef, useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, ImageBackground, ScrollView } from "react-native";
import {DrawerActions, useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAppDispatch, useAppSelector } from "../redux/store/store";
import { reset as resetUser} from '../redux/user.slice';
const DEVICE_HEIGHT = Dimensions.get('window').height;

const Dashboard = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const userDetails = useAppSelector((state) => state.user.details);

  const [cattleData, setCattleData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [yardStats, setYardStats] = useState({
    totalCapacity: 600,
    activeYards: 5,
    occupiedPercent: 6,
    availableDecks: 12,
    occupiedDecks: 9,
    totalDecks: 21,
    utilizationPercent: 43
  });
  const [herdTypes, setHerdTypes] = useState([
    { type: 'COWS', count: 2, percentage: 40, color: '#4caf50' },
    { type: 'CALVES', count: 1, percentage: 20, color: '#2196f3' },
    { type: 'BULLS', count: 1, percentage: 20, color: '#ff9800' },
    { type: 'MIXED', count: 1, percentage: 20, color: '#9c27b0' }
  ]);
  const [revenueData, setRevenueData] = useState([
    { yard: 'North Yard', revenue: 'AUD 450', code: 'Y-NSW-01', color: '#ff9800' }
  ]);

  function logoutCalled() {
    Alert.alert('', 'Are you sure you want to logout from Cattle Management?', [
      { text: 'Yes', onPress: () =>  {
        dispatch(resetUser());
        navigation.goBack();
        navigation.goBack();
      }},
      { text: 'No', onPress: () => null },
    ]);
  };

  useEffect(() => {
    const fetchCattleData = async () => {
      try {
        setTimeout(() => {
          setCattleData({
            managerName: userDetails.name || 'Yard Manager',
            yardLocation: 'NSW Regional Cattle Yard',
            managerRole: 'Livestock Coordinator',
            contactNumber: userDetails.phone || '+61 400 123 456',
            email: userDetails.email || 'manager@cattleyard.com.au',
            startDate: '2023-01-15',
            isActive: true
          });
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Failed to load cattle yard data');
        setLoading(false);
      }
    };
    fetchCattleData();
  }, []);

  const renderStatCard = (title: string, value: string | number, subtitle?: string, color = '#4caf50') => (
    <View style={{
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderRadius: 16,
      padding: 16,
      marginVertical: 8,
      flex: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderLeftWidth: 4,
      borderLeftColor: color
    }}>
      <Text style={{
        fontSize: 24,
        fontWeight: 'bold',
        color: color,
        marginBottom: 4
      }}>{value}</Text>
      <Text style={{
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2
      }}>{title}</Text>
      {subtitle && (
        <Text style={{
          fontSize: 12,
          color: 'rgba(0,0,0,0.6)'
        }}>{subtitle}</Text>
      )}
    </View>
  );

  const renderHerdTypeBar = (herd: any) => (
    <View key={herd.type} style={{
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12
    }}>
      <Text style={{
        width: 60,
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
        textTransform: 'uppercase'
      }}>{herd.type}</Text>
      <View style={{
        flex: 1,
        height: 8,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 4,
        marginHorizontal: 12
      }}>
        <View style={{
          width: `${herd.percentage}%`,
          height: '100%',
          backgroundColor: herd.color,
          borderRadius: 4
        }} />
      </View>
      <Text style={{
        fontSize: 12,
        color: '#333',
        fontWeight: '500',
        minWidth: 50
      }}>{herd.count} • {herd.percentage}%</Text>
    </View>
  );

  return (
    <ImageBackground
      style={{
        backgroundColor: '#2d5c3e',
        justifyContent: 'flex-start',
        height: DEVICE_HEIGHT,
      }}>
      
      {/* Background Gradient Overlay */}
      <View style={{
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(45, 92, 62, 0.9)',
      }} />
      
      <SafeAreaView style={{ flex: 0, backgroundColor: '#2d5c3e' }} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ backgroundColor: '#f5f5f5', flex: 1 }}>
          {/* Header */}
          <View style={{
            backgroundColor: '#2d5c3e',
            justifyContent: 'space-between',
            flexDirection: 'row',
            alignItems: 'center',
            height: 60,
            borderBottomColor: 'rgba(255,255,255,0.2)',
            borderBottomWidth: 1,
            paddingHorizontal: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 8,
          }}>
            <TouchableOpacity 
              style={{
                padding: 8,
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.1)'
              }}
              onPress={() => {
                navigation.dispatch(DrawerActions.openDrawer());
              }}
            >
              <Icon
                name="menu"
                color={'#fff'}
                size={24}
              />
            </TouchableOpacity>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{
                fontSize: 20,
                color: '#fff',
                fontWeight: 'bold',
                letterSpacing: 0.5
              }}>
                Cattle Yard Dashboard
              </Text>
              <View style={{
                width: 60,
                height: 2,
                backgroundColor: '#8bc34a',
                borderRadius: 1,
                marginTop: 4
              }} />
            </View>
            <TouchableOpacity 
              onPress={logoutCalled} 
              style={{
                padding: 8,
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.1)'
              }}
            >
              <Icon
                name="logout"
                color={'#fff'}
                size={24}
              />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
          >
            {/* Show loading spinner */}
            {loading ? (
              <View style={{
                justifyContent: 'center',
                alignItems: 'center',
                margin: 20,
                padding: 40,
                backgroundColor: 'rgba(255,255,255,0.95)',
                borderRadius: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 8,
              }}>
                <ActivityIndicator size="large" color="#4caf50" />
                <Text style={{
                  marginTop: 12,
                  color: '#2d5c3e',
                  fontWeight: 'bold',
                  fontSize: 18
                }}>Loading dashboard ...</Text>
              </View>
            ) : (
              <>
                {/* Stats Cards */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {renderStatCard('Total Capacity (Active Yards)', yardStats.totalCapacity, undefined, '#4caf50')}
                  {renderStatCard('Active Yards', yardStats.activeYards, undefined, '#2196f3')}
                </View>
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  borderRadius: 16,
                  padding: 16,
                  marginVertical: 8,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: 3,
                }}>
                  <Text style={{ color: '#333', fontWeight: '600', fontSize: 16, marginBottom: 8 }}>Occupied</Text>
                  <View style={{
                    height: 8,
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    borderRadius: 6,
                    overflow: 'hidden',
                  }}>
                    <View style={{
                      width: `${yardStats.occupiedPercent}%`,
                      height: '100%',
                      backgroundColor: '#4caf50'
                    }}/>
                  </View>
                  <Text style={{ marginTop: 6, fontSize: 14, color: '#4caf50', fontWeight: 'bold' }}>{yardStats.occupiedPercent}%</Text>
                </View>
                {/* Decks section */}
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  borderRadius: 16,
                  padding: 16,
                  marginVertical: 8,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: 3,
                }}>
                  <Text style={{ color: '#333', fontWeight: '600', fontSize: 16, marginBottom: 8 }}>Decks</Text>
                  <Text style={{ fontSize: 16 }}>{yardStats.occupiedDecks} occupied • {yardStats.availableDecks} available</Text>
                  <Text style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Total {yardStats.totalDecks}</Text>
                  <View style={{
                    height: 8,
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    borderRadius: 6,
                    overflow: 'hidden',
                  }}>
                    <View style={{
                      width: `${yardStats.utilizationPercent}%`,
                      height: '100%',
                      backgroundColor: '#2196f3'
                    }}/>
                  </View>
                  <Text style={{ marginTop: 6, fontSize: 14, color: '#2196f3', fontWeight: 'bold' }}>{yardStats.utilizationPercent}%</Text>
                </View>
                {/* Herd Types section */}
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  borderRadius: 16,
                  padding: 16,
                  marginVertical: 8,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: 3,
                }}>
                  <Text style={{ color: '#333', fontWeight: '600', fontSize: 16, marginBottom: 12 }}>Herd Types</Text>
                  {herdTypes.map(renderHerdTypeBar)}
                </View>
                {/* Revenue section */}
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  borderRadius: 16,
                  padding: 16,
                  marginVertical: 8,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: 3,
                }}>
                  <Text style={{ color: '#333', fontWeight: '600', fontSize: 16, marginBottom: 8 }}>Revenue by Yard</Text>
                  {revenueData.map(item => (
                    <View key={item.code} style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 8,
                      justifyContent: 'space-between'
                    }}>
                      <View>
                        <Text style={{ fontSize: 15, color: '#333', fontWeight: 'bold' }}>{item.yard}</Text>
                        <Text style={{ fontSize: 12, color: '#888' }}>{item.code}</Text>
                      </View>
                      <Text style={{ color: item.color, fontSize: 16, fontWeight: 'bold' }}>{item.revenue}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

export default Dashboard;
