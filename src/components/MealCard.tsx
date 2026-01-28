/**
 * MealCard - Recommended meal card with swipe actions
 * Matches SwiftUI meal card design
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, Platform } from 'react-native';
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
import { colors, spacing, radius, shadows, typography } from '@/src/theme';
import { Card } from '@/src/ui/Card';
import { Text } from '@/src/ui/Text';
import { Button } from '@/src/ui/Button';
import { haptics } from '@/src/utils/haptics';
import { formatCalories, formatMacro } from '@/src/utils/formatNutrition';
import { RefreshIcon } from './icons';
import { SwipeActionHint } from './SwipeActionHint';
import { AppIcon } from './AppIcon';

export interface MealItem {
  name: string;
  amount: string;
  icon?: string;
}

export interface MealCardProps {
  diningHall: string;
  mealItems: MealItem[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  onLogAll?: () => void;
  onSelectItems?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onRefresh?: () => void;
  onLike?: () => void;
  isLiked?: boolean;
  style?: ViewStyle;
}

const SWIPE_THRESHOLD = 80; // Lower threshold for easier swiping

export function MealCard({
  diningHall,
  mealItems,
  calories,
  protein,
  carbs,
  fat,
  onLogAll,
  onSelectItems,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onRefresh,
  onLike,
  isLiked = false,
  style,
}: MealCardProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light']; // Default to light for Neumorphism

  const translateX = useSharedValue(0);
  const [liked, setLiked] = React.useState(isLiked);
  const [isLogged, setIsLogged] = React.useState(false);
  const isSwipingRef = React.useRef(false);
  const scaleAnim = useSharedValue(1);

  React.useEffect(() => {
    setLiked(isLiked);
  }, [isLiked]);

  const handleLike = () => {
    const newLiked = !liked;
    setLiked(newLiked);
    haptics.success();
    if (onLike) {
      onLike();
    }
  };

  const handleLogAll = () => {
    if (!onLogAll) return;
    
    // Set logged state and trigger animation
    setIsLogged(true);
    haptics.success();
    
    // Single bounce animation - scale up then back down smoothly
    scaleAnim.value = withTiming(1.15, { duration: 150 }, () => {
      scaleAnim.value = withTiming(1, { duration: 200 });
    });
    
    // Call the actual log handler
    onLogAll();
    
    // Reset after animation completes
    setTimeout(() => {
      setIsLogged(false);
    }, 2000);
  };

  // Handle swipe left - simple and safe like menu
  const handleSwipeLeft = () => {
    if (isSwipingRef.current || !onSwipeLeft) return;
    isSwipingRef.current = true;
    
    // Trigger visual feedback for logging
    setIsLogged(true);
    scaleAnim.value = withTiming(1.15, { duration: 150 }, () => {
      scaleAnim.value = withTiming(1, { duration: 200 });
    });
    
    onSwipeLeft();
    setTimeout(() => {
      isSwipingRef.current = false;
    }, 500);
    
    // Reset visual feedback after animation
    setTimeout(() => {
      setIsLogged(false);
    }, 2000);
  };

  // Handle swipe right - same safe pattern
  const handleSwipeRight = () => {
    if (isSwipingRef.current || !onSwipeRight) return;
    isSwipingRef.current = true;
    if (onSwipeRight) onSwipeRight();
    setTimeout(() => {
      isSwipingRef.current = false;
    }, 500);
  };

  // Horizontal swipe - SIMPLE pattern matching menu exactly
  // Must fail if there's significant vertical movement (let vertical win)
  const horizontalPanGesture = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .failOffsetY([-25, 25]) // Fail if significant vertical movement - let vertical gesture win
    .minDistance(5)
    .onStart(() => {
      cancelAnimation(translateX);
    })
    .onUpdate((e) => {
      // Allow if horizontal movement is dominant (more forgiving)
      const absX = Math.abs(e.translationX);
      const absY = Math.abs(e.translationY);
      if (absX > absY * 0.6) {
        translateX.value = e.translationX;
      }
    })
    .onEnd((e) => {
      const absX = Math.abs(e.translationX);
      const absY = Math.abs(e.translationY);
      const isHorizontalSwipe = absX > absY * 0.6; // More lenient
      
      // Swipe left to log
      if (e.translationX < -SWIPE_THRESHOLD && isHorizontalSwipe && onSwipeLeft) {
        runOnJS(haptics.success)();
        
        // Simple swipe out animation, call handler, then return - EXACT menu pattern
        translateX.value = withTiming(-200, { duration: 200 }, () => {
          runOnJS(handleSwipeLeft)();
          translateX.value = withDelay(100, withTiming(0, { duration: 200 }));
        });
      } 
      // Swipe right - same safe pattern as left swipe
      else if (e.translationX > SWIPE_THRESHOLD && isHorizontalSwipe && onSwipeRight) {
        runOnJS(haptics.medium)();
        
        // Simple swipe animation, call handler, then return - same pattern as left
        translateX.value = withTiming(200, { duration: 200 }, () => {
          runOnJS(handleSwipeRight)();
          translateX.value = withDelay(100, withTiming(0, { duration: 200 }));
        });
      } 
      // Didn't reach threshold - return
      else {
        translateX.value = withTiming(0, { duration: 200 });
      }
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(handleLike)();
    });

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { translateX: translateX.value },
      ] as const,
    };
  });

  const logButtonAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: scaleAnim.value }],
    };
  });

  // Combine gestures - horizontal swipe and double tap
  const finalGesture = Gesture.Race(
    doubleTapGesture,
    horizontalPanGesture
  );

  return (
    <View style={[styles.wrapper, style]}>
      {/* Swipe Action Hints */}
          {mealItems.length > 0 && onSwipeLeft && (
            <SwipeActionHint
              translation={translateX}
              direction="left"
              icon="check"
              label="Log"
              color={themeColors.success}
            />
          )}
          {onSwipeRight && (
            <SwipeActionHint
              translation={translateX}
              direction="right"
              icon="plus"
              label="Add Items"
              color={themeColors.primary}
              hideIdlePeek={mealItems.length === 0}
            />
          )}

      <GestureDetector gesture={finalGesture}>
        <Animated.View style={[animatedStyle, styles.cardContainer]}>
          <Card
            variant="elevated"
            padding="lg"
            style={styles.card}>
          {mealItems.length > 0 ? (
            <>
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Text variant="h4" weight="semibold" style={styles.diningHall}>
                    {diningHall}
                  </Text>
                  <View style={styles.headerButtons}>
                    <TouchableOpacity
                      onPress={onRefresh}
                      style={styles.refreshButton}
                      activeOpacity={0.7}>
                      <RefreshIcon size={20} color={themeColors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleLike}
                      style={styles.heartButton}
                      activeOpacity={0.7}>
                      <AppIcon
                        type={liked ? 'heart-filled' : 'heart'}
                        size={20}
                        color={liked ? '#FF69B4' : themeColors.text}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text variant="bodySmall" color="secondary">
                  Recommended Meal
                </Text>
              </View>
              <View style={styles.itemsContainer}>
                {mealItems.map((item, index) => (
                  <View key={index} style={styles.mealItem}>
                    <Text variant="body" style={styles.itemName}>
                      {item.name}
                    </Text>
                    <Text variant="bodySmall" color="secondary">
                      {item.amount}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <>
              <View style={[styles.header, styles.closedHeader]}>
                <Text variant="h4" weight="semibold" style={styles.closedTitle}>
                  {diningHall}
                </Text>
              </View>
              <View style={styles.closedMessageContainer}>
                <Text variant="body" color="secondary" style={styles.closedMessage}>
                  This dining hall is currently closed
                </Text>
                {onSwipeRight && (
                  <Text variant="bodySmall" color="secondary" style={styles.closedHint}>
                    Swipe right to track off-campus nutrition
                  </Text>
                )}
              </View>
            </>
          )}

          {/* Macros - Only show if there are meal items */}
          {mealItems.length > 0 && (
            <>
              <View style={styles.macroSummary}>
                <View style={styles.macroRow}>
                  <View style={styles.macroItem}>
                    <Text variant="body" weight="bold" style={[styles.macroValue, { color: themeColors.text }]}>
                      {formatCalories(calories)}
                    </Text>
                    <Text variant="caption" color="secondary" style={styles.macroLabel}>
                      cal
                    </Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text variant="body" weight="bold" style={[styles.macroValue, { color: themeColors.protein }]}>
                      {formatMacro(protein)}g
                    </Text>
                    <Text variant="caption" color="secondary" style={styles.macroLabel}>
                      protein
                    </Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text variant="body" weight="bold" style={[styles.macroValue, { color: themeColors.carbs }]}>
                      {formatMacro(carbs)}g
                    </Text>
                    <Text variant="caption" color="secondary" style={styles.macroLabel}>
                      carbs
                    </Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text variant="body" weight="bold" style={[styles.macroValue, { color: themeColors.fats }]}>
                      {formatMacro(fat)}g
                    </Text>
                    <Text variant="caption" color="secondary" style={styles.macroLabel}>
                      fat
                    </Text>
                  </View>
                </View>
              </View>

              {/* Actions - Polished buttons with icons */}
              <View style={styles.actions}>
                <Animated.View style={[styles.logAllButtonWrapper, logButtonAnimatedStyle]}>
                  <TouchableOpacity
                    style={[
                      styles.logAllButtonInner,
                      { 
                        backgroundColor: isLogged ? themeColors.success : themeColors.primary 
                      },
                      colorScheme === 'dark' && {
                        shadowColor: isLogged ? themeColors.success : '#0a7ea4',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.15,
                        shadowRadius: 10,
                        ...(Platform.OS === 'android' && {
                          elevation: 8,
                        }),
                      },
                    ]}
                    onPress={handleLogAll}
                    activeOpacity={0.8}
                    disabled={isLogged}>
                    <View style={styles.buttonIcon}>
                      <AppIcon 
                        type={isLogged ? "check" : "plus"} 
                        size={16} 
                        color={themeColors.textInverse} 
                      />
                    </View>
                    <Text variant="body" weight="semibold" style={{ color: themeColors.textInverse }}>
                      {isLogged ? "Logged!" : "Log All"}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
                <TouchableOpacity
                  style={[styles.selectItemsButton, { borderColor: themeColors.primary }]}
                  onPress={onSelectItems}
                  activeOpacity={0.8}>
                  <View style={[styles.buttonIcon, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: themeColors.primary }]}>
                    <AppIcon type="check" size={16} color={themeColors.primary} />
                  </View>
                  <Text variant="body" weight="semibold" style={{ color: themeColors.text }}>
                    Select Items
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Card>
      </Animated.View>
    </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  cardContainer: {
    position: 'relative',
  },
  card: {
    marginBottom: 0,
  },
  header: {
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  diningHall: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  refreshButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  heartButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  heartIcon: {
    fontSize: 20,
  },
  itemsContainer: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    flex: 1,
  },
  macroSummary: {
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroValue: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 2,
  },
  macroLabel: {
    fontSize: 10,
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  logAllButtonWrapper: {
    flex: 1,
  },
  logAllButtonInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  selectItemsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
    gap: spacing.sm,
  },
  buttonIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    lineHeight: 20,
  },
  checklistIcon: {
    fontSize: 14,
    color: '#4FC3F7',
    fontWeight: '600',
    lineHeight: 16,
  },
  closedHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  closedTitle: {
    textAlign: 'center',
  },
  closedMessageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  closedMessage: {
    textAlign: 'center',
  },
  closedHint: {
    textAlign: 'center',
  },
});
