import { fetchYards } from '@/store/slices/yardsSlices';
import { AppDispatch, RootState } from '@/store/store';
import { Activity, Bell, ChevronDown, Chrome as Home, MapPin, Menu, RefreshCw, Search, Users } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

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
    createdAt: string;
    updatedAt: string;
  };
}

function YardCard({ yard }: YardCardProps) {
  const occupancyRate = yard.deckCount > 0 ? (yard.decksOccupied / yard.deckCount) * 100 : 0;
  const isAvailable = yard.status === 'ACTIVE' && yard.decksAvailable > 0;
  
  const getStatusColor = () => {
    switch (yard.status) {
      case 'ACTIVE':
        return isAvailable ? '#10B981' : '#F59E0B';
      case 'MAINTENANCE':
        return '#6B7280';
      default:
        return '#EF4444';
    }
  };

  const getStatusText = () => {
    if (yard.status === 'ACTIVE') {
      return isAvailable ? 'AVAILABLE' : 'PARTIAL';
    }
    return yard.status;
  };

  return (
    <View style={[styles.yardCard, { backgroundColor: isAvailable ? '#F0FDF4' : '#FFFFFF' }]}>
      <View style={styles.yardHeader}>
        <View style={styles.yardInfo}>
          <Text style={styles.yardCode}>{yard.code}</Text>
          <Text style={styles.yardName}>{yard.name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      <View style={styles.locationContainer}>
        <MapPin size={14} color="#6B7280" />
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
          <Users size={16} color="#6B7280" />
          <Text style={styles.occupancyText}>
            {yard.decksOccupied} occupied / {yard.deckCount}
          </Text>
        </View>
      </View>

      {isAvailable && (
        <TouchableOpacity style={styles.bookButton}>
          <Text style={styles.bookButtonText}>Book</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function YardsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { yards, loading, error } = useSelector((state: RootState) => state.yards);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [sortFilter, setSortFilter] = useState('Sort: Availability (High → Low)');

  useEffect(() => {
    loadYards();
  }, []);

  const loadYards = async (page = 0) => {
    try {
      await dispatch(fetchYards({ page, size: 9 })).unwrap();
    } catch (error) {
      Alert.alert('Error', 'Failed to load yards');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadYards(0);
    setRefreshing(false);
  };

  const filteredYards = yards.filter(yard => {
    const matchesSearch = yard.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         yard.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         yard.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'All statuses') return matchesSearch;
    
    const status = yard.status === 'ACTIVE' && yard.decksAvailable > 0 ? 'Available' :
                  yard.status === 'ACTIVE' && yard.decksAvailable === 0 ? 'Partial' :
                  yard.status;
    
    return matchesSearch && status.toLowerCase() === statusFilter.toLowerCase();
  });

  const renderYardCard = ({ item }: { item: any }) => (
    <YardCard yard={item} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MapPin size={48} color="#D1D5DB" />
      <Text style={styles.emptyText}>No yards found</Text>
      <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
    </View>
  );

  if (loading && yards.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading yards...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Home size={24} color="#10B981" />
          </View>
          <TouchableOpacity style={styles.refreshButton}>
            <RefreshCw size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton}>
            <Menu size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search yards..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>{statusFilter}</Text>
          <ChevronDown size={16} color="#6B7280" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>{sortFilter}</Text>
          <ChevronDown size={16} color="#6B7280" />
        </TouchableOpacity>

        {/* Status Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>Partial</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Full</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#6B7280' }]} />
            <Text style={styles.legendText}>Maintenance</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summaryContainer}>
          <Activity size={16} color="#6B7280" />
          <Text style={styles.summaryText}>1 Deck • 30 Cattle</Text>
        </View>
      </View>

      <FlatList
        data={filteredYards}
        renderItem={renderYardCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmpty}
      />

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity onPress={() => loadYards()} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    padding: 8,
  },
  menuButton: {
    padding: 8,
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  filterText: {
    fontSize: 14,
    color: '#374151',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 32,
  },
  yardCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  errorContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});