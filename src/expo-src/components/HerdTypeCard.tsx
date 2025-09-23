import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface HerdTypeCardProps {
  type: string;
  count: number;
  percentage: number;
}

const HerdTypeCard: React.FC<HerdTypeCardProps> = ({ type, count, percentage }) => {
  const getIconName = (type: string) => {
    switch (type.toLowerCase()) {
      case 'cows':
        return 'pets';
      case 'calves':
        return 'child-care';
      case 'bulls':
        return 'agriculture';
      case 'mixed':
        return 'group';
      default:
        return 'pets';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Icon name={getIconName(type)} size={20} color="#4CAF50" />
        <Text style={styles.type}>{type}</Text>
      </View>
      <View style={styles.stats}>
        <Text style={styles.count}>{count}</Text>
        <Text style={styles.percentage}>{percentage}%</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progress, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
    alignItems: 'center',
    marginBottom: 8,
  },
  type: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  count: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  percentage: {
    fontSize: 14,
    color: '#666',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
});

export default HerdTypeCard;