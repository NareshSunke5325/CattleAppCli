import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface YardCardProps {
  name: string;
  code: string;
  capacity: number;
  occupied: number;
  revenue: number;
  onPress?: () => void;
}

const YardCard: React.FC<YardCardProps> = ({
  name,
  code,
  capacity,
  occupied,
  revenue,
  onPress,
}) => {
  const utilizationPercentage = Math.round((occupied / capacity) * 100);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.yardInfo}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.code}>{code}</Text>
        </View>
        <Icon name="chevron-right" size={20} color="#ccc" />
      </View>
      
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Capacity</Text>
          <Text style={styles.statValue}>{capacity}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Occupied</Text>
          <Text style={styles.statValue}>{occupied}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Revenue</Text>
          <Text style={styles.statValue}>AUD {revenue}</Text>
        </View>
      </View>

      <View style={styles.utilizationContainer}>
        <Text style={styles.utilizationLabel}>Utilization</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progress, { width: `${utilizationPercentage}%` }]} />
        </View>
        <Text style={styles.utilizationPercentage}>{utilizationPercentage}%</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  yardInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  code: {
    fontSize: 14,
    color: '#666',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  utilizationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  utilizationLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
    width: 60,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: '#FF9800',
  },
  utilizationPercentage: {
    fontSize: 12,
    color: '#666',
    width: 30,
    textAlign: 'right',
  },
});

export default YardCard;