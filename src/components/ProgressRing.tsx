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
  isExceeded?: boolean;
  isSmall?: boolean;
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
  isExceeded = false,
  isSmall = false,
}: ProgressRingProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];
  
  const ringColor = color || themeColors.primary;
  // Ensure background track is visible even when empty
  const bgColor = backgroundColor || (themeColors.border + '50'); // Increased opacity for better visibility
  
  // When exceeded, use a thicker stroke and add overlay
  const effectiveStrokeWidth = isExceeded ? strokeWidth * 1.3 : strokeWidth;
  
  const radius = (size - effectiveStrokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);

  useEffect(() => {
    // Cap progress at 1.0 for the ring, but we'll show percentage separately
    const targetProgress = Math.min(value / max, 1);
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
  const valueTextSize = isSmall ? 14 : 32;
  const unitTextSize = isSmall ? 8 : 11;
  const percentageTextSize = isSmall ? 8 : 11;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={effectiveStrokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={effectiveStrokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeLinecap="round"
          animatedProps={animatedCircleProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        {/* Bold overlay circle when exceeded - shows full ring in bold */}
        {isExceeded && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={ringColor}
            strokeWidth={effectiveStrokeWidth * 0.5}
            fill="transparent"
            opacity={0.6}
          />
        )}
      </Svg>
      {/* Center label */}
      {showLabel && (
        <View style={[styles.labelContainer, isSmall && styles.labelContainerSmall]}>
          {isSmall ? (
            // Small rings: number and "g" on same line, percentage below
            <>
              <View style={styles.valueRow}>
                <Text 
                  variant="body" 
                  weight="bold" 
                  style={[styles.value, { color: ringColor, fontSize: valueTextSize, lineHeight: valueTextSize + 2 }]}>
                  {Math.round(value)}
                </Text>
                {unit && (
                  <Text 
                    variant="caption" 
                    color="secondary" 
                    style={[styles.unit, { fontSize: unitTextSize, lineHeight: unitTextSize + 2 }]}>
                    {unit}
                  </Text>
                )}
              </View>
              <Text 
                variant="caption" 
                color="secondary" 
                style={[styles.percentage, { fontSize: percentageTextSize, lineHeight: percentageTextSize + 2 }]}>
                {percentage}%
              </Text>
            </>
          ) : (
            // Large rings (calories): original layout - unchanged
            <>
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
            </>
          )}
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
  labelContainerSmall: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 0,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
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

