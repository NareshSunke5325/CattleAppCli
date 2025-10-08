// screens/UsersScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Switch,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { useAppDispatch, useAppSelector } from '../store/store';
import {
  fetchUsers,
  loadCachedUsers,
  fetchAccountActivity,
  fetchUserRoles,
  addUser,
} from '../store/slices/userSlice';
import { Color } from '../theme';
import type { AccountActivity, User, UserRoles } from '../store/slices/userSlice';
import AddUserModal from '../models/AddUserModal';

const { width } = Dimensions.get('window');

// --- Loading Overlay with User Theme ---
const LoadingOverlay = ({ isConnected }: { isConnected: boolean | null }) => (
  <View style={styles.loadingOverlay}>
    <View style={styles.loadingContent}>
      {/* User-themed icon */}
      <View style={styles.userIconContainer}>
        <Icon name="people" size={48} color={Color.primary} />
        <View style={styles.iconPulse} />
      </View>
      <Text style={styles.loadingText}>Loading Users</Text>
      <Text style={styles.loadingSubtext}>
        {isConnected === false ? 'Offline - loading cached data' : 'Preparing user management...'}
      </Text>
      <ActivityIndicator size="large" color={Color.primary} style={styles.loadingSpinner} />
    </View>
  </View>
);

// --- Status Dot ---
const StatusDot = ({ active, size = 8 }: { active: boolean; size?: number }) => (
  <View style={{ 
    width: size, 
    height: size, 
    borderRadius: size / 2, 
    backgroundColor: active ? '#10B981' : '#6B7280' 
  }} />
);

// --- User Card ---
const UserCard = ({ user, animationStyle }: { user: User; animationStyle: any }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRoleDisplay = (roles: string[]) => {
    return roles.map(role => role.replace('ROLE_', '')).join(', ');
  };

  return (
    <Animated.View style={[styles.userCard, animationStyle]}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userId}>#{user.id}</Text>
        </View>
        <View style={styles.statusContainer}>
          <StatusDot active={user.active} />
          <Text style={styles.statusText}>{user.active ? 'Active' : 'Inactive'}</Text>
        </View>
      </View>

      <View style={styles.userDetails}>
        <View style={styles.detailRow}>
          <Icon name="email" size={14} color="#6B7280" />
          <Text style={styles.detailText} numberOfLines={1}>{user.email}</Text>
        </View>
        
        {user.phone && (
          <View style={styles.detailRow}>
            <Icon name="phone" size={14} color="#6B7280" />
            <Text style={styles.detailText}>{user.phone}</Text>
          </View>
        )}
        
        <View style={styles.detailRow}>
          <Icon name="person" size={14} color="#6B7280" />
          <Text style={styles.detailText}>{user.username}</Text>
        </View>
      </View>

      <View style={styles.rolesContainer}>
        <Text style={styles.rolesLabel}>Roles:</Text>
        <Text style={styles.rolesText}>{getRoleDisplay(user.roles)}</Text>
      </View>

      {user.tasks && user.tasks.length > 0 && (
        <View style={styles.tasksContainer}>
          <Text style={styles.tasksLabel}>Tasks:</Text>
          <View style={styles.tasksList}>
            {user.tasks.map((task: string, index: number) => (
              <View key={index} style={styles.taskChip}>
                <Text style={styles.taskText}>{task}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.dateContainer}>
          <Icon name="calendar-today" size={12} color="#9CA3AF" />
          <Text style={styles.dateText}>Created {formatDate(user.createdAt)}</Text>
        </View>
        
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="edit" size={16} color={Color.primary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// --- Activity Item ---
const ActivityItem = ({ activity, fadeAnim }: { activity: AccountActivity; fadeAnim: Animated.Value }) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getClientIcon = (client: string) => {
    switch (client) {
      case 'MOBILE': return 'smartphone';
      case 'WEB': return 'computer';
      default: return 'devices';
    }
  };

  return (
    <Animated.View style={[styles.activityItem, { opacity: fadeAnim }]}>
      <View style={styles.activityHeader}>
        <View style={styles.activityClient}>
          <Icon name={getClientIcon(activity.client)} size={16} color="#6B7280" />
          <Text style={styles.clientText}>{activity.client}</Text>
        </View>
        <View style={[styles.statusBadge, activity.success ? styles.successBadge : styles.failureBadge]}>
          <Text style={styles.statusBadgeText}>
            {activity.success ? 'Success' : 'Failed'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.ipText}>{activity.ip}</Text>
      <Text style={styles.deviceText}>{activity.deviceId}</Text>
      <Text style={styles.agentText} numberOfLines={1}>{activity.userAgent}</Text>
      
      <View style={styles.activityFooter}>
        <Text style={styles.timestampText}>{formatTimestamp(activity.timestamp)}</Text>
        {!activity.success && activity.failureReason && (
          <Text style={styles.failureReasonText}>{activity.failureReason}</Text>
        )}
      </View>
    </Animated.View>
  );
};

// --- Role Badge ---
const RoleBadge = ({ role, fadeAnim }: { role: string; fadeAnim: Animated.Value }) => {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'MANAGER': return '#3B82F6';
      case 'WORKER': return '#10B981';
      case 'CUSTOMER': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  return (
    <Animated.View style={[styles.roleBadge, { backgroundColor: getRoleColor(role), opacity: fadeAnim }]}>
      <Text style={styles.roleBadgeText}>{role}</Text>
    </Animated.View>
  );
};

// --- Network Status ---
const NetworkStatus = ({ isConnected, syncStatus }: { isConnected: boolean | null; syncStatus: string }) => (
  <View style={[
    styles.networkStatus, 
    isConnected === false && styles.networkStatusOffline, 
    syncStatus === 'syncing' && styles.networkStatusSyncing
  ]}>
    <Icon 
      name={syncStatus === 'syncing' ? 'sync' : isConnected ? 'wifi' : 'wifi-off'} 
      size={14} 
      color={syncStatus === 'syncing' ? '#3B82F6' : isConnected ? '#10B981' : '#6B7280'} 
    />
    <Text style={[
      styles.networkText,
      { color: syncStatus === 'syncing' ? '#3B82F6' : isConnected ? '#10B981' : '#6B7280' }
    ]}>
      {syncStatus === 'syncing' ? 'Syncing...' : isConnected ? 'Online' : 'Offline'}
    </Text>
    {syncStatus === 'success' && <Icon name="check-circle" size={14} color="#10B981" style={styles.syncIcon} />}
    {syncStatus === 'error' && <Icon name="error" size={14} color="#EF4444" style={styles.syncIcon} />}
  </View>
);

// --- Filter Tabs ---
const FilterTabs = ({ selectedRole, setSelectedRole, fadeAnim }: any) => (
  <Animated.View style={[styles.filterContainer, { opacity: fadeAnim }]}>
    {['ALL', 'MANAGER', 'WORKER', 'CUSTOMER'].map(role => (
      <TouchableOpacity 
        key={role} 
        style={[styles.filterTab, selectedRole === role && styles.filterTabActive]}
        onPress={() => setSelectedRole(role)}
      >
        <View style={styles.filterContent}>
          <Text style={[styles.filterText, selectedRole === role && styles.filterTextActive]}>
            {role === 'ALL' ? 'All' : role}
          </Text>
        </View>
        {selectedRole === role && <View style={styles.filterIndicator} />}
      </TouchableOpacity>
    ))}
  </Animated.View>
);

// --- Empty List ---
const EmptyList = ({ isInitialLoad, isConnected }: any) => (
  <View style={styles.emptyContainer}>
    <Icon name="people-outline" size={48} color="#D1D5DB" />
    <Text style={styles.emptyText}>{isInitialLoad ? 'Loading users...' : 'No users found'}</Text>
    <Text style={styles.emptySubtext}>
      {!isConnected ? 'You are currently offline' : 'No users match the current filter'}
    </Text>
  </View>
);

// --- Pagination Component ---
const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalElements, 
  pageSize, 
  isConnected, 
  onPageChange, 
  fadeAnim 
}: any) => (
  <Animated.View style={[styles.pagination, { opacity: fadeAnim }]}>
    <TouchableOpacity
      style={[styles.pageButton, currentPage === 0 && styles.pageButtonDisabled]}
      onPress={() => currentPage > 0 && onPageChange(currentPage - 1)}
      disabled={currentPage === 0 || !isConnected}
    >
      <Icon name="chevron-left" size={20} color={currentPage === 0 || !isConnected ? '#9CA3AF' : Color.primary} />
    </TouchableOpacity>

    <View style={styles.pageInfo}>
      <Text style={styles.pageText}>
        Page {currentPage + 1} of {totalPages || 1}
      </Text>
      <Text style={styles.pageSizeText}>
        Showing {pageSize} of {totalElements} users
      </Text>
      {!isConnected && (
        <Text style={styles.offlineText}>Offline Mode</Text>
      )}
    </View>

    <TouchableOpacity
      style={[styles.pageButton, (currentPage === (totalPages - 1) || !isConnected) && styles.pageButtonDisabled]}
      onPress={() => currentPage < (totalPages - 1) && onPageChange(currentPage + 1)}
      disabled={currentPage === (totalPages - 1) || !isConnected}
    >
      <Icon name="chevron-right" size={20} color={currentPage === (totalPages - 1) || !isConnected ? '#9CA3AF' : Color.primary} />
    </TouchableOpacity>
  </Animated.View>
);

export default function UsersScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { 
    users, 
    totalPages, 
    currentPage, 
    totalElements, 
    pageSize,
    accountActivity,
    userRoles 
  } = useAppSelector((state) => state.users);

  const [selectedRole, setSelectedRole] = useState('ALL');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle'|'syncing'|'success'|'error'>('idle');
  const [localCurrentPage, setLocalCurrentPage] = useState(0);
  const [showActivity, setShowActivity] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(true);

  // Animations
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [cardAnimations] = useState(Array(pageSize).fill(0).map(() => new Animated.Value(0)));

  // Network Detection
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected ?? false;
      setIsConnected(connected);
      if (connected && isConnected === false && users.length > 0) handleBackgroundSync();
    });
    return () => unsubscribe();
  }, [isConnected, users]);

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
            console.log("🌐 Online - fetching users...");
            await Promise.all([
              dispatch(fetchUsers({ page: 0, size: pageSize })),
              dispatch(fetchAccountActivity({ page: 0, size: 3 })),
              dispatch(fetchUserRoles())
            ]);
          } else {
            console.log("📴 Offline - loading cached users...");
            await dispatch(loadCachedUsers());
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
          console.log("❌ Error loading users:", error);
          if (isActive) {
            // fallback to cache if fetch fails
            await dispatch(loadCachedUsers());
            setIsInitialLoad(false);
            startEntranceAnimations();
            setShowLoadingOverlay(false);
          }
        }
      };

      loadData();

      return () => { isActive = false };
    }, [dispatch, pageSize])
  );

  // Background sync function
  const handleBackgroundSync = async () => {
    if (!isConnected) return;
    try {
      setSyncStatus('syncing');
      console.log('🔄 Starting background sync...');
      
      await Promise.all([
        dispatch(fetchUsers({ page: localCurrentPage, size: pageSize })),
        dispatch(fetchAccountActivity({ page: 0, size: 3 })),
        dispatch(fetchUserRoles())
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
    if (!isConnected) return;
    setIsRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchUsers({ page: localCurrentPage, size: pageSize })),
        dispatch(fetchAccountActivity({ page: 0, size: 3 })),
        dispatch(fetchUserRoles())
      ]);
      // Restart animations after refresh
      startEntranceAnimations();
    } catch (error) {
      console.log('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Page change handler
  const handlePageChange = async (page: number) => {
    if (!isConnected) return;

    setShowLoadingOverlay(true);
    try {
      await dispatch(fetchUsers({ page, size: pageSize }));
      setLocalCurrentPage(page);
      
      // Start animations and then hide loading overlay
      startEntranceAnimations();
      setTimeout(() => {
        setShowLoadingOverlay(false);
      }, 600);
    } catch (error) {
      console.log('Page change failed:', error);
      setShowLoadingOverlay(false);
    }
  };

  // Add user handler
  const handleAddUser = async (userData: any) => {
    if (!isConnected) {
      Alert.alert('You need to be online to add users');
      return;
    }

    setIsAddingUser(true);
    try {
      await dispatch(addUser(userData)).unwrap();
      setShowAddUserModal(false);
      // Refresh the list to show new user
      await dispatch(fetchUsers({ page: localCurrentPage, size: pageSize }));
      Alert.alert('User added successfully!');
    } catch (error: any) {
      Alert.alert('Failed to add user: ' + (error.message || 'Unknown error'));
    } finally {
      setIsAddingUser(false);
    }
  };

  // Sync local page state with Redux state
  useEffect(() => {
    setLocalCurrentPage(currentPage);
  }, [currentPage]);

  // Start animations when we have data
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
      if (index < Math.min(users.length, pageSize)) {
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

  useEffect(() => {
    if (!isInitialLoad && users.length > 0 && !showLoadingOverlay) {
      startEntranceAnimations();
    }
  }, [isInitialLoad, users, showLoadingOverlay]);

  const getCardTransform = (anim: Animated.Value) => ({
    transform: [
      { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }
    ],
    opacity: anim
  });

  const getHeaderTransform = () => ({ 
    transform: [{ 
      scale: scaleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) 
    }] 
  });

  const filteredUsers = users.filter(user => {
    const userRole = user.roles[0]?.replace('ROLE_', '') || '';
    return selectedRole === 'ALL' || userRole === selectedRole;
  });

  // Check if current user can add users (manager role)
  const canAddUser = userRoles?.roles.includes('ROLE_MANAGER');

  return (
    <SafeAreaView style={styles.container}>
      {/* Loading Overlay with User Theme */}
      {showLoadingOverlay && (
        <LoadingOverlay isConnected={isConnected} />
      )}

      {/* Header */}
      <Animated.View style={[styles.header, getHeaderTransform()]}>
        <TouchableOpacity onPress={() => navigation.navigate('Home' as never)} style={styles.headerButton}>
          <Icon name="menu" color={'#fff'} size={24} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Users Management</Text>
          <View style={styles.headerUnderline}/>
        </View>
        <View style={styles.headerActions}>
          {canAddUser && (
            <TouchableOpacity 
              onPress={() => setShowAddUserModal(true)} 
              style={styles.headerButton}
            >
              <Icon name="person-add" color={'#fff'} size={24} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Icon name="arrow-back" color={'#fff'} size={24} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Main Content */}
      <View style={styles.listContainer}>
        <FlatList
          data={filteredUsers}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item, index }) => (
            <UserCard 
              user={item} 
              animationStyle={getCardTransform(cardAnimations[index] || new Animated.Value(1))} 
            />
          )}
          contentContainerStyle={styles.listContent}
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
              {/* <NetworkStatus isConnected={isConnected} syncStatus={syncStatus} /> */}
              
              {/* Current User Roles */}
              {userRoles && (
                <Animated.View style={[styles.rolesContainer, { opacity: fadeAnim }]}>
                  <Text style={styles.sectionTitle}>Your Roles</Text>
                  <View style={styles.rolesList}>
                    {userRoles.roles.map((role, index) => (
                      <RoleBadge 
                        key={index} 
                        role={role.replace('ROLE_', '')} 
                        fadeAnim={fadeAnim} 
                      />
                    ))}
                  </View>
                  <Text style={styles.currentRoleText}>
                    Current role: <Text style={styles.currentRoleHighlight}>
                      {userRoles.currentRole.replace('ROLE_', '')}
                    </Text>
                  </Text>
                </Animated.View>
              )}

              {/* Activity Toggle */}
              <Animated.View style={[styles.activityToggle, { opacity: fadeAnim }]}>
                <Text style={styles.activityToggleText}>Show Recent Activity</Text>
                <Switch
                  value={showActivity}
                  onValueChange={setShowActivity}
                  trackColor={{ false: '#E5E7EB', true: Color.primary }}
                  thumbColor={'#fff'}
                />
              </Animated.View>

              {/* Recent Activity */}
              {showActivity && accountActivity.length > 0 && (
                <Animated.View style={{ opacity: fadeAnim }}>
                  <Text style={styles.sectionTitle}>Recent Activity</Text>
                  {accountActivity.map((activity, index) => (
                    <ActivityItem key={index} activity={activity} fadeAnim={fadeAnim} />
                  ))}
                </Animated.View>
              )}

              <FilterTabs 
                selectedRole={selectedRole} 
                setSelectedRole={setSelectedRole} 
                fadeAnim={fadeAnim} 
              />
              <Text style={styles.sectionTitle}>All Users ({filteredUsers.length})</Text>
            </>
          }
          ListEmptyComponent={<EmptyList isInitialLoad={isInitialLoad} isConnected={isConnected} />}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Pagination */}
      <Pagination 
        currentPage={localCurrentPage}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={filteredUsers.length}
        isConnected={isConnected}
        onPageChange={handlePageChange}
        fadeAnim={fadeAnim}
      />

      {/* Add User Modal */}
      <AddUserModal
        visible={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onAddUser={handleAddUser}
        isAdding={isAddingUser}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
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
  userIconContainer: {
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: Color.primary },
  headerButton: { padding: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)' },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerTitleContainer: { alignItems: 'center', flex: 1 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', letterSpacing: 0.5 },
  headerUnderline: { height: 2, width: width * 0.3, backgroundColor: '#86EFAC', marginTop: 4, borderRadius: 1 },
  listContainer: { flex: 1 },
  listContent: { paddingBottom: 16 },
  
  // User Card Styles
  userCard: { backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 8, padding: 16, borderRadius: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  userHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  userId: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusContainer: { flexDirection: 'row', alignItems: 'center' },
  statusText: { marginLeft: 4, fontSize: 12, color: '#6B7280' },
  userDetails: { marginTop: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  detailText: { marginLeft: 8, fontSize: 14, color: '#6B7280' },
  rolesContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  rolesLabel: { fontSize: 12, color: '#6B7280', marginRight: 4 },
  rolesText: { fontSize: 12, fontWeight: '600', color: Color.primary },
  tasksContainer: { marginTop: 8 },
  tasksLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  tasksList: { flexDirection: 'row', flexWrap: 'wrap' },
  taskChip: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 4, marginBottom: 4 },
  taskText: { fontSize: 10, color: '#4B5563' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  dateContainer: { flexDirection: 'row', alignItems: 'center' },
  dateText: { marginLeft: 4, fontSize: 12, color: '#9CA3AF' },
  actionButton: { padding: 6, borderRadius: 6, backgroundColor: '#F3F4F6' },
  
  // Activity Styles
  activityToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 16, marginBottom: 8 },
  activityToggleText: { fontSize: 14, fontWeight: '600', color: '#111827' },
  activityItem: { backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 4, padding: 12, borderRadius: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  activityClient: { flexDirection: 'row', alignItems: 'center' },
  clientText: { marginLeft: 4, fontSize: 12, fontWeight: '600', color: '#6B7280' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  successBadge: { backgroundColor: '#D1FAE5' },
  failureBadge: { backgroundColor: '#FEE2E2' },
  statusBadgeText: { fontSize: 10, fontWeight: '600', color: '#065F46' },
  ipText: { fontSize: 12, color: '#111827', fontWeight: '500' },
  deviceText: { fontSize: 10, color: '#6B7280', marginTop: 2 },
  agentText: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  activityFooter: { marginTop: 8 },
  timestampText: { fontSize: 10, color: '#9CA3AF' },
  failureReasonText: { fontSize: 10, color: '#DC2626', marginTop: 2 },
  
  // Role Badge Styles
  rolesList: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8, marginBottom: 8 },
  roleBadgeText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  currentRoleText: { fontSize: 14, color: '#6B7280', marginTop: 8 },
  currentRoleHighlight: { fontWeight: 'bold', color: Color.primary },
  
  // Network Status
  networkStatus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#F0F9FF', marginHorizontal: 16, marginTop: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E0F2FE' },
  networkStatusOffline: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  networkStatusSyncing: { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' },
  networkText: { fontSize: 12, fontWeight: '500', marginLeft: 6 },
  syncIcon: { marginLeft: 4 },
  
  // Filter Tabs
  filterContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 16, marginBottom: 16, backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 16, paddingVertical: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  filterTab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8, margin: 4, position: 'relative' },
  filterTabActive: { backgroundColor: '#F0F9FF' },
  filterContent: { flexDirection: 'row', alignItems: 'center' },
  filterText: { color: '#6B7280', fontSize: 12, fontWeight: '500' },
  filterTextActive: { fontWeight: '600', color: Color.primary },
  filterIndicator: { position: 'absolute', bottom: 4, width: 20, height: 3, backgroundColor: Color.primary, borderRadius: 2 },
  
  // Section Title
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#111827', paddingHorizontal: 16, marginTop: 16 },
  
  // Empty State
  emptyContainer: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyText: { fontSize: 18, color: '#6B7280', marginTop: 16, marginBottom: 8, fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
  
  // Pagination
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  pageInfo: { alignItems: 'center' },
  pageButton: { padding: 8, borderRadius: 6 },
  pageButtonDisabled: { opacity: 0.5 },
  pageText: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  pageSizeText: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  offlineText: { fontSize: 10, color: '#EF4444', marginTop: 2, fontWeight: '500' },
});