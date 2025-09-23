import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAppDispatch, useAppSelector } from '../store/store';
import { fetchYards } from '../store/slices/yardsSlice';
import { Color } from '../theme';

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
}

function YardCard({ yard }: YardCardProps) {
  const occupancyRate = yard.deckCount > 0 ? (yard.decksOccupied / yard.deckCount) * 100 : 0;
  const isAvailable = yard.status === 'ACTIVE' && yard.decksAvailable > 0;

  const getStatusColor = () => {
    switch (yard.status) {
      case 'ACTIVE':
        return isAvailable ? Color.yardActive : Color.yardPartial;
      case 'MAINTENANCE':
        return Color.yardMaintenance;
      default:
        return Color.yardFull;
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
        <TouchableOpacity style={styles.bookButton}>
          <Text style={styles.bookButtonText}>Book Deck</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function YardsScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { yards, loading, error } = useAppSelector((state) => state.yards);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredYards = yards.filter((yard) => {
    const matchesSearch =
      yard.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      yard.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      yard.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const renderYardCard = ({ item }: { item: any }) => <YardCard yard={item} />;

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="location-on" size={48} color="#D1D5DB" />
      <Text style={styles.emptyText}>No yards found</Text>
      <Text style={styles.emptySubtext}>Try adjusting your search</Text>
    </View>
  );

  if (loading && yards.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Color.primary} />
        <Text style={styles.loadingText}>Loading yards...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
          <Text style={styles.headerTitle}>Cattle Yards</Text>
          <View style={styles.headerUnderline} />
        </View>
        <View style={styles.headerButton} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search yards..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <FlatList
        data={filteredYards}
        renderItem={renderYardCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.bgColor,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Color.bgColor,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Color.textSecondary,
  },
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Color.textPrimary,
  },
  listContainer: {
    padding: 16,
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
    color: Color.textPrimary,
    marginBottom: 2,
  },
  yardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.textPrimary,
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
    color: Color.textSecondary,
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
    color: Color.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Color.textPrimary,
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
    color: Color.textSecondary,
  },
  capacityPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: Color.textPrimary,
  },
  occupancyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  occupancyText: {
    fontSize: 14,
    color: Color.textSecondary,
  },
  bookButton: {
    backgroundColor: Color.success,
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
    color: Color.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Color.textLight,
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
    color: Color.error,
    fontSize: 14,
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: Color.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});