import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ImageBackground,
  ScrollView,
} from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAppDispatch, useAppSelector } from '../store/store';
import { fetchDashboard } from '../store/slices/dashboardSlice';
import { logout } from '../store/slices/authSlice';
import { Color } from '../theme';

const DEVICE_HEIGHT = Dimensions.get('window').height;

const Dashboard = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { data, loading, error } = useAppSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboard());
  }, []);

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

  const renderStatCard = (title: string, value: string | number, subtitle?: string, color = Color.success) => (
    <View
      style={[
        styles.statCard,
        {
          borderLeftColor: color,
        },
      ]}
    >
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderHerdTypeBar = (herd: any) => (
    <View key={herd.type} style={styles.herdTypeContainer}>
      <Text style={styles.herdTypeLabel}>{herd.type}</Text>
      <View style={styles.herdProgressBar}>
        <View
          style={[
            styles.herdProgress,
            {
              width: `${herd.percentage}%`,
              backgroundColor: getHerdColor(herd.type),
            },
          ]}
        />
      </View>
      <Text style={styles.herdTypeValue}>
        {herd.count} • {herd.percentage}%
      </Text>
    </View>
  );

  const getHerdColor = (type: string) => {
    switch (type) {
      case 'COWS':
        return Color.success;
      case 'CALVES':
        return Color.info;
      case 'BULLS':
        return Color.warning;
      case 'MIXED':
        return Color.secondary;
      default:
        return Color.gray;
    }
  };

  return (
    <ImageBackground
      style={{
        backgroundColor: Color.primary,
        justifyContent: 'flex-start',
        height: DEVICE_HEIGHT,
      }}
    >
      <View
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(46, 139, 87, 0.9)',
        }}
      />

      <SafeAreaView style={{ flex: 0, backgroundColor: Color.primary }} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ backgroundColor: Color.bgColor, flex: 1 }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                navigation.dispatch(DrawerActions.openDrawer());
              }}
            >
              <Icon name="menu" color={'#fff'} size={24} />
            </TouchableOpacity>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={styles.headerTitle}>Cattle Yard Dashboard</Text>
              <View style={styles.headerUnderline} />
            </View>
            <TouchableOpacity onPress={logoutCalled} style={styles.headerButton}>
              <Icon name="logout" color={'#fff'} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
          >
            {/* Show loading spinner */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Color.primary} />
                <Text style={styles.loadingText}>Loading dashboard...</Text>
              </View>
            ) : (
              <>
                {/* Main Stats */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {renderStatCard(
                    'Total Capacity',
                    data?.stats?.totalCapacity || 600,
                    'Active Yards',
                    Color.success
                  )}
                  {renderStatCard(
                    'Active Yards',
                    data?.stats?.activeYards || 5,
                    undefined,
                    Color.info
                  )}
                </View>

                {/* Occupancy Card */}
                <View style={styles.occupancyCard}>
                  <Text style={styles.cardTitle}>Yard Occupancy</Text>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${data?.stats?.utilization || 6}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.occupancyText}>
                    {data?.stats?.utilization || 6}% occupied
                  </Text>
                </View>

                {/* Decks Section */}
                <View style={styles.decksCard}>
                  <Text style={styles.cardTitle}>Deck Information</Text>
                  <Text style={styles.decksInfo}>
                    {data?.stats?.occupiedDecks || 9} occupied •{' '}
                    {data?.stats?.availableDecks || 12} available
                  </Text>
                  <Text style={styles.decksTotal}>
                    Total {(data?.stats?.occupiedDecks || 9) + (data?.stats?.availableDecks || 12)}
                  </Text>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        { 
                          width: `${data?.stats?.utilization || 43}%`,
                          backgroundColor: Color.info,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.occupancyText, { color: Color.info }]}>
                    {data?.stats?.utilization || 43}% utilization
                  </Text>
                </View>

                {/* Herd Types Section */}
                <View style={styles.herdTypesCard}>
                  <Text style={styles.cardTitle}>Herd Types Distribution</Text>
                  {(data?.herdTypes || [
                    { type: 'COWS', count: 2, percentage: 40 },
                    { type: 'CALVES', count: 1, percentage: 20 },
                    { type: 'BULLS', count: 1, percentage: 20 },
                    { type: 'MIXED', count: 1, percentage: 20 },
                  ]).map(renderHerdTypeBar)}
                </View>

                {/* Revenue Section */}
                <View style={styles.revenueCard}>
                  <Text style={styles.cardTitle}>Revenue by Yard</Text>
                  {(data?.yards || [
                    { yard: 'North Yard', revenue: 'AUD 450', code: 'Y-NSW-01' },
                  ]).map((item: any) => (
                    <View key={item.code} style={styles.revenueItem}>
                      <View>
                        <Text style={styles.revenueYard}>{item.name || item.yard}</Text>
                        <Text style={styles.revenueCode}>{item.code}</Text>
                      </View>
                      <Text style={styles.revenueAmount}>
                        AUD {item.revenue || item.revenue}
                      </Text>
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

const styles = StyleSheet.create({
  header: {
    backgroundColor: Color.primary,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  headerUnderline: {
    width: 60,
    height: 2,
    backgroundColor: Color.primaryLight,
    borderRadius: 1,
    marginTop: 4,
  },
  loadingContainer: {
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
  },
  loadingText: {
    marginTop: 12,
    color: Color.primary,
    fontWeight: 'bold',
    fontSize: 18,
  },
  statCard: {
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
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.6)',
  },
  occupancyCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Color.success,
    borderRadius: 6,
  },
  occupancyText: {
    fontSize: 14,
    color: Color.success,
    fontWeight: 'bold',
  },
  decksCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  decksInfo: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  decksTotal: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
  },
  herdTypesCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  herdTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  herdTypeLabel: {
    width: 60,
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textTransform: 'uppercase',
  },
  herdProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  herdProgress: {
    height: '100%',
    borderRadius: 4,
  },
  herdTypeValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    minWidth: 50,
  },
  revenueCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  revenueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  revenueYard: {
    fontSize: 15,
    color: '#333',
    fontWeight: 'bold',
  },
  revenueCode: {
    fontSize: 12,
    color: '#888',
  },
  revenueAmount: {
    color: Color.warning,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Dashboard;