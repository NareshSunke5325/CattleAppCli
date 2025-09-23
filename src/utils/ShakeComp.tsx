import * as React from "react";
import { Text, Animated, View } from "react-native";

const ANIMATION_VALUE = 10;
const ANIMATION_DURATION = 100;

interface IProps {
  style?: any;
  duration?: number;
  animationValue?: number;
  ViewComponent?: any;
  children?:any
}

interface IState {}

export default class ShakeComp extends React.Component<IProps, IState> {
  shakeAnimation: Animated.Value;

  constructor(props: IProps) {
    super(props);
    this.shakeAnimation = new Animated.Value(0);
    this.state = {};
  }

  startShakeAnimation = () => {
    const {
      duration = ANIMATION_DURATION,
      animationValue = ANIMATION_VALUE,
    } = this.props;
    Animated.sequence([
      Animated.timing(this.shakeAnimation, {
        toValue: animationValue,
        duration: duration,
        useNativeDriver: true,
      }),
      Animated.timing(this.shakeAnimation, {
        toValue: -animationValue,
        duration: duration,
        useNativeDriver: true,
      }),
      Animated.timing(this.shakeAnimation, {
        toValue: animationValue,
        duration: duration,
        useNativeDriver: true,
      }),
      Animated.timing(this.shakeAnimation, {
        toValue: 0,
        duration: duration,
        useNativeDriver: true,
      }),
    ]).start();
  };

  render() {
    const { style, children, ViewComponent = View } = this.props;
    return (
      <Animated.View
        {...this.props}
        style={[
          {
            transform: [{ translateX: this.shakeAnimation }],
          },
          style,
        ]}
      >
        <ViewComponent {...this.props}>{children}</ViewComponent>
      </Animated.View>
    );
  }
}