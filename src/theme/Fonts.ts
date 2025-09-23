import { Platform } from 'react-native';
import Metrics from './Metrics';

const size = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

const weight = {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
};

const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};

export default {
  size,
  weight,
  lineHeight,
};