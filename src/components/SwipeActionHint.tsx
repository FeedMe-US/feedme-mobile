/**
 * SwipeActionHint - Shows hint of next action when swiping
 * Opal-inspired gesture discoverability
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  SharedValue,
} from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { AppIcon, AppIconType } from './AppIcon';

export interface SwipeActionHintProps {
  translation: SharedValue<number>;
  direction: 'left' | 'right' | 'up';
  icon: AppIconType | string;
  label: string;
  color?: string;
  hideIdlePeek?: boolean; // If true, don't show subtle peek when idle
}

export function SwipeActionHint({
  translation,
  direction,
  icon,
  label,
  color,
  hideIdlePeek = false,
}: SwipeActionHintProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];
  const actionColor = color || themeColors.primary;

  const animatedStyle = useAnimatedStyle(() => {
    const threshold = 100;
    const peekThreshold = 20; // Show subtle peek even when idle
    let opacity = 0;
    let scale = 0.8;
    let translate = 0;

    if (direction === 'left') {
      // Swipe left - show on right side
      if (translation.value < 0) {
        opacity = interpolate(
          translation.value,
          [-threshold, -50, -peekThreshold, 0],
          [1, 0.5, 0.15, 0],
          Extrapolate.CLAMP
        );
        scale = interpolate(
          translation.value,
          [-threshold, 0],
          [1, 0.8],
          Extrapolate.CLAMP
        );
        translate = interpolate(
          translation.value,
          [-threshold, 0],
          [0, 20],
          Extrapolate.CLAMP
        );
      } else {
        // Show subtle peek when idle (slight negative translation hint)
        opacity = hideIdlePeek ? 0 : 0.1;
        scale = 0.7;
      }
    } else if (direction === 'right') {
      // Swipe right - show on left side
      if (translation.value > 0) {
        opacity = interpolate(
          translation.value,
          [0, peekThreshold, 50, threshold],
          [0, 0.15, 0.5, 1],
          Extrapolate.CLAMP
        );
        scale = interpolate(
          translation.value,
          [0, threshold],
          [0.8, 1],
          Extrapolate.CLAMP
        );
        translate = interpolate(
          translation.value,
          [0, threshold],
          [20, 0],
          Extrapolate.CLAMP
        );
      } else {
        // Show subtle peek when idle (unless hideIdlePeek is true)
        opacity = hideIdlePeek ? 0 : 0.1;
        scale = 0.7;
      }
    } else if (direction === 'up') {
      // Swipe up - show on bottom
      if (translation.value < 0) {
        opacity = interpolate(
          translation.value,
          [-threshold, -50, -peekThreshold, 0],
          [1, 0.5, 0.15, 0],
          Extrapolate.CLAMP
        );
        scale = interpolate(
          translation.value,
          [-threshold, 0],
          [1, 0.8],
          Extrapolate.CLAMP
        );
        translate = interpolate(
          translation.value,
          [-threshold, 0],
          [0, 20],
          Extrapolate.CLAMP
        );
      } else {
        // Show subtle peek when idle
        opacity = 0.1;
        scale = 0.7;
      }
    }

    return {
      opacity,
      transform: [
        { scale },
        { translateY: direction === 'up' ? translate : 0 },
        { translateX: direction !== 'up' ? translate : 0 },
      ] as const,
    };
  });

  const containerStyle = [
    styles.container,
    direction === 'left' && styles.left,
    direction === 'right' && styles.right,
    direction === 'up' && styles.up,
  ];

  const iconType = typeof icon === 'string' && ['refresh', 'heart', 'heart-filled', 'camera', 'barcode', 'check', 'plus', 'profile', 'close', 'chevron-up-down', 'flip-camera'].includes(icon)
    ? (icon as AppIconType)
    : 'check';

  return (
    <Animated.View style={[containerStyle, animatedStyle]}>
      <View style={[styles.iconContainer, { backgroundColor: actionColor + '20' }]}>
        {typeof icon === 'string' && iconType !== 'check' ? (
          <AppIcon type={iconType} size={20} color={actionColor} />
        ) : (
          <AppIcon type="check" size={20} color={actionColor} />
        )}
      </View>
      <Text variant="caption" style={[styles.label, { color: actionColor }]}>
        {label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  left: {
    right: spacing.lg,
    top: '50%',
    marginTop: -20,
  },
  right: {
    left: spacing.lg,
    top: '50%',
    marginTop: -20,
  },
  up: {
    bottom: spacing.lg,
    left: '50%',
    marginLeft: -30,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  icon: {
    fontSize: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});

