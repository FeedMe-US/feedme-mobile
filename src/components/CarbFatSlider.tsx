/**
 * CarbFatSlider - Customizable carb/fat ratio slider component
 *
 * Allows users to adjust how remaining calories (after protein) are split
 * between carbohydrates and fats. Uses a visual slider with live gram updates.
 */

import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { haptics } from '@/src/utils/haptics';

export interface CarbFatSliderProps {
  /** Remaining calories after protein allocation */
  remainingCalories: number;
  /** Current carb/fat ratio (carb_cals / fat_cals). Default 1.5 = 60% carbs / 40% fat */
  carbFatRatio: number;
  /** Callback when ratio changes */
  onRatioChange: (ratio: number) => void;
  /** Minimum fat in grams (default 50 for males, 40 for females) */
  minFatGrams?: number;
  /** Minimum carbs in grams (default 50) */
  minCarbGrams?: number;
  /** User's sex for minimum fat calculation */
  sex?: 'male' | 'female';
}

/** Convert ratio to percentage of carbs (0-100) */
function ratioToPercent(ratio: number): number {
  if (ratio <= 0) return 0;
  return (ratio / (ratio + 1)) * 100;
}

/** Convert percentage to ratio */
function percentToRatio(percent: number): number {
  if (percent <= 0) return 0;
  if (percent >= 100) return 999; // Large number for "all carbs"
  return percent / (100 - percent);
}

/** Calculate grams from ratio and remaining calories */
function calculateGrams(remainingCalories: number, carbFatRatio: number) {
  if (remainingCalories <= 0) {
    return { fatGrams: 0, carbGrams: 0, fatPercent: 50, carbPercent: 50 };
  }

  const fatCals = remainingCalories / (carbFatRatio + 1);
  const carbCals = remainingCalories - fatCals;

  const fatGrams = Math.round(fatCals / 9);
  const carbGrams = Math.round(carbCals / 4);

  const carbPercent = Math.round((carbFatRatio / (carbFatRatio + 1)) * 100);
  const fatPercent = 100 - carbPercent;

  return { fatGrams, carbGrams, fatPercent, carbPercent };
}

export function CarbFatSlider({
  remainingCalories,
  carbFatRatio,
  onRatioChange,
  minFatGrams,
  minCarbGrams = 50,
  sex = 'male',
}: CarbFatSliderProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];

  // Default minimum fat based on sex
  const effectiveMinFatGrams = minFatGrams ?? (sex === 'male' ? 50 : 40);

  // Track slider width for position calculations
  const sliderWidth = useSharedValue(200);
  const translateX = useSharedValue(0);
  const isDragging = useSharedValue(false);

  // Calculate current values
  const { fatGrams, carbGrams, fatPercent, carbPercent } = useMemo(
    () => calculateGrams(remainingCalories, carbFatRatio),
    [remainingCalories, carbFatRatio]
  );

  // Calculate position from ratio
  const currentPercent = ratioToPercent(carbFatRatio);

  // Enforce minimum constraints and update ratio
  const updateRatio = useCallback(
    (newPercent: number) => {
      // Clamp to valid range (5-95% to avoid extremes)
      let clampedPercent = Math.max(5, Math.min(95, newPercent));

      // Convert to ratio
      let newRatio = percentToRatio(clampedPercent);

      // Check fat minimum
      const testFatCals = remainingCalories / (newRatio + 1);
      const testFatGrams = testFatCals / 9;

      if (testFatGrams < effectiveMinFatGrams) {
        // Hit fat minimum - constrain ratio
        const minFatCals = effectiveMinFatGrams * 9;
        const maxCarbCals = Math.max(0, remainingCalories - minFatCals);
        newRatio = maxCarbCals / minFatCals;
      }

      // Check carb minimum
      const testCarbCals = remainingCalories - (remainingCalories / (newRatio + 1));
      const testCarbGrams = testCarbCals / 4;

      if (testCarbGrams < minCarbGrams) {
        // Hit carb minimum - constrain ratio
        const minCarbCals = minCarbGrams * 4;
        const maxFatCals = Math.max(0, remainingCalories - minCarbCals);
        newRatio = minCarbCals / maxFatCals;
      }

      onRatioChange(Math.round(newRatio * 100) / 100);
    },
    [remainingCalories, effectiveMinFatGrams, minCarbGrams, onRatioChange]
  );

  // Handle layout to get slider width
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    sliderWidth.value = event.nativeEvent.layout.width;
  }, []);

  // Pan gesture for dragging the slider
  const panGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
      runOnJS(haptics.light)();
    })
    .onUpdate((event) => {
      const position = Math.max(0, Math.min(sliderWidth.value, event.x));
      const percent = (position / sliderWidth.value) * 100;
      runOnJS(updateRatio)(percent);
    })
    .onEnd(() => {
      isDragging.value = false;
      runOnJS(haptics.light)();
    });

  // Tap gesture for quick position changes
  const tapGesture = Gesture.Tap().onEnd((event) => {
    const position = Math.max(0, Math.min(sliderWidth.value, event.x));
    const percent = (position / sliderWidth.value) * 100;
    runOnJS(haptics.medium)();
    runOnJS(updateRatio)(percent);
  });

  // Combine gestures
  const gesture = Gesture.Race(panGesture, tapGesture);

  // Animated styles for the thumb
  const thumbStyle = useAnimatedStyle(() => {
    const percent = ratioToPercent(carbFatRatio);
    const position = (percent / 100) * sliderWidth.value;

    return {
      transform: [
        { translateX: withSpring(position - 12, { damping: 15, stiffness: 150 }) },
        { scale: isDragging.value ? 1.2 : 1 },
      ],
    };
  });

  // Animated style for the filled track
  const filledTrackStyle = useAnimatedStyle(() => {
    const percent = ratioToPercent(carbFatRatio);
    return {
      width: `${percent}%`,
    };
  });

  return (
    <View style={styles.container}>
      {/* Header with labels */}
      <View style={styles.header}>
        <View style={styles.labelContainer}>
          <View style={[styles.colorDot, { backgroundColor: themeColors.fats }]} />
          <Text variant="bodySmall" color="secondary">Fat</Text>
        </View>
        <Text variant="bodySmall" weight="medium" color="secondary">
          Carb/Fat Split
        </Text>
        <View style={styles.labelContainer}>
          <Text variant="bodySmall" color="secondary">Carbs</Text>
          <View style={[styles.colorDot, { backgroundColor: themeColors.carbs }]} />
        </View>
      </View>

      {/* Slider */}
      <GestureDetector gesture={gesture}>
        <View
          style={[styles.sliderContainer, { backgroundColor: themeColors.backgroundTertiary }]}
          onLayout={onLayout}
        >
          {/* Fat side (unfilled) - Pink */}
          <View style={[styles.trackBackground, { backgroundColor: themeColors.fats + '40' }]} />

          {/* Carb side (filled) - Purple */}
          <Animated.View
            style={[
              styles.trackFilled,
              { backgroundColor: themeColors.carbs },
              filledTrackStyle,
            ]}
          />

          {/* Thumb */}
          <Animated.View
            style={[
              styles.thumb,
              { backgroundColor: themeColors.background, borderColor: themeColors.primary },
              thumbStyle,
            ]}
          />
        </View>
      </GestureDetector>

      {/* Gram display */}
      <View style={styles.gramsContainer}>
        <View style={styles.gramItem}>
          <Text variant="h4" weight="semibold" style={{ color: themeColors.fats }}>
            {fatGrams}g
          </Text>
          <Text variant="caption" color="secondary">
            {fatPercent}%
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

        <View style={styles.gramItem}>
          <Text variant="h4" weight="semibold" style={{ color: themeColors.carbs }}>
            {carbGrams}g
          </Text>
          <Text variant="caption" color="secondary">
            {carbPercent}%
          </Text>
        </View>
      </View>

      {/* Info text */}
      <Text variant="caption" color="secondary" style={styles.infoText}>
        Slide to adjust how remaining calories are split between carbs and fat
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sliderContainer: {
    height: 40,
    borderRadius: radius.lg,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  trackBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: '100%',
    borderRadius: radius.lg,
  },
  trackFilled: {
    position: 'absolute',
    left: 0,
    height: '100%',
    borderRadius: radius.lg,
  },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  gramsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  gramItem: {
    alignItems: 'center',
    flex: 1,
  },
  divider: {
    width: 1,
    height: 40,
  },
  infoText: {
    textAlign: 'center',
  },
});
