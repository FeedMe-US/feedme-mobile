import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView as RNScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { Button } from '@/src/ui/Button';
import { Screen } from '@/src/ui/Screen';
import { haptics } from '@/src/utils/haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { saveOnboardingData, getOnboardingData } from '@/src/lib/onboardingData';

const MIN_WEIGHT = 80;
const MAX_WEIGHT = 300;
const DEFAULT_GOAL_WEIGHT = 170;
const STEP = 1;
const ITEM_WIDTH = 40;

export default function GoalWeightScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [goalWeight, setGoalWeight] = useState(DEFAULT_GOAL_WEIGHT);
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [indicatorPosition, setIndicatorPosition] = useState(0);
  const scrollViewRef = useRef<RNScrollView>(null);
  const lastWeightRef = useRef(DEFAULT_GOAL_WEIGHT);

  useEffect(() => {
    // Load current weight and initial goal from onboarding data
    const loadData = async () => {
      const data = await getOnboardingData();
      if (data.weight) {
        setCurrentWeight(data.weight);
        
        // Set default goal weight based on initial goal selection
        let defaultGoal = data.weight; // Default to same weight
        
        if (data.goal === 'bulk') {
          // Bulk up: suggest 8-12 lbs more
          defaultGoal = data.weight + 10;
        } else if (data.goal === 'lean') {
          // Get lean: suggest 5-8 lbs less
          defaultGoal = data.weight - 6;
        } else if (data.goal === 'maintain') {
          // Maintain: suggest within 2 lbs
          defaultGoal = data.weight;
        } else if (data.goal === 'perform') {
          // Perform better: suggest slight increase (3-5 lbs) for muscle
          defaultGoal = data.weight + 4;
        }
        
        // Clamp to valid range
        defaultGoal = Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, defaultGoal));
        setGoalWeight(defaultGoal);
        
        const initialOffset = (defaultGoal - MIN_WEIGHT) * ITEM_WIDTH;
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ x: initialOffset, animated: false });
        }, 100);
      } else {
        // Scroll to initial goal weight
        const initialOffset = (DEFAULT_GOAL_WEIGHT - MIN_WEIGHT) * ITEM_WIDTH;
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ x: initialOffset, animated: false });
        }, 100);
      }
    };
    loadData();
  }, []);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newWeight = Math.round(offsetX / ITEM_WIDTH) + MIN_WEIGHT;
    const clampedWeight = Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, newWeight));
    
    // Calculate indicator position to align with selected weight
    const screenWidth = Dimensions.get('window').width;
    const visibleItems = Math.floor(screenWidth / ITEM_WIDTH);
    const paddingLeft = (visibleItems - 1) / 2 * ITEM_WIDTH;
    const centerX = screenWidth / 2;
    const selectedOffset = (clampedWeight - MIN_WEIGHT) * ITEM_WIDTH;
    const indicatorX = centerX - paddingLeft + selectedOffset;
    setIndicatorPosition(indicatorX);
    
    if (clampedWeight !== lastWeightRef.current) {
      lastWeightRef.current = clampedWeight;
      haptics.selection();
      setGoalWeight(clampedWeight);
    }
  };

  const handleMomentumScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newWeight = Math.round(offsetX / ITEM_WIDTH) + MIN_WEIGHT;
    const clampedWeight = Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, newWeight));
    const snapOffset = (clampedWeight - MIN_WEIGHT) * ITEM_WIDTH;
    
    // Update indicator position after snap
    const screenWidth = Dimensions.get('window').width;
    const visibleItems = Math.floor(screenWidth / ITEM_WIDTH);
    const paddingLeft = (visibleItems - 1) / 2 * ITEM_WIDTH;
    const centerX = screenWidth / 2;
    const indicatorX = centerX - paddingLeft + snapOffset;
    setIndicatorPosition(indicatorX);
    
    scrollViewRef.current?.scrollTo({ x: snapOffset, animated: true });
    setGoalWeight(clampedWeight);
  };

  const handleContinue = async () => {
    // Determine goal type based on weight difference
    let suggestedGoal: 'bulk' | 'lean' | 'maintain' | 'perform' = 'maintain';
    
    if (currentWeight !== null) {
      const weightDiff = goalWeight - currentWeight;
      
      // Scientific approach:
      // - If goal is 5+ lbs less: Cut (fat loss)
      // - If goal is 2-4 lbs less: Lean Muscle Growth (recomp)
      // - If goal is within 2 lbs: Maintain
      // - If goal is 3-8 lbs more: Lean Muscle Growth (lean bulk)
      // - If goal is 9+ lbs more: Bulk (mass gain)
      
      if (weightDiff <= -5) {
        suggestedGoal = 'lean'; // Cut
      } else if (weightDiff >= -4 && weightDiff <= -2) {
        suggestedGoal = 'lean'; // Lean muscle growth (recomp)
      } else if (weightDiff >= -1 && weightDiff <= 2) {
        suggestedGoal = 'maintain'; // Maintain
      } else if (weightDiff >= 3 && weightDiff <= 8) {
        suggestedGoal = 'lean'; // Lean muscle growth (lean bulk)
      } else if (weightDiff >= 9) {
        suggestedGoal = 'bulk'; // Bulk
      }
    }
    
    await saveOnboardingData({ 
      goalWeight,
      goal: suggestedGoal, // Auto-suggest goal based on weight difference
    });
    router.push('/(onboarding)/activity');
  };

  // Generate all weights
  const weights: number[] = [];
  for (let i = MIN_WEIGHT; i <= MAX_WEIGHT; i += STEP) {
    weights.push(i);
  }

  const screenWidth = Dimensions.get('window').width;
  const visibleItems = Math.floor(screenWidth / ITEM_WIDTH);
  const paddingLeft = (visibleItems - 1) / 2 * ITEM_WIDTH;
  const paddingRight = (visibleItems - 1) / 2 * ITEM_WIDTH;

  return (
    <Screen>
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text variant="h1" weight="bold" style={styles.title}>
            What&apos;s your goal weight?
          </Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            This helps us personalize your nutrition plan
          </Text>
        </View>

        {/* Goal Weight Display - Large Number */}
        <View style={styles.weightDisplay}>
          <Text variant="h1" weight="bold" style={styles.weightValue}>
            {goalWeight}
          </Text>
          <Text variant="body" color="secondary" style={styles.weightUnit}>
            lbs
          </Text>
        </View>

        {/* Scrollable Weight Ruler */}
        <View style={styles.rulerContainer}>
          <View style={[styles.rulerMask, styles.rulerMaskLeft, { backgroundColor: themeColors.background }]} />
          <RNScrollView
            ref={scrollViewRef}
            horizontal
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingLeft, paddingRight },
            ]}
            showsHorizontalScrollIndicator={false}
            snapToInterval={ITEM_WIDTH}
            decelerationRate="fast"
            onScroll={handleScroll}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            scrollEventThrottle={16}>
            {weights.map((weightOption) => {
              const isMainMarker = weightOption % 10 === 0;
              const isNearWeight = Math.abs(weightOption - goalWeight) <= 2;
              return (
                <View
                  key={weightOption}
                  style={[
                    styles.markerContainer,
                    { width: ITEM_WIDTH },
                  ]}>
                  <View
                    style={[
                      styles.marker,
                      {
                        height: isMainMarker ? 35 : 10,
                        width: isMainMarker ? 3 : 2,
                        backgroundColor: isNearWeight
                          ? themeColors.primary
                          : themeColors.border,
                      },
                    ]}
                  />
                </View>
              );
            })}
          </RNScrollView>
          <View style={[styles.rulerMask, styles.rulerMaskRight, { backgroundColor: themeColors.background }]} />
          <View
            style={[
              styles.weightIndicator,
              {
                backgroundColor: themeColors.primary,
                left: indicatorPosition || '50%', // Align with selected weight
              },
            ]}
          />
        </View>
      </View>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleContinue}>
          Continue
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  backButton: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.lg,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: spacing.xl,
    marginTop: spacing.xxl + spacing.sm,
    alignItems: 'center',
  },
  title: {
    marginBottom: spacing.sm,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  weightDisplay: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  weightValue: {
    marginBottom: spacing.xs,
  },
  weightUnit: {
    marginTop: spacing.xs,
  },
  rulerContainer: {
    position: 'relative',
    marginBottom: spacing.xl,
    paddingVertical: spacing.lg,
    height: 80,
    justifyContent: 'center',
  },
  rulerMask: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
    zIndex: 1,
    opacity: 0.95,
  },
  rulerMaskLeft: {
    left: 0,
  },
  rulerMaskRight: {
    right: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'flex-end',
    paddingVertical: spacing.md,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 60,
  },
  marker: {
    width: 2,
    marginBottom: spacing.xs,
  },
  markerLabel: {
    position: 'absolute',
    bottom: -22,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    width: ITEM_WIDTH,
    left: 0,
  },
  weightIndicator: {
    position: 'absolute',
    top: spacing.lg,
    width: 4,
    height: 30,
    transform: [{ translateX: -2 }],
    zIndex: 2,
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: 'transparent',
  },
});

