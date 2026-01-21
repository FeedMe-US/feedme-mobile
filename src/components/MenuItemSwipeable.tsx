/**
 * MenuItemSwipeable - Swipeable menu item for logging
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { haptics } from '@/src/utils/haptics';
import { formatCalories, formatMacro } from '@/src/utils/formatNutrition';

export interface MenuItemSwipeableProps {
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  onLog?: () => void;
  onSwipeLeft?: () => void;
}

const SWIPE_THRESHOLD = 80;

export function MenuItemSwipeable({ name, calories, protein, carbs, fat, onLog, onSwipeLeft }: MenuItemSwipeableProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light']; // Default to light for Neumorphism
  const translateX = useSharedValue(0);
  const isLoggingRef = React.useRef(false);

  const handleLog = () => {
    if (isLoggingRef.current) return; // Prevent double-trigger
    isLoggingRef.current = true;
    
    if (onLog) {
      onLog();
    } else if (onSwipeLeft) {
      onSwipeLeft();
    }
    
    // Reset flag after animation completes
    setTimeout(() => {
      isLoggingRef.current = false;
    }, 500);
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .failOffsetY([-30, 30])
    .minDistance(5)
    .onStart(() => {
      cancelAnimation(translateX);
    })
    .onUpdate((e) => {
      if (e.translationX < 0) {
        translateX.value = e.translationX;
      }
    })
    .onEnd((e) => {
      if (e.translationX < -SWIPE_THRESHOLD && (onLog || onSwipeLeft)) {
        runOnJS(haptics.success)();
        
        // Smooth swipe out animation
        translateX.value = withTiming(-200, { duration: 200 }, () => {
          // After swipe out, call the handler
          runOnJS(handleLog)();
          
          // Then smoothly return
          translateX.value = withDelay(100, withTiming(0, { duration: 200 }));
        });
      } else {
        translateX.value = withTiming(0, { duration: 200 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.item,
            { backgroundColor: themeColors.cardBackground },
            animatedStyle,
          ]}>
          <View style={styles.content}>
            <Text variant="body" weight="medium" style={styles.itemName}>
              {name}
            </Text>
            {/* Compact row layout: Calories | Protein | Carbs | Fat */}
            <View style={styles.nutritionRow}>
              <View style={styles.nutritionItem}>
                <Text variant="bodySmall" weight="semibold" style={{ color: themeColors.text }}>
                  {formatCalories(calories)}
                </Text>
                <Text variant="caption" color="secondary" style={styles.nutritionLabel}>
                  cal
                </Text>
              </View>
              {protein !== undefined && (
                <View style={styles.nutritionItem}>
                  <Text variant="bodySmall" weight="semibold" style={{ color: themeColors.protein }}>
                    {formatMacro(protein)}
                  </Text>
                  <Text variant="caption" color="secondary" style={styles.nutritionLabel}>
                    protein
                  </Text>
                </View>
              )}
              {carbs !== undefined && (
                <View style={styles.nutritionItem}>
                  <Text variant="bodySmall" weight="semibold" style={{ color: themeColors.carbs }}>
                    {formatMacro(carbs)}
                  </Text>
                  <Text variant="caption" color="secondary" style={styles.nutritionLabel}>
                    carbs
                  </Text>
                </View>
              )}
              {fat !== undefined && (
                <View style={styles.nutritionItem}>
                  <Text variant="bodySmall" weight="semibold" style={{ color: themeColors.fats }}>
                    {formatMacro(fat)}
                  </Text>
                  <Text variant="caption" color="secondary" style={styles.nutritionLabel}>
                    fat
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
      <Animated.View
        style={[
          styles.logAction,
          {
            backgroundColor: themeColors.success,
          },
          useAnimatedStyle(() => {
            return {
              opacity: translateX.value < -20 ? 1 : 0,
            };
          }),
        ]}>
        <Text variant="bodySmall" weight="semibold" style={{ color: themeColors.textInverse }}>
          Log
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  item: {
    padding: spacing.md,
    borderRadius: radius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  itemName: {
    marginBottom: spacing.xs,
  },
  nutritionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  nutritionItem: {
    alignItems: 'flex-start',
    gap: 2,
  },
  nutritionLabel: {
    fontSize: 10,
    textTransform: 'lowercase',
  },
  logAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopRightRadius: radius.md,
    borderBottomRightRadius: radius.md,
  },
});

