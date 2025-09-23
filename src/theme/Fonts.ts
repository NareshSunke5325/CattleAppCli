import Metrics from "./Metrics"
import { Platform } from 'react-native';

const size = {
    font6: Metrics.screenWidth * ( 6 / 365 ),
    font8: Metrics.screenWidth * ( 8 / 365 ),
    font10: Metrics.screenWidth * ( 10 / 365 ),
    font12: Metrics.screenWidth * ( 12 / 365 ),
    font14: Metrics.screenWidth * ( 14 / 365 ),
    font16: Metrics.screenWidth * ( 16 / 365 ),
    font20: Metrics.screenWidth * ( 20 / 365 ),
}
const weight = {
    full: '900',
    semi: '600',
    low: '400',
    bold: 'bold',
    normal: 'normal'
}

const type = {
    regular: Platform.OS == 'ios' ? 'BrandonText' :'HVD Fonts - BrandonText-Regular',
    semiBold: Platform.OS == 'ios' ? 'BrandonText-Medium' :'HVD Fonts - BrandonText-Medium',
    bold: Platform.OS == 'ios' ? 'BrandonText-Bold' :'HVD Fonts - BrandonText-Bold',
    light: Platform.OS == 'ios' ? 'BrandonText-Light' :'HVD Fonts - BrandonText-Light'
}

export default {
    size,
    weight,
    type
}