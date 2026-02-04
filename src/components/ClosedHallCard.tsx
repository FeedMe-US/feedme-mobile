/**
 * ClosedHallCard - Swipeable card for closed dining halls
 * Shows message and allows swipe-right to navigate to off-campus nutrition tracking
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing } from '@/src/theme';
import { Card } from '@/src/ui/Card';
import { Text } from '@/src/ui/Text';
import { haptics } from '@/src/utils/haptics';
import { SwipeActionHint } from './SwipeActionHint';

export interface ClosedHallCardProps {
  /** Name of the closed dining hall, or undefined for "all halls closed" */
  diningHallName?: string;
  /** Called when user swipes right to track off-campus */
  onSwipeRight: () => void;
  style?: ViewStyle;
}

const SWIPE_THRESHOLD = 80;

export function ClosedHallCard({
  diningHallName,
  onSwipeRight,
  style,
}: ClosedHallCardProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];

  const translateX = useSharedValue(0);
  const isSwipingRef = React.useRef(false);

  const handleSwipeRight = () => {
    if (isSwipingRef.current) return;
    isSwipingRef.current = true;
    onSwipeRight();
    setTimeout(() => {
      isSwipingRef.current = false;
    }, 500);
  };

  // Horizontal swipe gesture - mirrors MealCard pattern
  const horizontalPanGesture = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .failOffsetY([-25, 25])
    .minDistance(5)
    .onStart(() => {
      cancelAnimation(translateX);
    })
    .onUpdate((e) => {
      const absX = Math.abs(e.translationX);
      const absY = Math.abs(e.translationY);
      // Only allow rightward movement (positive X)
      if (absX > absY * 0.6 && e.translationX > 0) {
        translateX.value = e.translationX;
      }
    })
    .onEnd((e) => {
      const absX = Math.abs(e.translationX);
      const absY = Math.abs(e.translationY);
      const isHorizontalSwipe = absX > absY * 0.6;

      // Swipe right to track off-campus
      if (e.translationX > SWIPE_THRESHOLD && isHorizontalSwipe) {
        runOnJS(haptics.medium)();

        translateX.value = withTiming(200, { duration: 200 }, () => {
          runOnJS(handleSwipeRight)();
          translateX.value = withTiming(0, { duration: 200 });
        });
      } else {
        // Return to center
        translateX.value = withTiming(0, { duration: 200 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const title = diningHallName
    ? `${diningHallName} is Closed`
    : 'Dining Halls Closed';

  return (
    <View style={[styles.wrapper, style]}>
      {/* Swipe Action Hint - shows on left side when swiping right */}
      <SwipeActionHint
        translation={translateX}
        direction="right"
        icon="camera"
        label="Off-Campus"
        color={themeColors.primary}
      />

      <GestureDetector gesture={horizontalPanGesture}>
        <Animated.View style={animatedStyle}>
          <Card variant="elevated" padding="lg" style={styles.card}>
            <Text variant="h4" weight="semibold" style={styles.title}>
              {title}
            </Text>
            <Text variant="body" color="secondary" style={styles.message}>
              Swipe Right to Track Off-Campus Nutrition
            </Text>
          </Card>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginHorizontal: spacing.md,
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    textAlign: 'center',
  },
});
