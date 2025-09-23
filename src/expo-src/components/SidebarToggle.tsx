import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface SidebarToggleProps {
  onPress: () => void;
  style?: any;
}

const SidebarToggle: React.FC<SidebarToggleProps> = ({ onPress, style }) => {
  return (
    <TouchableOpacity
      style={[styles.toggleButton, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Icon name="menu" size={24} color="#333" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  toggleButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
});

export default SidebarToggle;