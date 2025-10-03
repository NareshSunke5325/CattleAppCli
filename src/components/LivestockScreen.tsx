import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Easing,
  RefreshControl,
} from 'react-native';
import { DrawerActions, useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import NetInfo from '@react-native-community/netinfo';
import { useAppDispatch, useAppSelector } from '../store/store';
import { fetchLivestockKPIs, loadCachedLivestockKPIs } from '../store/slices/livestockSlice';
import { fetchYards, loadCachedYards } from '../store/slices/yardsSlice';
import { Color } from '../theme';

const { width } = Dimensions.get('window');

interface YardLivestockProps {
  yard: {
    id: number;
    code: string;
    name: string;
    capacity: number;
    status: string;
    location: string;
    herdCount: number;
    deckCount: number;
    decksOccupied: number;
    decksAvailable: number;
  };
  animationStyle: any;
}

const StatusDot = ({ status, size = 8 }: { status: string; size?: number }) => {
  const getDotColor = () => {
    switch (status) {
      case 'AVAILABLE':
        return '#10B981';
      case 'PARTIAL':
        return '#F59E0B';
      case 'FULL':
        return '#EF4444';
      case 'MAINTENANCE':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  return (
    <View
      style={{
        backgroundColor: getDotColor(),
        width: size,
        height: size,
        borderRadius: size / 2,
      }}
    />
  );
};

const YardLivestockCard = ({ yard, animationStyle }: YardLivestockProps) => {
  const getYardStatus = () => {
    if (yard.status === 'MAINTENANCE') {
      return 'MAINTENANCE';
    }
    if (yard.deckCount === 0) return 'FULL';
    if (yard.decksAvailable === yard.deckCount) return 'AVAILABLE';
    if (yard.decksAvailable === 0) return 'FULL';
    return 'PARTIAL';
  };

  const yardStatus = getYardStatus();
  const occupancyRate = yard.deckCount > 0 ? (yard.decksOccupied / yard.deckCount) * 100 : 0;

  const getStatusColor = () => {
    switch (yardStatus) {
      case 'AVAILABLE': return '#10B981';
      case 'PARTIAL': return '#F59E0B';
      case 'FULL': return '#EF4444';
      case 'MAINTENANCE': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  return (
    <Animated.View style={[styles.yardCard, animationStyle]}>
      <View style={styles.yardHeader}>
        <View style={styles.yardInfo}>
          <Text style={styles.yardCode}>{yard.code}</Text>
          <Text style={styles.yardName}>{yard.name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <View style={styles.statusContent}>
            <StatusDot status={yardStatus} />
            <Text style={styles.statusText}>{yardStatus}</Text>
          </View>
        </View>
      </View>

      <View style={styles.locationContainer}>
        <Icon name="location-on" size={14} color="#6B7280" />
        <Text style={styles.locationText}>{yard.location}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Herds</Text>
          <Text style={styles.statValue}>{yard.herdCount}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Decks</Text>
          <Text style={styles.statValue}>{yard.deckCount}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Available</Text>
          <Text style={styles.statValue}>{yard.decksAvailable}</Text>
        </View>
      </View>

      <View style={styles.capacityContainer}>
        <View style={styles.capacityHeader}>
          <Text style={styles.capacityLabel}>Capacity usage</Text>
          <Text style={styles.capacityPercentage}>{occupancyRate.toFixed(0)}%</Text>
        </View>
        <View style={styles.capacityBar}>
          <View
            style={[
              styles.capacityFill,
              { width: `${Math.min(occupancyRate, 100)}%` }
            ]}
          />
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="add" size={16} color="#FFFFFF" />
          <Text style={styles.actionText}>Add Herd</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.transferButton]}>
          <Icon name="swap-horiz" size={16} color="#FFFFFF" />
          <Text style={styles.actionText}>Transfer</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const KPICard = ({ title, value, subtitle, color = Color.primary }: any) => (
  <Animated.View style={[styles.kpiCard, { opacity: title === 'Total Animals' ? 1 : 0.9 }]}>
    <Text style={[styles.kpiValue, { color }]} numberOfLines={1}>{value}</Text>
    <Text style={styles.kpiTitle}>{title}</Text>
    {subtitle && <Text style={styles.kpiSubtitle}>{subtitle}</Text>}
  </Animated.View>
);

export default function LivestockScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { kpis, loading, error } = useAppSelector((state) => state.livestock);
  const { yards } = useAppSelector((state) => state.yards);

  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [cardAnimations] = useState(
    Array(9).fill(0).map(() => new Animated.Value(0))
  );
  const [kpiAnim] = useState(new Animated.Value(0));

  // Network connectivity detection
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected ?? false;
      setIsConnected(connected);

      // Auto-sync when coming back online
      if (connected && isConnected === false && (kpis || yards.length > 0)) {
        handleBackgroundSync();
      }
    });

    return () => unsubscribe();
  }, [isConnected, kpis, yards.length]);

  // Optimized data loading strategy
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadData = async () => {
        if (!isActive) return;

        try {
          setIsInitialLoad(true);

          // Step 1: Immediately load cached data (instant display)
          console.log('📱 Loading cached livestock data...');
          await Promise.all([
            dispatch(loadCachedLivestockKPIs()),
            dispatch(loadCachedYards())
          ]);

          if (isActive) {
            setIsInitialLoad(false);
            startEntranceAnimations();
          }

          // Step 2: Check network and sync in background
          const netState = await NetInfo.fetch();
          const connected = netState.isConnected ?? false;

          if (connected && isActive) {
            console.log('🌐 Online - starting background sync...');
            handleBackgroundSync();
          } else if (isActive) {
            console.log('📴 Offline - using cached data only');
          }
        } catch (error) {
          console.log('❌ Error loading data:', error);
          if (isActive) {
            setIsInitialLoad(false);
          }
        }
      };

      loadData();

      return () => {
        isActive = false;
      };
    }, [dispatch])
  );

  // Background sync function
  const handleBackgroundSync = async () => {
    if (!isConnected) return;

    try {
      setSyncStatus('syncing');
      console.log('🔄 Starting background sync...');

      await Promise.all([
        dispatch(fetchLivestockKPIs()),
        dispatch(fetchYards({ page: 0, size: 9 }))
      ]);

      setSyncStatus('success');
      console.log('✅ Background sync completed');

      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.log('❌ Background sync failed:', error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  // Manual refresh function
  const handleRefresh = async () => {
    if (!isConnected) {
      Alert.alert('Offline', 'You are currently offline. Unable to refresh.');
      return;
    }

    setIsRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchLivestockKPIs()),
        dispatch(fetchYards({ page: 0, size: 9 }))
      ]);
    } catch (error) {
      console.log('Refresh failed:', error);
      Alert.alert('Sync Failed', 'Unable to refresh data. Please check your connection.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Start animations when we have data
  useEffect(() => {
    if (!isInitialLoad && (kpis || yards.length > 0)) {
      startEntranceAnimations();
    }
  }, [isInitialLoad, kpis, yards]);

  const startEntranceAnimations = () => {
    // Header scale animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Content fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // KPI animation
    Animated.timing(kpiAnim, {
      toValue: 1,
      duration: 600,
      delay: 200,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: true,
    }).start();

    // Staggered card animations
    cardAnimations.forEach((anim, index) => {
      if (index < Math.min(yards.length, 9)) {
        Animated.timing(anim, {
          toValue: 1,
          duration: 500,
          delay: 300 + (index * 80),
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }).start();
      }
    });
  };

  const getCardTransform = (anim: Animated.Value) => ({
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.7, 1],
        }),
      },
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [50, 0],
        }),
      },
    ],
    opacity: anim,
  });

  const getHeaderTransform = () => ({
    transform: [
      {
        scale: scaleAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1],
        }),
      },
    ],
  });

  const getKPITransform = () => ({
    transform: [
      {
        scale: kpiAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1],
        }),
      },
      {
        translateY: kpiAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [30, 0],
        }),
      },
    ],
    opacity: kpiAnim,
  });

  const getYardStatusForFilter = (yard: any) => {
    if (yard.status === 'MAINTENANCE') return 'MAINTENANCE';
    if (yard.deckCount === 0) return 'FULL';
    if (yard.decksAvailable === yard.deckCount) return 'AVAILABLE';
    if (yard.decksAvailable === 0) return 'FULL';
    return 'PARTIAL';
  };

  const filteredYards = yards
    .filter((yard) => {
      const yardStatus = getYardStatusForFilter(yard);
      const matchesStatus = selectedStatus === 'ALL' || yardStatus === selectedStatus;
      return matchesStatus;
    })
    .sort((a, b) => b.herdCount - a.herdCount);

  const renderKPIStats = () => {
    if (!kpis) return null;

    const totalAnimals = Object.values(kpis.herdTypeCounts).reduce((a, b) => a + b, 0);
    const capacityUsage = Math.round((kpis.capacity.occupiedCapacity / kpis.capacity.totalCapacityActiveYards) * 100);

    return (
      <Animated.View style={[styles.kpiContainer, getKPITransform()]}>
        <Text style={styles.sectionTitle}>Livestock Overview</Text>

        <View style={styles.kpiGrid}>
          <KPICard
            title="Total Animals"
            value={totalAnimals}
            subtitle="Across all yards"
            color={Color.primary}
          />
          <KPICard
            title="Available Decks"
            value={kpis.decks.decksAvailable}
            subtitle={`of ${kpis.decks.totalDecks} total`}
            color="#10B981"
          />
          <KPICard
            title="Capacity Used"
            value={`${capacityUsage}%`}
            subtitle={`${kpis.capacity.occupiedCapacity} of ${kpis.capacity.totalCapacityActiveYards}`}
            color="#F59E0B"
          />
        </View>

        {/* Herd Type Breakdown */}
        <Animated.View style={[styles.herdTypeContainer, { opacity: fadeAnim }]}>
          <Text style={styles.herdTypeTitle}>Herd Composition</Text>
          <View style={styles.herdTypeGrid}>
            {Object.entries(kpis.herdTypeCounts).map(([type, count]) => (
              <View key={type} style={styles.herdTypeItem}>
                <Text style={styles.herdTypeCount}>{count}</Text>
                <Text style={styles.herdTypeLabel}>{type}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Alerts */}
        {kpis.alerts.length > 0 && (
          <Animated.View style={[styles.alertsContainer, { opacity: fadeAnim }]}>
            <Text style={styles.alertsTitle}>Alerts</Text>
            {kpis.alerts.map((alert, index) => (
              <View key={index} style={[
                styles.alertItem,
                {
                  backgroundColor: alert.severity === 'WARN' ? '#FEF3C7' :
                    alert.severity === 'ERROR' ? '#FEE2E2' : '#DBEAFE',
                  borderLeftColor: alert.severity === 'WARN' ? '#D97706' :
                    alert.severity === 'ERROR' ? '#DC2626' : '#2563EB'
                }
              ]}>
                <Icon
                  name={alert.severity === 'WARN' ? 'warning' : alert.severity === 'ERROR' ? 'error' : 'info'}
                  size={16}
                  color={alert.severity === 'WARN' ? '#D97706' : alert.severity === 'ERROR' ? '#DC2626' : '#2563EB'}
                />
                <Text style={styles.alertText}>{alert.message}</Text>
              </View>
            ))}
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  const FilterTabs = () => (
    <Animated.View style={[styles.filterContainer, { opacity: fadeAnim }]}>
      {['ALL', 'AVAILABLE', 'PARTIAL', 'FULL', 'MAINTENANCE'].map((status) => (
        <TouchableOpacity
          key={status}
          style={[
            styles.filterTab,
            selectedStatus === status && styles.filterTabActive
          ]}
          onPress={() => setSelectedStatus(status)}
        >
          <View style={styles.filterContent}>
            <StatusDot status={status === 'ALL' ? 'AVAILABLE' : status} />
            <Text style={[
              styles.filterText,
              selectedStatus === status && styles.filterTextActive
            ]}>
              {status === 'ALL' ? 'All' : status}
            </Text>
          </View>
          {selectedStatus === status && (
            <View style={styles.filterIndicator} />
          )}
        </TouchableOpacity>
      ))}
    </Animated.View>
  );

  const renderYardCard = ({ item, index }: { item: any; index: number }) => (
    <YardLivestockCard
      yard={item}
      animationStyle={getCardTransform(cardAnimations[index] || new Animated.Value(1))}
    />
  );

  const NetworkStatus = () => (
    <View style={[
      styles.networkStatus,
      isConnected === false && styles.networkStatusOffline,
      syncStatus === 'syncing' && styles.networkStatusSyncing
    ]}>
      <Icon
        name={
          syncStatus === 'syncing' ? 'sync' :
            isConnected ? 'wifi' : 'wifi-off'
        }
        size={14}
        color={
          syncStatus === 'syncing' ? '#3B82F6' :
            isConnected ? '#10B981' : '#6B7280'
        }
      />
      <Text style={[
        styles.networkText,
        {
          color: syncStatus === 'syncing' ? '#3B82F6' :
            isConnected ? '#10B981' : '#6B7280'
        }
      ]}>
        {syncStatus === 'syncing' ? 'Syncing...' :
          isConnected ? 'Online' : 'Offline'}
      </Text>
      {syncStatus === 'success' && (
        <Icon name="check-circle" size={14} color="#10B981" style={styles.syncIcon} />
      )}
      {syncStatus === 'error' && (
        <Icon name="error" size={14} color="#EF4444" style={styles.syncIcon} />
      )}
    </View>
  );

  // Show loading only for initial load with no cached data
  if (isInitialLoad && !kpis && yards.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Color.primary} />
        <Text style={styles.loadingText}>Loading livestock data...</Text>
        <Text style={styles.loadingSubtext}>
          {isConnected === false ? 'Offline - loading cached data' : 'Preparing livestock overview...'}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, getHeaderTransform()]}>
        <TouchableOpacity
          style={styles.headerButton}
         onPress={() => navigation.navigate('Home' as never)}
        >
          <Icon name="menu" color={'#fff'} size={24} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Livestock Management</Text>
          <View style={styles.headerUnderline} />
        </View>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Icon name="arrow-back" color={'#fff'} size={24} />
        </TouchableOpacity>
      </Animated.View>

      {/* Network Status */}
      {/* <NetworkStatus /> */}

      <FlatList
        data={filteredYards}
        renderItem={renderYardCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[Color.primary]}
            tintColor={Color.primary}
            enabled={isConnected === true}
          />
        }
        ListHeaderComponent={
          <>
            {renderKPIStats()}
            <FilterTabs />
            <Animated.View style={[styles.resultsHeader, { opacity: fadeAnim }]}>
              <Text style={styles.resultsTitle}>
                Yards with Livestock ({filteredYards.length})
              </Text>
            </Animated.View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="pets" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>
              {isInitialLoad ? 'Loading livestock data...' : 'No yards found'}
            </Text>
            <Text style={styles.emptySubtext}>
              {!isConnected ? 'You are currently offline' : 'No yards match the current filter'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  header: {
    backgroundColor: Color.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  menuButton: {
    padding: 8,
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerUnderline: {
    width: 60,
    height: 2,
    backgroundColor: '#86EFAC',
    borderRadius: 1,
    marginTop: 4,
  },
  headerButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  networkStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F0F9FF',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  networkStatusOffline: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  networkStatusSyncing: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
  },
  networkText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  syncIcon: {
    marginLeft: 4,
  },
  kpiContainer: {
    padding: 16,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  kpiCard: {
    alignItems: 'center',
    flex: 1,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  kpiTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  kpiSubtitle: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  herdTypeContainer: {
    marginTop: 8,
  },
  herdTypeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  herdTypeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  herdTypeItem: {
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
  },
  herdTypeCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  herdTypeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  alertsContainer: {
    marginTop: 16,
  },
  alertsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  alertText: {
    fontSize: 12,
    color: '#111827',
    marginLeft: 8,
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    margin: 2,
    position: 'relative',
  },
  filterTabActive: {
    backgroundColor: '#F0F9FF',
  },
  filterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: Color.primary,
    fontWeight: '600',
  },
  filterIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 16,
    height: 2,
    backgroundColor: Color.primary,
    borderRadius: 2,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  listContainer: {
    paddingBottom: 32,
  },
  yardCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  yardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  yardInfo: {
    flex: 1,
  },
  yardCode: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  yardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  capacityContainer: {
    marginBottom: 12,
  },
  capacityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  capacityLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  capacityPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  capacityBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  capacityFill: {
    height: '100%',
    backgroundColor: Color.primary,
    borderRadius: 3,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Color.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  transferButton: {
    backgroundColor: '#F59E0B',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});