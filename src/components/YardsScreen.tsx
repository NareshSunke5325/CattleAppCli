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
import { fetchYards, loadCachedYards } from '../store/slices/yardsSlice';
import { Color } from '../theme';
import BookingModal from '../models/BookingModal';

const { width } = Dimensions.get('window');

interface YardCardProps {
  yard: {
    id: number;
    code: string;
    name: string;
    capacity: number;
    status: string;
    location: string;
    deckCount: number;
    decksOccupied: number;
    decksAvailable: number;
  };
  onStatusPress: (status: string) => void;
  onBookPress: (yardId: number, yardCode: string) => void;
  animationStyle: any;
}

const StatusDot = ({
  status,
  size = 8,
  onPress
}: {
  status: string;
  size?: number;
  onPress?: (status: string) => void;
}) => {
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

  const handlePress = () => {
    if (onPress) {
      onPress(status);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <View
        style={{
          backgroundColor: getDotColor(),
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
      />
    </TouchableOpacity>
  );
};

function YardCard({ yard, onStatusPress, onBookPress, animationStyle }: YardCardProps) {
  const getYardStatus = () => {
    if (yard.status === 'MAINTENANCE') {
      return 'MAINTENANCE';
    }

    if (yard.deckCount === 0) {
      return 'FULL';
    }

    if (yard.decksAvailable === yard.deckCount) {
      return 'AVAILABLE';
    }

    if (yard.decksAvailable === 0) {
      return 'FULL';
    }

    return 'PARTIAL';
  };

  const yardStatus = getYardStatus();
  const occupancyRate = yard.deckCount > 0 ? (yard.decksOccupied / yard.deckCount) * 100 : 0;
  const isAvailable = yardStatus === 'AVAILABLE';

  const getStatusColor = () => {
    switch (yardStatus) {
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

  const getStatusText = () => {
    return yardStatus;
  };

  return (
    <Animated.View 
      style={[
        styles.yardCard, 
        { backgroundColor: isAvailable ? '#F0FDF4' : '#FFFFFF' },
        animationStyle
      ]}
    >
      <View style={styles.yardHeader}>
        <View style={styles.yardInfo}>
          <Text style={styles.yardCode}>{yard.code}</Text>
          <Text style={styles.yardName}>{yard.name}</Text>
        </View>
        <TouchableOpacity
          style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}
          onPress={() => onStatusPress(yardStatus)}
        >
          <View style={styles.statusContent}>
            <StatusDot status={yardStatus} onPress={onStatusPress} />
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.locationContainer}>
        <Icon name="location-on" size={14} color="#6B7280" />
        <Text style={styles.locationText}>{yard.location}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Capacity</Text>
          <Text style={styles.statValue}>{yard.capacity}</Text>
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

        <View style={styles.occupancyInfo}>
          <Icon name="groups" size={16} color="#6B7280" />
          <Text style={styles.occupancyText}>
            {yard.decksOccupied} occupied / {yard.deckCount}
          </Text>
        </View>
      </View>

      {isAvailable && (
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => onBookPress(yard.id, yard.code)}
        >
          <Icon name="event" size={16} color="white" />
          <Text style={styles.bookButtonText}> Book</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

export default function YardsScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const {
    yards,
    loading,
    error,
    totalPages,
    currentPage,
    totalElements,
    pageSize
  } = useAppSelector((state) => state.yards);

  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [localCurrentPage, setLocalCurrentPage] = useState(0);
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

  // Booking modal states
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedYards, setSelectedYards] = useState<number[]>([]);
  const [selectedYardCodes, setSelectedYardCodes] = useState<string[]>([]);

  // Network connectivity detection
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected ?? false;
      setIsConnected(connected);
      
      // Auto-sync when coming back online
      if (connected && isConnected === false && yards.length > 0) {
        handleBackgroundSync();
      }
    });

    return () => unsubscribe();
  }, [isConnected, yards.length]);

  // Optimized data loading strategy
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadData = async () => {
        if (!isActive) return;

        try {
          setIsInitialLoad(true);
          
          // Step 1: Immediately load cached data (instant display)
          console.log('📱 Loading cached yards...');
          await dispatch(loadCachedYards());
          
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
      
      await dispatch(fetchYards({ page: localCurrentPage, size: pageSize }));
      
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
      await dispatch(fetchYards({ page: localCurrentPage, size: pageSize }));
    } catch (error) {
      console.log('Refresh failed:', error);
      Alert.alert('Sync Failed', 'Unable to refresh data. Please check your connection.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Page change handler
  const handlePageChange = async (page: number) => {
    if (!isConnected) {
      Alert.alert('Offline', 'Pagination requires internet connection.');
      return;
    }

    try {
      await dispatch(fetchYards({ page, size: pageSize }));
      setLocalCurrentPage(page);
    } catch (error) {
      console.log('Page change failed:', error);
      Alert.alert('Error', 'Failed to load page. Please try again.');
    }
  };

  // Sync local page state with Redux state
  useEffect(() => {
    setLocalCurrentPage(currentPage);
  }, [currentPage]);

  // Start animations when we have yards
  useEffect(() => {
    if (!isInitialLoad && yards.length > 0) {
      startEntranceAnimations();
    }
  }, [isInitialLoad, yards]);

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

    // Staggered card animations
    cardAnimations.forEach((anim, index) => {
      if (index < Math.min(yards.length, 9)) {
        Animated.timing(anim, {
          toValue: 1,
          duration: 500,
          delay: 100 + (index * 80),
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

  // Booking handlers
  const handleBookYard = (yardId: number, yardCode: string) => {
    setSelectedYards([yardId]);
    setSelectedYardCodes([yardCode]);
    setBookingModalVisible(true);
  };

  const handleBookingSuccess = () => {
    // Refresh yards data after successful booking
    handleBackgroundSync();
  };

  const handleStatusPress = (status: string) => {
    setSelectedStatus(status === selectedStatus ? 'ALL' : status);
  };

  const getYardStatusForFilter = (yard: any) => {
    if (yard.status === 'MAINTENANCE') {
      return 'MAINTENANCE';
    }

    if (yard.deckCount === 0) {
      return 'FULL';
    }

    if (yard.decksAvailable === yard.deckCount) {
      return 'AVAILABLE';
    }

    if (yard.decksAvailable === 0) {
      return 'FULL';
    }

    return 'PARTIAL';
  };

  const filteredYards = yards
    .filter((yard) => {
      const yardStatus = getYardStatusForFilter(yard);
      const matchesStatus = selectedStatus === 'ALL' || yardStatus === selectedStatus;
      return matchesStatus;
    })
    .sort((a, b) => {
      const statusOrder = {
        'AVAILABLE': 0,
        'PARTIAL': 1,
        'FULL': 2,
        'MAINTENANCE': 3
      };
      const statusA = getYardStatusForFilter(a);
      const statusB = getYardStatusForFilter(b);
      return statusOrder[statusA] - statusOrder[statusB];
    });

  const renderYardCard = ({ item, index }: { item: any; index: number }) => (
    <YardCard
      yard={item}
      onStatusPress={handleStatusPress}
      onBookPress={handleBookYard}
      animationStyle={getCardTransform(cardAnimations[index] || new Animated.Value(1))}
    />
  );

  const FilterTabs = () => (
    <Animated.View style={[styles.filterContainer, { opacity: fadeAnim }]}>
      {['ALL', 'AVAILABLE', 'PARTIAL', 'FULL', 'MAINTENANCE'].map((filter) => (
        <TouchableOpacity
          key={filter}
          style={[
            styles.filterTab,
            selectedStatus === filter && styles.filterTabActive
          ]}
          onPress={() => setSelectedStatus(filter)}
        >
          <View style={styles.filterContent}>
            {filter !== 'ALL' && (
              <StatusDot status={filter} />
            )}
            {filter === 'ALL' && (
              <View style={[styles.allStatusDot, { backgroundColor: '#6B7280' }]} />
            )}
            <Text style={[
              styles.filterText,
              selectedStatus === filter && styles.filterTextActive
            ]}>
              {filter === 'ALL' ? 'All' : 
               filter === 'AVAILABLE' ? 'Available' :
               filter === 'PARTIAL' ? 'Partial' :
               filter === 'FULL' ? 'Full' : 'Maintenance'}
            </Text>
          </View>
          {selectedStatus === filter && (
            <View style={styles.filterIndicator} />
          )}
        </TouchableOpacity>
      ))}
    </Animated.View>
  );

  const Pagination = () => (
    <Animated.View style={[styles.pagination, { opacity: fadeAnim }]}>
      <TouchableOpacity
        style={[styles.pageButton, localCurrentPage === 0 && styles.pageButtonDisabled]}
        onPress={() => localCurrentPage > 0 && handlePageChange(localCurrentPage - 1)}
        disabled={localCurrentPage === 0 || !isConnected}
      >
        <Icon name="chevron-left" size={20} color={localCurrentPage === 0 || !isConnected ? '#9CA3AF' : Color.primary} />
      </TouchableOpacity>

      <View style={styles.pageInfo}>
        <Text style={styles.pageText}>
          Page {localCurrentPage + 1} of {totalPages || 1}
        </Text>
        <Text style={styles.pageSizeText}>
          Showing {filteredYards.length} of {totalElements} yards
        </Text>
        {!isConnected && (
          <Text style={styles.offlineText}>Offline Mode</Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.pageButton, (localCurrentPage === (totalPages - 1) || !isConnected) && styles.pageButtonDisabled]}
        onPress={() => localCurrentPage < (totalPages - 1) && handlePageChange(localCurrentPage + 1)}
        disabled={localCurrentPage === (totalPages - 1) || !isConnected}
      >
        <Icon name="chevron-right" size={20} color={localCurrentPage === (totalPages - 1) || !isConnected ? '#9CA3AF' : Color.primary} />
      </TouchableOpacity>
    </Animated.View>
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
  if (isInitialLoad && yards.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Color.primary} />
        <Text style={styles.loadingText}>Loading yards...</Text>
        <Text style={styles.loadingSubtext}>
          {isConnected === false ? 'Offline - loading cached data' : 'Preparing yards...'}
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
          <Icon name="menu" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Yards</Text>
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

      {/* Filter Tabs */}
      <FilterTabs />

      {/* Yards List */}
      <Animated.View style={[styles.listContainer, { opacity: fadeAnim }]}>
        <FlatList
          data={filteredYards}
          renderItem={renderYardCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="location-on" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>
                {isInitialLoad ? 'Loading yards...' : 'No yards found'}
              </Text>
              <Text style={styles.emptySubtext}>
                {!isConnected ? 'You are currently offline' : 'No yards match the current filter'}
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[Color.primary]}
              tintColor={Color.primary}
              enabled={isConnected === true}
            />
          }
        />
      </Animated.View>

      {/* Pagination */}
      <Pagination />

      {/* Booking Modal */}
      <BookingModal
        visible={bookingModalVisible}
        onClose={() => setBookingModalVisible(false)}
        yardIds={selectedYards}
        yardCodes={selectedYardCodes}
        onBookingSuccess={handleBookingSuccess}
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
    width: 40,
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
    marginTop: 8,
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
  allStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  yardCard: {
    borderRadius: 12,
    padding: 16,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
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
    marginLeft: 12,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
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
    marginBottom: 16,
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
  occupancyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  occupancyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  bookButton: {
    backgroundColor: Color.success,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    width: '20%',
    alignContent: 'flex-end',
    alignSelf: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
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
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  pageInfo: {
    alignItems: 'center',
  },
  pageButton: {
    padding: 8,
    borderRadius: 6,
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  pageSizeText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  offlineText: {
    fontSize: 10,
    color: '#EF4444',
    marginTop: 2,
    fontWeight: '500',
  },
});