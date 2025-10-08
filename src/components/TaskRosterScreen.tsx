// Updated TaskRosterScreen.tsx with proper pagination
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
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import NetInfo from '@react-native-community/netinfo';
import { useAppDispatch, useAppSelector } from '../store/store';
import { Color } from '../theme';
import { fetchProgressStats, fetchTasks, loadCachedTasks } from '../store/slices/rosterSlice';

const { width } = Dimensions.get('window');

// --- Loading Overlay with Task Theme ---
const LoadingOverlay = ({ isConnected }: { isConnected: boolean | null }) => (
  <View style={styles.loadingOverlay}>
    <View style={styles.loadingContent}>
      {/* Task-themed icon */}
      <View style={styles.taskIconContainer}>
        <Icon name="assignment" size={48} color={Color.primary} />
        <View style={styles.iconPulse} />
      </View>
      <Text style={styles.loadingText}>Loading Tasks Rosters</Text>
      <Text style={styles.loadingSubtext}>
        {isConnected === false ? 'Offline - loading cached data' : 'Preparing your tasks...'}
      </Text>
      <ActivityIndicator size="large" color={Color.primary} style={styles.loadingSpinner} />
    </View>
  </View>
);

// --- Updated Filter Tabs with Horizontal Scroll ---
const FilterTabs = ({ 
  selectedFilter, 
  setSelectedFilter, 
  fadeAnim 
}: { 
  selectedFilter: string; 
  setSelectedFilter: (filter: string) => void;
  fadeAnim: Animated.Value;
}) => {
  const filterOptions = [
    { key: 'All', label: 'All' },
    { key: 'Pending', label: 'Pending' },
    { key: 'Running', label: 'Running' },
    { key: 'Done', label: 'Done' }
  ];

  return (
    <Animated.View style={[styles.filterContainer, { opacity: fadeAnim }]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
      >
        {filterOptions.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterTab,
              selectedFilter === filter.key && styles.filterTabActive
            ]}
            onPress={() => setSelectedFilter(filter.key)}
          >
            <Text style={[
              styles.filterText,
              selectedFilter === filter.key && styles.filterTextActive
            ]} numberOfLines={1}>
              {filter.label}
            </Text>
            {selectedFilter === filter.key && (
              <View style={styles.filterIndicator} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );
};

const TaskRosterScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  // Get data from Redux store
  const { tasks, progressStats, loading, totalPages, currentPage, totalElements, pageSize } = useAppSelector(state => state.roster);

  const [selectedFilter, setSelectedFilter] = useState('All');
  const [localCurrentPage, setLocalCurrentPage] = useState(0);
  const [pageSizeLocal] = useState(6);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(true);

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [cardAnimations] = useState(
    Array(6).fill(0).map(() => new Animated.Value(0))
  );

  const statusColors = {
    PENDING: '#F59E0B',
    IN_PROGRESS: '#3B82F6',
    COMPLETED: '#10B981',
    CANCELLED: '#6B7280',
    HIGH: '#EF4444',
    MEDIUM: '#F59E0B',
    LOW: '#10B981'
  };

  // Network connectivity detection
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected ?? false;
      setIsConnected(connected);
      
      // Auto-sync when coming back online
      if (connected && isConnected === false && tasks.length > 0) {
        handleBackgroundSync();
      }
    });

    return () => unsubscribe();
  }, [isConnected, tasks.length]);

  // Optimized data loading strategy with loading overlay
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadData = async () => {
        if (!isActive) return;

        try {
          setShowLoadingOverlay(true);

          const netState = await NetInfo.fetch();
          const connected = netState.isConnected ?? false;

          if (connected) {
            console.log("🌐 Online - fetching tasks...");
            await Promise.all([
              dispatch(fetchProgressStats()),
              dispatch(fetchTasks({ page: 0, size: pageSizeLocal }))
            ]);
          } else {
            console.log("📴 Offline - loading cached tasks...");
            await dispatch(loadCachedTasks());
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
          console.log("❌ Error loading tasks:", error);
          if (isActive) {
            // fallback to cache if fetch fails
            await dispatch(loadCachedTasks());
            setIsInitialLoad(false);
            startEntranceAnimations();
            setShowLoadingOverlay(false);
          }
        }
      };

      loadData();

      return () => { isActive = false };
    }, [dispatch, pageSizeLocal])
  );

  // Background sync function
  const handleBackgroundSync = async () => {
    if (!isConnected) return;

    try {
      setSyncStatus('syncing');
      console.log('🔄 Starting background sync...');
      
      await Promise.all([
        dispatch(fetchProgressStats()),
        dispatch(fetchTasks({ page: localCurrentPage, size: pageSizeLocal }))
      ]);
      
      setSyncStatus('success');
      console.log('✅ Background sync completed');
      
      // Reset sync status after delay
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.log('❌ Background sync failed:', error);
      setSyncStatus('error');
      
      // Reset sync status after delay
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
        dispatch(fetchProgressStats()),
        dispatch(fetchTasks({ page: localCurrentPage, size: pageSizeLocal }))
      ]);
      // Restart animations after refresh
      startEntranceAnimations();
    } catch (error) {
      console.log('Refresh failed:', error);
      Alert.alert('Sync Failed', 'Unable to refresh data. Please check your connection.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fixed Page change handler
  const handlePageChange = async (page: number) => {
    if (!isConnected) {
      Alert.alert('Offline', 'Pagination requires internet connection.');
      return;
    }

    setShowLoadingOverlay(true);
    try {
      console.log(`📄 Changing to page: ${page}`);
      await dispatch(fetchTasks({ page, size: pageSizeLocal }));
      setLocalCurrentPage(page);
      
      // Start animations and then hide loading overlay
      startEntranceAnimations();
      setTimeout(() => {
        setShowLoadingOverlay(false);
      }, 600);
    } catch (error) {
      console.log('❌ Page change failed:', error);
      Alert.alert('Error', 'Failed to load page. Please try again.');
      setShowLoadingOverlay(false);
    }
  };

  // Sync local page state with Redux state
  useEffect(() => {
    console.log(`🔄 Syncing local page state: Redux currentPage = ${currentPage}`);
    setLocalCurrentPage(currentPage);
  }, [currentPage]);

  // Start animations when we have tasks
  useEffect(() => {
    if (!isInitialLoad && tasks.length > 0 && !showLoadingOverlay) {
      startEntranceAnimations();
    }
  }, [isInitialLoad, tasks, showLoadingOverlay]);

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
      if (index < Math.min(tasks.length, 6)) {
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

  // Format date function
  const formatDate = (start: string, end: string) => {
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);

      const formattedStart = startDate.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const formattedEnd = endDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      return `${formattedStart} – ${formattedEnd}`;
    } catch (error) {
      console.log('Date formatting error:', error);
      return 'Invalid date';
    }
  };

  // Map API status to display status
  const getDisplayStatus = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'IN_PROGRESS': return 'Running';
      case 'COMPLETED': return 'Done';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  };

  const filteredTasks = tasks.filter((task: { status: string; }) =>
    selectedFilter === 'All' ||
    (selectedFilter === 'Running' ? task.status === 'IN_PROGRESS' :
      selectedFilter === 'Done' ? task.status === 'COMPLETED' :
        task.status === 'PENDING')
  );

  const getStatusColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || '#6B7280';
  };

  const handleTaskAction = (task: any, action: string) => {
    Alert.alert(
      `${action} Task`,
      `${action} "${task.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          onPress: () => {
            // Here you would typically dispatch an action to update the task status
            Alert.alert('Success', `Task ${action.toLowerCase()} successfully`);
          }
        }
      ]
    );
  };

  const handleAddRoster = () => {
    Alert.alert('Add Roster', 'Create new task roster functionality would go here');
  };

  const TaskCard = ({ task, index }: { task: any; index: number }) => {
    return (
      <Animated.View
        style={[
          styles.taskCard,
          getCardTransform(cardAnimations[index] || new Animated.Value(1)),
        ]}
      >
        {/* Task Header */}
        <View style={styles.taskHeader}>
          <View style={styles.taskTitleContainer}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <View style={[styles.priorityBadge, { backgroundColor: getStatusColor(task.priority) }]}>
              <Text style={styles.priorityText}>{task.priority}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
            <Text style={styles.statusText}>{getDisplayStatus(task.status)}</Text>
          </View>
        </View>

        {/* Task Date */}
        <View style={styles.dateContainer}>
          <Icon name="schedule" size={14} color="#6B7280" />
          <Text style={styles.dateText}>{formatDate(task.scheduledStart, task.scheduledEnd)}</Text>
        </View>

        {/* Task Description */}
        <Text style={styles.descriptionText}>{task.description}</Text>

        {/* Additional task info */}
        {task.animalCount && (
          <View style={styles.infoRow}>
            <Icon name="pets" size={14} color="#6B7280" />
            <Text style={styles.infoText}>Animals: {task.animalCount}</Text>
          </View>
        )}

        {task.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notes: </Text>
            <Text style={styles.notesText}>{task.notes}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {task.status === 'PENDING' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.startButton]}
                onPress={() => handleTaskAction(task, 'Start')}
              >
                <Icon name="play-arrow" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Start</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => handleTaskAction(task, 'Edit')}
              >
                <Icon name="edit" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
            </>
          )}
          {task.status === 'IN_PROGRESS' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={() => handleTaskAction(task, 'Complete')}
              >
                <Icon name="check" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Complete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.pauseButton]}
                onPress={() => handleTaskAction(task, 'Pause')}
              >
                <Icon name="pause" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Pause</Text>
              </TouchableOpacity>
            </>
          )}
          {task.status === 'COMPLETED' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.reopenButton]}
              onPress={() => handleTaskAction(task, 'Reopen')}
            >
              <Icon name="refresh" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Reopen</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleTaskAction(task, 'Delete')}
          >
            <Icon name="delete" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  // Fixed Pagination Component
  const Pagination = () => (
    <Animated.View style={[styles.pagination, { opacity: fadeAnim }]}>
      <TouchableOpacity
        style={[styles.pageButton, localCurrentPage === 0 && styles.pageButtonDisabled]}
        onPress={() => handlePageChange(localCurrentPage - 1)}
        disabled={localCurrentPage === 0 || !isConnected}
      >
        <Icon name="chevron-left" size={20} color={localCurrentPage === 0 || !isConnected ? '#9CA3AF' : Color.primary} />
      </TouchableOpacity>

      <View style={styles.pageInfo}>
        <Text style={styles.pageText}>
          Page {localCurrentPage + 1} of {Math.max(totalPages, 1)}
        </Text>
        <Text style={styles.pageSizeText}>
          Showing {filteredTasks.length} of {totalElements} tasks
        </Text>
        {!isConnected && (
          <Text style={styles.offlineText}>Offline Mode</Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.pageButton, (localCurrentPage >= (totalPages - 1) || !isConnected) && styles.pageButtonDisabled]}
        onPress={() => handlePageChange(localCurrentPage + 1)}
        disabled={localCurrentPage >= (totalPages - 1) || !isConnected}
      >
        <Icon name="chevron-right" size={20} color={localCurrentPage >= (totalPages - 1) || !isConnected ? '#9CA3AF' : Color.primary} />
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Loading Overlay with Task Theme */}
      {showLoadingOverlay && (
        <LoadingOverlay isConnected={isConnected} />
      )}

      {/* Header */}
      <Animated.View style={[styles.header, getHeaderTransform()]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('Home' as never)}
        >
          <Icon name="menu" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Task Rosters</Text>
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
      <FilterTabs 
        selectedFilter={selectedFilter} 
        setSelectedFilter={setSelectedFilter} 
        fadeAnim={fadeAnim} 
      />

      {/* Tasks List */}
      <Animated.View style={[styles.listContainer, { opacity: fadeAnim }]}>
        <FlatList
          data={filteredTasks}
          renderItem={({ item, index }) => <TaskCard task={item} index={index} />}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>
              All Tasks ({filteredTasks.length})
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="assignment" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>
                {isInitialLoad ? 'Loading tasks...' : 'No tasks found'}
              </Text>
              <Text style={styles.emptySubtext}>
                {!isConnected ? 'You are currently offline' : 'No tasks match the current filter'}
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
      {totalPages > 1 && <Pagination />}

      {/* Add Roster Floating Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={handleAddRoster}
        activeOpacity={0.9}
      >
        <View style={styles.floatingButtonContent}>
          <Icon name="add" size={28} color="#fff" />
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

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
  taskIconContainer: {
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
  // Updated Filter Container with Horizontal Scroll
  filterContainer: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginTop: 8,
  },
  filterScrollContent: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 4,
    minWidth: 80,
    alignItems: 'center',
    position: 'relative',
  },
  filterTabActive: {
    backgroundColor: '#F0F9FF',
  },
  filterText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    flexShrink: 1,
  },
  filterTextActive: {
    color: Color.primary,
    fontWeight: '600',
  },
  filterIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 20,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#111827',
    marginTop: 8,
  },
  taskCard: {
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
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
    flexShrink: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  descriptionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  notesContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  notesLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  notesText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  startButton: {
    backgroundColor: '#10B981',
  },
  editButton: {
    backgroundColor: '#3B82F6',
  },
  completeButton: {
    backgroundColor: '#10B981',
  },
  pauseButton: {
    backgroundColor: '#F59E0B',
  },
  reopenButton: {
    backgroundColor: '#6B7280',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  floatingButton: {
    position: 'absolute',
    bottom: 85,
    right: 20,
    backgroundColor: Color.primary,
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  floatingButtonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TaskRosterScreen;