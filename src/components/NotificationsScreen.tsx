// screens/NotificationsScreen.tsx
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import NetInfo from '@react-native-community/netinfo';
import { useAppDispatch, useAppSelector } from '../store/store';
import {
  fetchNotifications,
  loadCachedNotifications,
  clearAllNotifications,
  markNotificationRead
} from '../store/slices/notificationsSlice';
import { Color } from '../theme';

const { width } = Dimensions.get('window');

// --- Loading Overlay with Notification Theme ---
const LoadingOverlay = ({ isConnected }: { isConnected: boolean | null }) => (
  <View style={styles.loadingOverlay}>
    <View style={styles.loadingContent}>
      {/* Notification-themed icon */}
      <View style={styles.notificationIconContainer}>
        <Icon name="notifications" size={48} color={Color.primary} />
        <View style={styles.iconPulse} />
      </View>
      <Text style={styles.loadingText}>Loading Notifications</Text>
      <Text style={styles.loadingSubtext}>
        {isConnected === false ? 'Offline - loading cached data' : 'Preparing your notifications...'}
      </Text>
      <ActivityIndicator size="large" color={Color.primary} style={styles.loadingSpinner} />
    </View>
  </View>
);

interface NotificationItemProps {
  notification: {
    id: number;
    bookingId: number;
    bookingStatus: string;
    contactName: string;
    contactPhone: string;
    remarks: string;
    channel: 'SMS' | 'EMAIL';
    success: boolean;
    error: string | null;
    sentAt: string;
  };
  onViewPress: (notification: any) => void;
  onResendPress: (notification: any) => void;
  onClearPress: (notificationId: number) => void;
  animationStyle: any;
}

const StatusIcon = ({ channel, success }: { channel: string; success: boolean }) => {
  const getIconName = () => {
    if (channel === 'EMAIL') {
      return success ? 'email' : 'email';
    }
    return success ? 'sms' : 'sms';
  };

  const getIconColor = () => {
    if (!success) return '#EF4444';
    return channel === 'EMAIL' ? '#3B82F6' : '#10B981';
  };

  return (
    <View style={[styles.statusIcon, { backgroundColor: getIconColor() + '20' }]}>
      <Icon
        name={getIconName()}
        size={16}
        color={getIconColor()}
      />
      {!success && (
        <Icon
          name="error"
          size={12}
          color="#EF4444"
          style={styles.errorIcon}
        />
      )}
    </View>
  );
};

function NotificationItem({
  notification,
  onViewPress,
  onResendPress,
  onClearPress,
  animationStyle
}: NotificationItemProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = () => {
    switch (notification.bookingStatus) {
      case 'CONFIRMED':
        return '#10B981';
      case 'SCHEDULED':
        return '#3B82F6';
      case 'IN_PROGRESS':
        return '#F59E0B';
      case 'COMPLETED':
        return '#6B7280';
      case 'CANCELLED':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  return (
    <Animated.View style={[styles.notificationCard, animationStyle]}>
      <View style={styles.notificationHeader}>
        <View style={styles.notificationInfo}>
          <StatusIcon channel={notification.channel} success={notification.success} />
          <View style={styles.notificationText}>
            <Text style={styles.contactName}>{notification.contactName}</Text>
            <Text style={styles.contactPhone}>{notification.contactPhone}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{notification.bookingStatus.replace('_', ' ')}</Text>
        </View>
      </View>

      <Text style={styles.remarks}>{notification.remarks}</Text>

      <View style={styles.notificationFooter}>
        <Text style={styles.timestamp}>{formatDate(notification.sentAt)}</Text>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onViewPress(notification)}
          >
            <Text style={styles.actionText}>View</Text>
          </TouchableOpacity>

          {!notification.success && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onResendPress(notification)}
            >
              <Text style={styles.actionText}>Resend</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onClearPress(notification.id)}
          >
            <Text style={styles.actionText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!notification.success && notification.error && (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={14} color="#EF4444" />
          <Text style={styles.errorText}>{notification.error}</Text>
        </View>
      )}
    </Animated.View>
  );
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const {
    notifications,
    loading,
    error,
    totalPages,
    currentPage,
    totalElements,
    pageSize,
    unreadCount
  } = useAppSelector((state) => state.notifications);

  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'SMS' | 'EMAIL'>('ALL');
  const [localCurrentPage, setLocalCurrentPage] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(true);

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [cardAnimations] = useState(
    Array(20).fill(0).map(() => new Animated.Value(0))
  );

  // Background sync function
  const handleBackgroundSync = async () => {
    if (!isConnected) return;

    try {
      console.log('🔄 Starting background sync...');
      await dispatch(fetchNotifications({ page: localCurrentPage, size: pageSize }));
      console.log('✅ Background sync completed');
    } catch (error) {
      console.log('❌ Background sync failed:', error);
    }
  };

  // Network connectivity detection
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected ?? false;
      setIsConnected(connected);

      if (connected && isConnected === false && notifications.length > 0) {
        handleBackgroundSync();
      }
    });

    return () => unsubscribe();
  }, [isConnected, notifications.length]);

  // Optimized data loading strategy
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadData = async () => {
        try {
          setShowLoadingOverlay(true);

          const netState = await NetInfo.fetch();
          const connected = netState.isConnected ?? false;

          if (connected) {
            console.log("🌐 Online - fetching notifications...");
            await dispatch(fetchNotifications({ page: 0, size: pageSize }));
          } else {
            console.log("📴 Offline - loading cached notifications...");
            await dispatch(loadCachedNotifications());
          }

          if (isActive) {
            setIsInitialLoad(false);
            // Start animations immediately, then hide loading overlay
            startEntranceAnimations();
            
            // Delay hiding the loading overlay to ensure animations are visible
            setTimeout(() => {
              setShowLoadingOverlay(false);
            }, 600);
          }
        } catch (error) {
          console.log("❌ Error loading notifications:", error);
          if (isActive) {
            // fallback to cache if fetch fails
            await dispatch(loadCachedNotifications());
            setIsInitialLoad(false);
            startEntranceAnimations();
            setShowLoadingOverlay(false);
          }
        }
      };

      loadData();

      return () => {
        isActive = false;
      };
    }, [dispatch, pageSize])
  );

  // Manual refresh function
  const handleRefresh = async () => {
    if (!isConnected) {
      Alert.alert('Offline', 'You are currently offline. Unable to refresh.');
      return;
    }

    setIsRefreshing(true);
    try {
      await dispatch(fetchNotifications({ page: localCurrentPage, size: pageSize }));
      // Restart animations after refresh
      startEntranceAnimations();
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

    setShowLoadingOverlay(true);
    try {
      await dispatch(fetchNotifications({ page, size: pageSize }));
      setLocalCurrentPage(page);
      
      // Start animations and then hide loading overlay
      startEntranceAnimations();
      setTimeout(() => {
        setShowLoadingOverlay(false);
      }, 600);
    } catch (error) {
      console.log('Page change failed:', error);
      Alert.alert('Error', 'Failed to load page. Please try again.');
      setShowLoadingOverlay(false);
    }
  };

  // Sync local page state with Redux state
  useEffect(() => {
    setLocalCurrentPage(currentPage);
  }, [currentPage]);

  // Start animations when we have notifications
  useEffect(() => {
    if (!isInitialLoad && notifications.length > 0 && !showLoadingOverlay) {
      startEntranceAnimations();
    }
  }, [isInitialLoad, notifications, showLoadingOverlay]);

  const startEntranceAnimations = () => {
    // Reset animations first
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.8);
    cardAnimations.forEach(anim => anim.setValue(0));

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
      if (index < Math.min(notifications.length, 20)) {
        Animated.timing(anim, {
          toValue: 1,
          duration: 500,
          delay: 100 + (index * 60),
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
          outputRange: [30, 0],
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

  // Action handlers
  const handleViewPress = (notification: any) => {
    // Navigate to booking details or show details
    Alert.alert('View Notification', `Booking ID: ${notification.bookingId}\nStatus: ${notification.bookingStatus}`);
  };

  const handleResendPress = (notification: any) => {
    Alert.alert(
      'Resend Notification',
      `Resend ${notification.channel} to ${notification.contactName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resend',
          style: 'default',
          onPress: () => {
            // Implement resend logic here
            Alert.alert('Success', 'Notification has been resent.');
          }
        },
      ]
    );
  };

  const handleClearPress = (notificationId: number) => {
    Alert.alert(
      'Clear Notification',
      'Are you sure you want to clear this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            // Implement clear logic here
            dispatch(markNotificationRead(notificationId));
          }
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => dispatch(clearAllNotifications())
        },
      ]
    );
  };

  const filteredNotifications = notifications
    .filter((notification: { channel: string; }) => {
      const matchesFilter = selectedFilter === 'ALL' || notification.channel === selectedFilter;
      return matchesFilter;
    })
    .sort((a: { sentAt: string | number | Date; }, b: { sentAt: string | number | Date; }) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

  const renderNotificationItem = ({ item, index }: { item: any; index: number }) => (
    <NotificationItem
      notification={item}
      onViewPress={handleViewPress}
      onResendPress={handleResendPress}
      onClearPress={handleClearPress}
      animationStyle={getCardTransform(cardAnimations[index] || new Animated.Value(1))}
    />
  );

  const FilterTabs = () => (
    <Animated.View style={[styles.filterContainer, { opacity: fadeAnim }]}>
      {['ALL', 'SMS', 'EMAIL'].map((filter) => (
        <TouchableOpacity
          key={filter}
          style={[
            styles.filterTab,
            selectedFilter === filter && styles.filterTabActive
          ]}
          onPress={() => setSelectedFilter(filter as 'ALL' | 'SMS' | 'EMAIL')}
        >
          <View style={styles.filterContent}>
            {filter !== 'ALL' && (
              <Icon
                name={filter === 'SMS' ? 'sms' : 'email'}
                size={14}
                color={selectedFilter === filter ? Color.primary : '#6B7280'}
              />
            )}
            <Text style={[
              styles.filterText,
              selectedFilter === filter && styles.filterTextActive
            ]}>
              {filter === 'ALL' ? 'All' : filter}
            </Text>
          </View>
          {selectedFilter === filter && (
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
          Showing {filteredNotifications.length} of {totalElements} notifications
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Loading Overlay with Notification Theme */}
      {showLoadingOverlay && (
        <LoadingOverlay isConnected={isConnected} />
      )}

      {/* Header */}
      <Animated.View style={[styles.header, getHeaderTransform()]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('Dashboard' as never)}
        >
          <Icon name="menu" color={'#fff'} size={24} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
          <View style={styles.headerUnderline} />
        </View>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleClearAll}
          disabled={notifications.length === 0}
        >
          <Icon name="notifications" size={24} color={notifications.length === 0 ? '#9CA3AF' : '#fff'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Filter Tabs */}
      <FilterTabs />

      {/* Notifications List */}
      <Animated.View style={[styles.listContainer, { opacity: fadeAnim }]}>
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="notifications" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No notifications found</Text>
              <Text style={styles.emptySubtext}>
                {!isConnected ? 'You are currently offline' : 'No notifications match the current filter'}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  // Loading Overlay Styles
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(249, 250, 251, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContent: {
    alignItems: 'center',
    padding: 20,
  },
  notificationIconContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  iconPulse: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: '#10B98120',
    borderRadius: 34,
    borderWidth: 2,
    borderColor: '#10B98140',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: Color.primary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingSpinner: {
    marginTop: 10,
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
  headerButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginRight: 3
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
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
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  errorIcon: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  notificationText: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  remarks: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 12,
    color: Color.primary,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    gap: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
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