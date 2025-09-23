import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAppDispatch, useAppSelector } from '../store/store';
import { fetchLivestock } from '../store/slices/livestockSlice';
import { Color } from '../theme';

export default function LivestockScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { livestock, loading, error } = useAppSelector((state) => state.livestock);

  useEffect(() => {
    dispatch(fetchLivestock());
  }, []);

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
          <Text style={styles.headerTitle}>Livestock Management</Text>
          <View style={styles.headerUnderline} />
        </View>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Color.primary} />
            <Text style={styles.loadingText}>Loading livestock...</Text>
          </View>
        ) : (
          <View style={styles.comingSoonContainer}>
            <Icon name="pets" size={64} color="#D1D5DB" />
            <Text style={styles.comingSoonTitle}>Livestock Management</Text>
            <Text style={styles.comingSoonText}>
              This feature is coming soon. You'll be able to manage your livestock inventory,
              track animal health, and monitor feeding schedules.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.bgColor,
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
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Color.textSecondary,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Color.textPrimary,
    marginTop: 16,
    marginBottom: 12,
  },
  comingSoonText: {
    fontSize: 16,
    color: Color.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
});