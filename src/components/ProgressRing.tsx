/**
 * ProgressRing - Animated circular progress ring using SVG
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors } from '@/src/theme';
import { Text } from '@/src/ui/Text';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  unit?: string;
  showLabel?: boolean;
}

export function ProgressRing({
  value,
  max,
  size = 120,
  strokeWidth = 12,
  color,
  backgroundColor,
  unit,
  showLabel = true,
}: ProgressRingProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];
  
  const ringColor = color || themeColors.primary;
  // Ensure background track is visible even when empty
  const bgColor = backgroundColor || (themeColors.border + '50'); // Increased opacity for better visibility
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);

  useEffect(() => {
    const targetProgress = Math.min(Math.max(value / max, 0), 1);
    progress.value = withSpring(targetProgress, {
      damping: 15,
      stiffness: 100,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, max]);

  const animatedCircleProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progress.value);
    return {
      strokeDashoffset: withTiming(strokeDashoffset, { duration: 300 }),
    };
  });

  const percentage = Math.round((value / max) * 100);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeLinecap="round"
          animatedProps={animatedCircleProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {/* Center label */}
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text variant="h2" weight="bold" style={[styles.value, { color: ringColor }]}>
            {Math.round(value)}
          </Text>
          {unit && (
            <Text variant="caption" color="secondary" style={styles.unit}>
              {unit}
            </Text>
          )}
          <Text variant="caption" color="secondary" style={styles.percentage}>
            {percentage}%
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  labelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 32,
    lineHeight: 36,
  },
  unit: {
    fontSize: 11,
    marginTop: 2,
  },
  percentage: {
    fontSize: 11,
    marginTop: 2,
  },
});

