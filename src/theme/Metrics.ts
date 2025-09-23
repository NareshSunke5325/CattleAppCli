import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const Metrics = {
  screenWidth: width < height ? width : height,
  screenHeight: width < height ? height : width,
  
  // Spacing system (8px base)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Border radius
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
  },
  
  // Common dimensions
  headerHeight: 60,
  tabBarHeight: 60,
  buttonHeight: 48,
  inputHeight: 56,
};

export default Metrics;