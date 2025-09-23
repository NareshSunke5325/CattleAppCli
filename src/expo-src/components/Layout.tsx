import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSidebar } from '../hooks/useSidebar';
import Sidebar from './Sidebar';
import SidebarToggle from './SidebarToggle';

interface LayoutProps {
  children: React.ReactNode;
  showSidebarToggle?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showSidebarToggle = true }) => {
  const { isVisible, openSidebar, closeSidebar } = useSidebar();

  return (
    <View style={styles.container}>
      {children}
      
      {showSidebarToggle && (
        <View style={styles.toggleContainer}>
          <SidebarToggle onPress={openSidebar} />
        </View>
      )}
      
      <Sidebar isVisible={isVisible} onClose={closeSidebar} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toggleContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 999,
  },
});

export default Layout;