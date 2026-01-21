/**
 * ProgressRingConfirmation - Circular progress ring with check icon
 * Replaces Alert popup with smooth inline confirmation
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withSpring,
  withTiming,
  SharedValue,
} from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { AppIcon } from './AppIcon';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ProgressRingConfirmationProps {
  progress: SharedValue<number>; // 0 to 1
  size?: number;
  strokeWidth?: number;
  color?: string;
  showCheck?: boolean;
}

export function ProgressRingConfirmation({
  progress,
  size = 60,
  strokeWidth = 4,
  color,
  showCheck = false,
}: ProgressRingConfirmationProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];
  const ringColor = color || themeColors.success;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedCircleProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progress.value);
    return {
      strokeDashoffset: withSpring(strokeDashoffset, {
        damping: 15,
        stiffness: 100,
      }),
    };
  });

  const checkOpacity = useSharedValue(0);
  const checkScale = useSharedValue(0);

  React.useEffect(() => {
    if (showCheck) {
      checkOpacity.value = withTiming(1, { duration: 200 });
      checkScale.value = withSpring(1, { damping: 10, stiffness: 200 });
    } else {
      checkOpacity.value = withTiming(0, { duration: 200 });
      checkScale.value = withTiming(0, { duration: 200 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCheck]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor + '30'}
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
      {/* Check icon */}
      {showCheck && (
        <Animated.View
          style={[
            styles.checkContainer,
            {
              opacity: checkOpacity.value,
              transform: [{ scale: checkScale.value }],
            },
          ]}>
          <AppIcon type="check" size={32} color={ringColor} />
        </Animated.View>
      )}
      {/* Plus icon (default) */}
      {!showCheck && (
        <View style={styles.plusContainer}>
          <AppIcon type="plus" size={24} color={ringColor} />
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
  checkContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    fontWeight: 'bold',
  },
  plusContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    fontWeight: '300',
  },
});

