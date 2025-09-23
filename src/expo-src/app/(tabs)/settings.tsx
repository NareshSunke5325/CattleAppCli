import { logout } from '@/store/slices/authSlice';
import { RootState } from '@/store/store';
import { useRouter } from 'expo-router';
import { Bell, ChevronRight, CircleHelp as HelpCircle, Info, LogOut, Settings as SettingsIcon, Shield, User } from 'lucide-react-native';
import React from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
}

function SettingItem({ icon, title, subtitle, onPress, showArrow = true }: SettingItemProps) {
  return (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingIcon}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && (
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        )}
      </View>
      {showArrow && (
        <ChevronRight size={20} color="#CCC" />
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const dispatch = useDispatch();
  const router = useRouter();
  const auth = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            dispatch(logout());
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  const showNotImplemented = () => {
    Alert.alert('Feature Not Available', 'This feature will be available in a future update.');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <User size={32} color="#2E8B57" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>Farm Manager</Text>
            <Text style={styles.userEmail}>manager@cattleyard.com</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <SettingItem
          icon={<User size={20} color="#2E8B57" />}
          title="Profile Settings"
          subtitle="Update your personal information"
          onPress={showNotImplemented}
        />
        
        <SettingItem
          icon={<Bell size={20} color="#3498DB" />}
          title="Notifications"
          subtitle="Manage your notification preferences"
          onPress={showNotImplemented}
        />
        
        <SettingItem
          icon={<Shield size={20} color="#F39C12" />}
          title="Privacy & Security"
          subtitle="Password and security settings"
          onPress={showNotImplemented}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        
        <SettingItem
          icon={<SettingsIcon size={20} color="#9B59B6" />}
          title="General Settings"
          subtitle="Language, theme, and preferences"
          onPress={showNotImplemented}
        />
        
        <SettingItem
          icon={<HelpCircle size={20} color="#1ABC9C" />}
          title="Help & Support"
          subtitle="Get help and contact support"
          onPress={showNotImplemented}
        />
        
        <SettingItem
          icon={<Info size={20} color="#34495E" />}
          title="About"
          subtitle="App version and information"
          onPress={() => Alert.alert('About', 'Cattle Yard Manager v1.0\nBuilt for efficient livestock management')}
        />
      </View>

      <View style={styles.section}>
        <SettingItem
          icon={<LogOut size={20} color="#E74C3C" />}
          title="Logout"
          subtitle="Sign out of your account"
          onPress={handleLogout}
          showArrow={false}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Cattle Yard Manager</Text>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#2E8B57',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#E8F5E8',
  },
  section: {
    backgroundColor: '#FFF',
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 20,
    paddingVertical: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingIcon: {
    width: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
});