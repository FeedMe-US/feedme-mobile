/**
 * AnimatedPressable - Reusable animated pressable wrapper
 * Provides premium press interactions with scale + opacity animations
 */

import React from 'react';
import { Pressable, PressableProps, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

export interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
  style?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
  disabled?: boolean;
}

const PRESS_SCALE = 0.98;
const PRESS_OPACITY = 0.96;
const PRESS_DURATION = 140; // ms
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 300,
};

export function AnimatedPressable({
  style,
  children,
  disabled = false,
  onPressIn,
  onPressOut,
  ...props
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const handlePressIn = (e: any) => {
    if (disabled) return;
    
    scale.value = withTiming(PRESS_SCALE, { duration: PRESS_DURATION });
    opacity.value = withTiming(PRESS_OPACITY, { duration: PRESS_DURATION });
    
    if (onPressIn) {
      runOnJS(onPressIn)(e);
    }
  };

  const handlePressOut = (e: any) => {
    if (disabled) return;
    
    scale.value = withSpring(1, SPRING_CONFIG);
    opacity.value = withSpring(1, SPRING_CONFIG);
    
    if (onPressOut) {
      runOnJS(onPressOut)(e);
    }
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={style}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        {...props}>
        {children}
      </Pressable>
    </Animated.View>
  );
}
