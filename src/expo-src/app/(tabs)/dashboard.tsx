import { fetchDashboard } from '@/store/slices/dashBoardSlice';
import { AppDispatch, RootState } from '@/store/store';
import { Activity, ChartBar as BarChart3, Bell, Chrome as Home, Menu, RefreshCw, TrendingUp, Users } from 'lucide-react-native';
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  percentage?: string;
}

function StatCard({ title, value, subtitle, icon, color, percentage }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
          {icon}
        </View>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <View style={styles.statFooter}>
        <Text style={styles.statSubtitle}>{subtitle}</Text>
        {percentage && (
          <Text style={[styles.statPercentage, { color }]}>{percentage}</Text>
        )}
      </View>
    </View>
  );
}

interface ProgressBarProps {
  label: string;
  value: number;
  total: number;
  color: string;
  percentage: string;
}

function ProgressBar({ label, value, total, color, percentage }: ProgressBarProps) {
  const progress = (value / total) * 100;
  
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{value} • {percentage}</Text>
      </View>
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${progress}%`, backgroundColor: color }
          ]} 
        />
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error } = useSelector((state: RootState) => state.dashboard);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = () => {
    dispatch(fetchDashboard());
  };

  if (loading && !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
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

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadDashboard} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Main Stats */}
        <View style={styles.mainStatsContainer}>
          <StatCard
            title="Total Capacity (Active Yards)"
            value="600"
            subtitle="Active Yards"
            icon={<Home size={20} color="#10B981" />}
            color="#10B981"
          />
          <StatCard
            title="5"
            value="5"
            subtitle="Occupied"
            icon={<Users size={20} color="#3B82F6" />}
            color="#3B82F6"
            percentage="6%"
          />
        </View>

        {/* Deck Information */}
        <View style={styles.deckContainer}>
          <View style={styles.deckHeader}>
            <Activity size={20} color="#3B82F6" />
            <Text style={styles.deckTitle}>Decks</Text>
            <Text style={styles.deckTotal}>Total 21</Text>
          </View>
          <Text style={styles.deckSubtitle}>9 occupied • 12 available</Text>
          
          <View style={styles.utilizationContainer}>
            <Text style={styles.utilizationLabel}>Utilization</Text>
            <Text style={styles.utilizationPercentage}>43%</Text>
          </View>
          <View style={styles.utilizationBar}>
            <View style={[styles.utilizationFill, { width: '43%' }]} />
          </View>
        </View>

        {/* Herd Types */}
        <View style={styles.herdContainer}>
          <View style={styles.herdHeader}>
            <Text style={styles.herdTitle}>Herd Types</Text>
            <BarChart3 size={20} color="#6B7280" />
          </View>
          
          <ProgressBar
            label="COWS"
            value={2}
            total={5}
            color="#10B981"
            percentage="40%"
          />
          <ProgressBar
            label="CALVES"
            value={1}
            total={5}
            color="#3B82F6"
            percentage="20%"
          />
          <ProgressBar
            label="BULLS"
            value={1}
            total={5}
            color="#8B5CF6"
            percentage="20%"
          />
          <ProgressBar
            label="MIXED"
            value={1}
            total={5}
            color="#F59E0B"
            percentage="20%"
          />
        </View>

        {/* Revenue by Yard */}
        <View style={styles.revenueContainer}>
          <View style={styles.revenueHeader}>
            <Text style={styles.revenueTitle}>Revenue by Yard</Text>
            <TrendingUp size={20} color="#6B7280" />
          </View>
          
          <View style={styles.revenueItem}>
            <Text style={styles.revenueYard}>North Yard</Text>
            <Text style={styles.revenueAmount}>AUD 150</Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error loading dashboard: {error}</Text>
            <TouchableOpacity onPress={loadDashboard} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 20,
  },
  mainStatsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statTitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  statPercentage: {
    fontSize: 12,
    fontWeight: '600',
  },
  deckContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  deckHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deckTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
    flex: 1,
  },
  deckTotal: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  deckSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  utilizationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  utilizationLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  utilizationPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  utilizationBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  utilizationFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  herdContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  herdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  herdTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  progressValue: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  revenueContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  revenueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  revenueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revenueYard: {
    fontSize: 14,
    color: '#6B7280',
  },
  revenueAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
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