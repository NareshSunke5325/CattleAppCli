import { StyleProp, ViewStyle } from 'react-native';
export type ModalProps = {
    headerTitle: string,
    visible?: boolean,
    onDismiss?: () => void,
    containerStyle?: StyleProp<ViewStyle> | any,
    children?: JSX.Element,
    onRequestClose?: () => void,
    backdropStyle?: StyleProp<ViewStyle> | any,
    onBackdropPress?: () => void
}