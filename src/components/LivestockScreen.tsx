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
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { useAppDispatch, useAppSelector } from '../store/store';
import {
  fetchLivestockKPIs,
  loadCachedLivestockKPIs,
  fetchLivestockYards,
  loadCachedLivestockYards,
} from '../store/slices/livestockSlice';
import { Color } from '../theme';

const { width } = Dimensions.get('window');

// --- Status Dot ---
const StatusDot = ({ status, size = 8 }: { status: string; size?: number }) => {
  const getDotColor = () => {
    switch (status) {
      case 'AVAILABLE': return '#10B981';
      case 'PARTIAL': return '#F59E0B';
      case 'FULL': return '#EF4444';
      case 'MAINTENANCE': return '#3B82F6';
      default: return '#6B7280';
    }
  };
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: getDotColor() }} />
  );
};

// --- KPI Card ---
const KPICard = ({ title, value, subtitle, color = Color.primary }: any) => (
  <View style={styles.kpiCard}>
    <Text style={[styles.kpiValue, { color }]} numberOfLines={1}>{value}</Text>
    <Text style={styles.kpiTitle}>{title}</Text>
    {subtitle && <Text style={styles.kpiSubtitle}>{subtitle}</Text>}
  </View>
);

// --- Yard Card ---
const YardCard = ({ yard, animationStyle }: any) => {
  const getYardStatus = () => {
    if (yard.status === 'MAINTENANCE') return 'MAINTENANCE';
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
        <View>
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
        <View style={styles.statItem}><Text style={styles.statLabel}>Herds</Text><Text style={styles.statValue}>{yard.herdCount}</Text></View>
        <View style={styles.statItem}><Text style={styles.statLabel}>Decks</Text><Text style={styles.statValue}>{yard.deckCount}</Text></View>
        <View style={styles.statItem}><Text style={styles.statLabel}>Available</Text><Text style={styles.statValue}>{yard.decksAvailable}</Text></View>
      </View>

      <View style={styles.capacityContainer}>
        <View style={styles.capacityHeader}>
          <Text style={styles.capacityLabel}>Capacity usage</Text>
          <Text style={styles.capacityPercentage}>{occupancyRate.toFixed(0)}%</Text>
        </View>
        <View style={styles.capacityBar}>
          <View style={[styles.capacityFill, { width: `${Math.min(occupancyRate, 100)}%` }]} />
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton}><Icon name="add" size={16} color="#fff" /><Text style={styles.actionText}>Add Herd</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.transferButton]}><Icon name="swap-horiz" size={16} color="#fff" /><Text style={styles.actionText}>Transfer</Text></TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// --- Alerts ---
const Alerts = ({ alerts, fadeAnim }: any) => (
  <Animated.View style={{ opacity: fadeAnim, marginTop: 16 }}>
    <Text style={styles.alertsTitle}>Alerts</Text>
    {alerts.map((alert:any, idx:number) => (
      <View key={idx} style={[styles.alertItem, {
        backgroundColor: alert.severity==='WARN' ? '#FEF3C7' : alert.severity==='ERROR' ? '#FEE2E2' : '#DBEAFE',
        borderLeftColor: alert.severity==='WARN' ? '#D97706' : alert.severity==='ERROR' ? '#DC2626' : '#2563EB'
      }]}>
        <Icon name={alert.severity==='WARN'?'warning':alert.severity==='ERROR'?'error':'info'} size={16}
              color={alert.severity==='WARN'?'#D97706':alert.severity==='ERROR'?'#DC2626':'#2563EB'} />
        <Text style={styles.alertText}>{alert.message}</Text>
      </View>
    ))}
  </Animated.View>
);

// --- HerdType Grid ---
const HerdTypeGrid = ({ herdTypeCounts, fadeAnim }: any) => (
  <Animated.View style={[styles.herdTypeContainer, { opacity: fadeAnim }]}>
    <Text style={styles.herdTypeTitle}>Herd Composition</Text>
    <View style={styles.herdTypeGrid}>
      {Object.entries(herdTypeCounts).map(([type,count])=>(
        <View key={type} style={styles.herdTypeItem}>
          <Text style={styles.herdTypeCount}>{count as any}</Text>
          <Text style={styles.herdTypeLabel}>{type}</Text>
        </View>
      ))}
    </View>
  </Animated.View>
);

// --- Updated Filter Tabs without Horizontal Scroll ---
const FilterTabs = ({ 
  selectedStatus, 
  setSelectedStatus, 
  fadeAnim 
}: { 
  selectedStatus: string; 
  setSelectedStatus: (status: string) => void;
  fadeAnim: Animated.Value;
}) => {
  const filters = [
    { key: 'ALL', label: 'All' },
    { key: 'AVAILABLE', label: 'Available' },
    { key: 'PARTIAL', label: 'Partial' },
    { key: 'FULL', label: 'Full' },
    { key: 'MAINTENANCE', label: 'Maintenance' }
  ];

  return (
    <Animated.View style={[styles.filterContainer, { opacity: fadeAnim }]}>
      <View style={styles.filterContentContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterTab,
              selectedStatus === filter.key && styles.filterTabActive
            ]}
            onPress={() => setSelectedStatus(filter.key)}
          >
            <View style={styles.filterContent}>
              <StatusDot status={filter.key === 'ALL' ? 'AVAILABLE' : filter.key} />
              <Text style={[
                styles.filterText,
                selectedStatus === filter.key && styles.filterTextActive
              ]} numberOfLines={1}>
                {filter.label}
              </Text>
            </View>
            {selectedStatus === filter.key && (
              <View style={styles.filterIndicator} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );
};

// --- Network Status ---
const NetworkStatus = ({ isConnected, syncStatus }: any) => (
  <View style={[styles.networkStatus, isConnected===false && styles.networkStatusOffline, syncStatus==='syncing' && styles.networkStatusSyncing]}>
    <Icon name={syncStatus==='syncing'?'sync':isConnected?'wifi':'wifi-off'} size={14} color={syncStatus==='syncing'?'#3B82F6':isConnected?'#10B981':'#6B7280'} />
    <Text style={[styles.networkText,{color:syncStatus==='syncing'?'#3B82F6':isConnected?'#10B981':'#6B7280'}]}>
      {syncStatus==='syncing'?'Syncing...':isConnected?'Online':'Offline'}
    </Text>
    {syncStatus==='success' && <Icon name="check-circle" size={14} color="#10B981" style={styles.syncIcon} />}
    {syncStatus==='error' && <Icon name="error" size={14} color="#EF4444" style={styles.syncIcon} />}
  </View>
);

// --- Empty List ---
const EmptyList = ({ isInitialLoad, isConnected }: any) => (
  <View style={styles.emptyContainer}>
    <Icon name="pets" size={48} color="#D1D5DB" />
    <Text style={styles.emptyText}>{isInitialLoad?'Loading livestock data...':'No yards found'}</Text>
    <Text style={styles.emptySubtext}>{!isConnected?'You are currently offline':'No yards match the current filter'}</Text>
  </View>
);

// --- Fixed Pagination Component ---
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
      onPress={() => onPageChange(currentPage - 1)}
      disabled={currentPage === 0 || !isConnected}
    >
      <Icon name="chevron-left" size={20} color={currentPage === 0 || !isConnected ? '#9CA3AF' : Color.primary} />
    </TouchableOpacity>

    <View style={styles.pageInfo}>
      <Text style={styles.pageText}>
        Page {currentPage + 1} of {Math.max(totalPages, 1)}
      </Text>
      <Text style={styles.pageSizeText}>
        Showing {pageSize} of {totalElements} yards
      </Text>
      {!isConnected && (
        <Text style={styles.offlineText}>Offline Mode</Text>
      )}
    </View>

    <TouchableOpacity
      style={[styles.pageButton, (currentPage >= (totalPages - 1) || !isConnected) && styles.pageButtonDisabled]}
      onPress={() => onPageChange(currentPage + 1)}
      disabled={currentPage >= (totalPages - 1) || !isConnected}
    >
      <Icon name="chevron-right" size={20} color={currentPage >= (totalPages - 1) || !isConnected ? '#9CA3AF' : Color.primary} />
    </TouchableOpacity>
  </Animated.View>
);

// --- Loading Overlay with Livestock Theme ---
const LoadingOverlay = ({ isConnected }: { isConnected: boolean | null }) => (
  <View style={styles.loadingOverlay}>
    <View style={styles.loadingContent}>
      {/* Livestock-themed icon */}
      <View style={styles.livestockIconContainer}>
        <Icon name="pets" size={48} color={Color.primary} />
        <View style={styles.iconPulse} />
      </View>
      <Text style={styles.loadingText}>Loading Livestock Data</Text>
      <Text style={styles.loadingSubtext}>
        {isConnected === false ? 'Offline - loading cached data' : 'Preparing your livestock overview...'}
      </Text>
      <ActivityIndicator size="large" color={Color.primary} style={styles.loadingSpinner} />
    </View>
  </View>
);

export default function LivestockScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { kpis, yards, totalPages, currentPage, totalElements, pageSize } = useAppSelector((state)=>state.livestock);

  const [selectedStatus,setSelectedStatus] = useState('ALL');
  const [isInitialLoad,setIsInitialLoad] = useState(true);
  const [isRefreshing,setIsRefreshing] = useState(false);
  const [isConnected,setIsConnected] = useState<boolean | null>(null);
  const [syncStatus,setSyncStatus] = useState<'idle'|'syncing'|'success'|'error'>('idle');
  const [localCurrentPage, setLocalCurrentPage] = useState(0);
  const [pageSizeLocal] = useState(9);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(true);

  // Animations
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [cardAnimations] = useState(Array(pageSizeLocal).fill(0).map(()=>new Animated.Value(0)));
  const [kpiAnim] = useState(new Animated.Value(0));

  // Network Detection
  useEffect(()=>{
    const unsubscribe = NetInfo.addEventListener(state=>{
      const connected = state.isConnected ?? false;
      setIsConnected(connected);
      if(connected && isConnected===false && (kpis||yards.length>0)) handleBackgroundSync();
    });
    return ()=>unsubscribe();
  },[isConnected,kpis,yards]);

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
            console.log("🌐 Online - fetching livestock data...");
            await Promise.all([
              dispatch(fetchLivestockKPIs()),
              dispatch(fetchLivestockYards({ page: 0, size: pageSizeLocal }))
            ]);
          } else {
            console.log("📴 Offline - loading cached livestock data...");
            await Promise.all([
              dispatch(loadCachedLivestockKPIs()),
              dispatch(loadCachedLivestockYards())
            ]);
          }

          if (isActive) {
            setIsInitialLoad(false);
            // Start reveal animations after data is loaded
            startEntranceAnimations();
            
            // Hide loading overlay after animations start
            setTimeout(() => {
              setShowLoadingOverlay(false);
            }, 600);
          }
        } catch (error) {
          console.log("❌ Error loading livestock data:", error);
          if (isActive) {
            // fallback to cache if fetch fails
            await Promise.all([
              dispatch(loadCachedLivestockKPIs()),
              dispatch(loadCachedLivestockYards())
            ]);
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
  const handleBackgroundSync = async ()=>{
    if(!isConnected) return;
    try{
      setSyncStatus('syncing');
      console.log('🔄 Starting background sync...');
      
      await Promise.all([
        dispatch(fetchLivestockKPIs()),
        dispatch(fetchLivestockYards({ page: localCurrentPage, size: pageSizeLocal }))
      ]);
      
      setSyncStatus('success');
      console.log('✅ Background sync completed');
      
      setTimeout(()=>setSyncStatus('idle'),3000);
    }catch(error){
      console.log('❌ Background sync failed:', error);
      setSyncStatus('error');
      setTimeout(()=>setSyncStatus('idle'),3000);
    }
  };

  // Manual refresh function
  const handleRefresh = async ()=>{
    if(!isConnected) return;
    setIsRefreshing(true);
    try{
      await Promise.all([
        dispatch(fetchLivestockKPIs()),
        dispatch(fetchLivestockYards({ page: localCurrentPage, size: pageSizeLocal }))
      ]);
      // Restart animations after refresh
      startEntranceAnimations();
    }catch(error){
      console.log('Refresh failed:', error);
    }finally{
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
      await dispatch(fetchLivestockYards({ page, size: pageSizeLocal }));
      setLocalCurrentPage(page);
      
      // Start animations and then hide loading overlay
      startEntranceAnimations();
      setTimeout(() => {
        setShowLoadingOverlay(false);
      }, 600);
    } catch (error) {
      console.log('❌ Page change failed:', error);
      setShowLoadingOverlay(false);
    }
  };

  // Sync local page state with Redux state
  useEffect(() => {
    console.log(`🔄 Syncing local page state: Redux currentPage = ${currentPage}`);
    setLocalCurrentPage(currentPage);
  }, [currentPage]);

  // Start reveal animations when we have data
  const startEntranceAnimations = () => {
    console.log('🎬 Starting livestock dashboard reveal animations...');

    // Reset animations first
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.8);
    kpiAnim.setValue(0);
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

    // KPI animations
    Animated.timing(kpiAnim, {
      toValue: 1,
      duration: 600,
      delay: 200,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: true,
    }).start();

    // Staggered card animations
    cardAnimations.forEach((anim, index) => {
      if (index < Math.min(yards.length, pageSizeLocal)) {
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

  useEffect(()=>{
    if(!isInitialLoad && (kpis||yards.length>0) && !showLoadingOverlay){
      startEntranceAnimations();
    }
  },[isInitialLoad,kpis,yards, showLoadingOverlay]);

  const getCardTransform = (anim: Animated.Value) => ({
    transform: [
      { scale: anim.interpolate({ inputRange: [0,1], outputRange: [0.7,1] }) },
      { translateY: anim.interpolate({ inputRange: [0,1], outputRange: [50,0] }) }
    ],
    opacity: anim
  });

  const getHeaderTransform = () => ({ 
    transform: [{ 
      scale: scaleAnim.interpolate({ inputRange:[0,1], outputRange:[0.8,1] }) 
    }] 
  });

  const getKPITransform = () => ({ 
    transform:[
      {scale:kpiAnim.interpolate({inputRange:[0,1],outputRange:[0.8,1]})},
      {translateY:kpiAnim.interpolate({inputRange:[0,1],outputRange:[30,0]})}
    ], 
    opacity:kpiAnim 
  });

  const filteredYards = yards.filter(yard=>{
    const status = yard.status==='MAINTENANCE'?'MAINTENANCE':
      yard.deckCount===0?'FULL':
      yard.decksAvailable===yard.deckCount?'AVAILABLE':
      yard.decksAvailable===0?'FULL':'PARTIAL';
    return selectedStatus==='ALL'||selectedStatus===status;
  });

  const renderKPIStats = ()=>{
    if(!kpis) return null;
    const totalAnimals = Object.values(kpis.herdTypeCounts).reduce((a:any,b:any)=>a+b,0);
    const capacityUsage = kpis.capacity.totalCapacityActiveYards > 0 
      ? Math.round((kpis.capacity.occupiedCapacity/kpis.capacity.totalCapacityActiveYards)*100)
      : 0;
      
    return (
      <Animated.View style={[styles.kpiContainer,getKPITransform()]}>
        <Text style={styles.sectionTitle}>Livestock Overview</Text>
        <View style={styles.kpiGrid}>
          <KPICard title="Total Animals" value={totalAnimals} subtitle="Across all yards" color={Color.primary} />
          <KPICard title="Available Decks" value={kpis.decks.decksAvailable} subtitle={`of ${kpis.decks.totalDecks}`} color="#10B981" />
          <KPICard title="Capacity Used" value={`${capacityUsage}%`} subtitle={`${kpis.capacity.occupiedCapacity} of ${kpis.capacity.totalCapacityActiveYards}`} color="#F59E0B" />
        </View>
        <HerdTypeGrid herdTypeCounts={kpis.herdTypeCounts} fadeAnim={fadeAnim} />
        {kpis.alerts && kpis.alerts.length>0 && <Alerts alerts={kpis.alerts} fadeAnim={fadeAnim} />}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Loading Overlay with Livestock Theme */}
      {showLoadingOverlay && (
        <LoadingOverlay isConnected={isConnected} />
      )}

      {/* Header */}
      <Animated.View style={[styles.header,getHeaderTransform()]}>
        <TouchableOpacity onPress={()=>navigation.navigate('Home' as never)} style={styles.headerButton}>
          <Icon name="menu" color={'#fff'} size={24} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Livestock Management</Text>
          <View style={styles.headerUnderline}/>
        </View>
        <TouchableOpacity onPress={()=>navigation.goBack()} style={styles.headerButton}>
          <Icon name="arrow-back" color={'#fff'} size={24} />
        </TouchableOpacity>
      </Animated.View>

      {/* Main Content */}
      <View style={styles.listContainer}>
        <FlatList
          data={filteredYards}
          keyExtractor={item=>item.id.toString()}
          renderItem={({item,index})=><YardCard yard={item} animationStyle={getCardTransform(cardAnimations[index]||new Animated.Value(1))} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={isRefreshing} 
              onRefresh={handleRefresh} 
              colors={[Color.primary]} 
              tintColor={Color.primary} 
              enabled={isConnected===true} 
            />
          }
          ListHeaderComponent={
            <>
              {/* <NetworkStatus isConnected={isConnected} syncStatus={syncStatus} /> */}
              {renderKPIStats()}
              <FilterTabs 
                selectedStatus={selectedStatus} 
                setSelectedStatus={setSelectedStatus} 
                fadeAnim={fadeAnim} 
              />
              <Text style={styles.sectionTitle}>
                All Yards ({filteredYards.length})
              </Text>
            </>
          }
          ListEmptyComponent={<EmptyList isInitialLoad={isInitialLoad} isConnected={isConnected} />}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Pagination - Only show if there are multiple pages */}
      {totalPages > 1 && (
        <Pagination 
          currentPage={localCurrentPage}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={filteredYards.length}
          isConnected={isConnected}
          onPageChange={handlePageChange}
          fadeAnim={fadeAnim}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:'#F9FAFB'},
  // Loading Overlay Styles
  loadingOverlay:{
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
  livestockIconContainer: {
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
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16,backgroundColor:Color.primary},
  headerButton:{padding:8,borderRadius:12,backgroundColor:'rgba(255,255,255,0.1)'},
  headerTitleContainer:{alignItems:'center',flex:1},
  headerTitle:{color:'#fff',fontSize:20,fontWeight:'bold',letterSpacing:0.5},
  headerUnderline:{height:2,width:width*0.3,backgroundColor:'#86EFAC',marginTop:4,borderRadius:1},
  listContainer:{flex:1},
  listContent:{paddingBottom:16},
  kpiContainer:{marginTop:16,paddingHorizontal:16},
  sectionTitle:{fontSize:16,fontWeight:'bold',marginBottom:8,color:'#111827', marginTop: 8},
  kpiGrid:{flexDirection:'row',justifyContent:'space-between'},
  kpiCard:{flex:1,backgroundColor:'#fff',marginHorizontal:4,padding:12,borderRadius:8,shadowColor:'#000',shadowOpacity:0.05,shadowRadius:5,shadowOffset:{width:0,height:2},elevation:2},
  kpiValue:{fontSize:20,fontWeight:'bold'},
  kpiTitle:{fontSize:12,color:'#6B7280',marginTop:2},
  kpiSubtitle:{fontSize:10,color:'#9CA3AF'},
  herdTypeContainer:{marginTop:16},
  herdTypeTitle:{fontSize:14,fontWeight:'bold',marginBottom:8,color:'#111827'},
  herdTypeGrid:{flexDirection:'row',flexWrap:'wrap'},
  herdTypeItem:{width:'25%',alignItems:'center',marginBottom:12},
  herdTypeCount:{fontSize:16,fontWeight:'bold',color:'#111827'},
  herdTypeLabel:{fontSize:12,color:'#6B7280'},
  alertsTitle:{fontSize:14,fontWeight:'bold',marginBottom:4,color:'#111827'},
  alertItem:{flexDirection:'row',alignItems:'center',padding:8,borderLeftWidth:4,borderRadius:4,marginVertical:2},
  alertText:{marginLeft:4,color:'#374151',fontSize:12},
  // Updated Filter Container without Scroll
  filterContainer: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    paddingVertical: 8,
    paddingHorizontal: 12, // Reduced horizontal padding
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginTop: 8,
  },
  filterContentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Evenly distribute space
    alignItems: 'center',
  },
  filterTab: {
    paddingHorizontal: 10, // Reduced horizontal padding
    paddingVertical: 8,    // Reduced vertical padding
    borderRadius: 16,      // Slightly smaller border radius
    alignItems: 'center',
    position: 'relative',
    flex: 1,              // Equal flex distribution
    marginHorizontal: 2,   // Reduced margin between tabs
  },
  filterTabActive: {
    backgroundColor: '#F0F9FF',
  },
  filterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,               // Reduced gap between dot and text
    justifyContent: 'center',
  },
  filterText: {
    fontSize: 11,         // Font size 11 as requested
    color: '#6B7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: Color.primary,
    fontWeight: '600',
  },
  filterIndicator: {
    position: 'absolute',
    bottom: 2,            // Adjusted position
    width: 16,            // Smaller indicator
    height: 2,
    backgroundColor: Color.primary,
    borderRadius: 2,
  },
  networkStatus:{flexDirection:'row',alignItems:'center',justifyContent:'center',paddingVertical:8,paddingHorizontal:16,backgroundColor:'#F0F9FF',marginHorizontal:16,marginTop:8,borderRadius:8,borderWidth:1,borderColor:'#E0F2FE'},
  networkStatusOffline:{backgroundColor:'#FEF2F2',borderColor:'#FECACA'},
  networkStatusSyncing:{backgroundColor:'#EFF6FF',borderColor:'#DBEAFE'},
  networkText:{fontSize:12,fontWeight:'500',marginLeft:6},
  syncIcon:{marginLeft:4},
  emptyContainer:{alignItems:'center',paddingVertical:60,paddingHorizontal:20},
  emptyText:{fontSize:18,color:'#6B7280',marginTop:16,marginBottom:8,fontWeight:'600'},
  emptySubtext:{fontSize:14,color:'#9CA3AF',textAlign:'center',lineHeight:20},
  pagination:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:16,backgroundColor:'#fff',borderTopWidth:1,borderTopColor:'#E5E7EB'},
  pageInfo:{alignItems:'center'},
  pageButton:{padding:8,borderRadius:6},
  pageButtonDisabled:{opacity:0.5},
  pageText:{fontSize:14,color:'#6B7280',fontWeight:'600'},
  pageSizeText:{fontSize:12,color:'#9CA3AF',marginTop:2},
  offlineText:{fontSize:10,color:'#EF4444',marginTop:2,fontWeight:'500'},
  yardCard:{backgroundColor:'#fff',marginHorizontal:16,marginVertical:8,padding:12,borderRadius:8,shadowColor:'#000',shadowOpacity:0.05,shadowRadius:5,shadowOffset:{width:0,height:2},elevation:2},
  yardHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  yardCode:{fontSize:12,color:'#6B7280'},
  yardName:{fontSize:14,fontWeight:'bold',color:'#111827'},
  statusBadge:{paddingHorizontal:8,paddingVertical:2,borderRadius:12},
  statusContent:{flexDirection:'row',alignItems:'center'},
  statusText:{marginLeft:4,fontSize:12,color:'#fff',fontWeight:'600',textTransform:'uppercase'},
  locationContainer:{flexDirection:'row',alignItems:'center',marginTop:4},
  locationText:{marginLeft:2,color:'#6B7280',fontSize:12},
  statsContainer:{flexDirection:'row',justifyContent:'space-between',marginTop:8},
  statItem:{alignItems:'center'},
  statLabel:{fontSize:10,color:'#6B7280'},
  statValue:{fontSize:12,fontWeight:'bold',color:'#111827'},
  capacityContainer:{marginTop:8},
  capacityHeader:{flexDirection:'row',justifyContent:'space-between'},
  capacityLabel:{fontSize:10,color:'#6B7280'},
  capacityPercentage:{fontSize:10,fontWeight:'bold',color:'#111827'},
  capacityBar:{height:6,backgroundColor:'#E5E7EB',borderRadius:3,marginTop:2},
  capacityFill:{height:6,backgroundColor:Color.primary,borderRadius:3},
  actionsContainer:{flexDirection:'row',justifyContent:'space-between',marginTop:8},
  actionButton:{flexDirection:'row',alignItems:'center',padding:6,backgroundColor:Color.primary,borderRadius:6},
  transferButton:{backgroundColor:'#F59E0B'},
  actionText:{color:'#fff',fontSize:12,marginLeft:4,fontWeight:'600'},
});