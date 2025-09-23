import { StyleSheet } from 'react-native';
import Color from './Color';
import Metrics from './Metrics';

export const GlobalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.bgColor,
  },
  
  card: {
    backgroundColor: Color.cardBg,
    borderRadius: Metrics.borderRadius.lg,
    padding: Metrics.spacing.md,
    shadowColor: Color.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  header: {
    backgroundColor: Color.primary,
    paddingHorizontal: Metrics.spacing.md,
    paddingVertical: Metrics.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: Metrics.headerHeight,
  },
  
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Color.white,
  },
  
  button: {
    backgroundColor: Color.primary,
    borderRadius: Metrics.borderRadius.md,
    paddingVertical: Metrics.spacing.md,
    paddingHorizontal: Metrics.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    height: Metrics.buttonHeight,
  },
  
  buttonText: {
    color: Color.white,
    fontSize: 16,
    fontWeight: '600',
  },
  
  input: {
    backgroundColor: Color.white,
    borderRadius: Metrics.borderRadius.md,
    borderWidth: 1,
    borderColor: Color.lightGray,
    paddingHorizontal: Metrics.spacing.md,
    height: Metrics.inputHeight,
    fontSize: 16,
    color: Color.textPrimary,
  },
  
  inputFocused: {
    borderColor: Color.primary,
    shadowColor: Color.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  
  textPrimary: {
    color: Color.textPrimary,
    fontSize: 16,
  },
  
  textSecondary: {
    color: Color.textSecondary,
    fontSize: 14,
  },
  
  textLight: {
    color: Color.textLight,
    fontSize: 12,
  },
  
  shadow: {
    shadowColor: Color.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default GlobalStyles;