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
const DEFAULT_WEIGHT = 165;
const DEFAULT_GOAL_WEIGHT = 170;
const STEP = 1;
const ITEM_WIDTH = 40;

export default function WeightScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [weight, setWeight] = useState(DEFAULT_WEIGHT);
  const [goalWeight, setGoalWeight] = useState(DEFAULT_GOAL_WEIGHT);
  const [indicatorPos1, setIndicatorPos1] = useState(0);
  const [indicatorPos2, setIndicatorPos2] = useState(0);

  const scrollRef1 = useRef<RNScrollView>(null);
  const scrollRef2 = useRef<RNScrollView>(null);
  const lastWeight1 = useRef(DEFAULT_WEIGHT);
  const lastWeight2 = useRef(DEFAULT_GOAL_WEIGHT);

  useEffect(() => {
    const loadData = async () => {
      const data = await getOnboardingData();

      // Restore current weight if previously saved (e.g. user navigated back)
      const savedWeight = data.weight || DEFAULT_WEIGHT;
      setWeight(savedWeight);
      lastWeight1.current = savedWeight;

      // Compute goal weight: restore saved value, or smart default from goal
      let defaultGoal: number;
      if (data.goalWeight) {
        defaultGoal = data.goalWeight;
      } else {
        defaultGoal = savedWeight;
        if (data.goal === 'bulk') defaultGoal = savedWeight + 10;
        else if (data.goal === 'cut') defaultGoal = savedWeight - 6;
        else if (data.goal === 'lean_muscle') defaultGoal = savedWeight + 4;
        // Legacy keys
        else if (data.goal === 'lean') defaultGoal = savedWeight - 6;
        else if (data.goal === 'perform') defaultGoal = savedWeight + 4;
      }
      defaultGoal = Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, defaultGoal));
      setGoalWeight(defaultGoal);
      lastWeight2.current = defaultGoal;

      setTimeout(() => {
        scrollRef1.current?.scrollTo({ x: (savedWeight - MIN_WEIGHT) * ITEM_WIDTH, animated: false });
        scrollRef2.current?.scrollTo({ x: (defaultGoal - MIN_WEIGHT) * ITEM_WIDTH, animated: false });
      }, 100);
    };
    loadData();
  }, []);

  const makeScrollHandler = (
    setValue: (v: number) => void,
    setIndicator: (v: number) => void,
    lastRef: React.RefObject<number>,
  ) => {
    const onScroll = (event: any) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const newW = Math.round(offsetX / ITEM_WIDTH) + MIN_WEIGHT;
      const clamped = Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, newW));

      const sw = Dimensions.get('window').width;
      const vis = Math.floor(sw / ITEM_WIDTH);
      const pad = ((vis - 1) / 2) * ITEM_WIDTH;
      setIndicator(sw / 2 - pad + (clamped - MIN_WEIGHT) * ITEM_WIDTH);

      if (clamped !== lastRef.current) {
        lastRef.current = clamped;
        haptics.selection();
        setValue(clamped);
      }
    };

    const onMomentumEnd = (event: any, ref: React.RefObject<RNScrollView | null>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const newW = Math.round(offsetX / ITEM_WIDTH) + MIN_WEIGHT;
      const clamped = Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, newW));
      const snapOffset = (clamped - MIN_WEIGHT) * ITEM_WIDTH;

      const sw = Dimensions.get('window').width;
      const vis = Math.floor(sw / ITEM_WIDTH);
      const pad = ((vis - 1) / 2) * ITEM_WIDTH;
      setIndicator(sw / 2 - pad + snapOffset);

      ref.current?.scrollTo({ x: snapOffset, animated: true });
      setValue(clamped);
    };

    return { onScroll, onMomentumEnd };
  };

  const handler1 = makeScrollHandler(setWeight, setIndicatorPos1, lastWeight1);
  const handler2 = makeScrollHandler(setGoalWeight, setIndicatorPos2, lastWeight2);

  const handleContinue = async () => {
    // Auto-determine goal type from weight difference
    let suggestedGoal: 'lean_muscle' | 'cut' | 'maintain' | 'bulk' = 'maintain';
    const diff = goalWeight - weight;

    if (diff <= -2) {
      suggestedGoal = 'cut';
    } else if (diff >= -1 && diff <= 2) {
      suggestedGoal = 'maintain';
    } else if (diff >= 3 && diff <= 8) {
      suggestedGoal = 'lean_muscle';
    } else if (diff >= 9) {
      suggestedGoal = 'bulk';
    }

    await saveOnboardingData({ weight, goalWeight, goal: suggestedGoal });
    router.push('/(onboarding)/activity');
  };

  // Generate all weight values
  const weights: number[] = [];
  for (let i = MIN_WEIGHT; i <= MAX_WEIGHT; i += STEP) {
    weights.push(i);
  }

  const screenWidth = Dimensions.get('window').width;
  const visibleItems = Math.floor(screenWidth / ITEM_WIDTH);
  const padSide = ((visibleItems - 1) / 2) * ITEM_WIDTH;

  const renderRuler = (
    ref: React.RefObject<RNScrollView | null>,
    value: number,
    indicatorPos: number,
    handlers: ReturnType<typeof makeScrollHandler>,
  ) => (
    <View style={styles.rulerContainer}>
      <View style={[styles.rulerMask, styles.rulerMaskLeft, { backgroundColor: themeColors.background }]} />
      <RNScrollView
        ref={ref}
        horizontal
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingLeft: padSide, paddingRight: padSide }]}
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        onScroll={handlers.onScroll}
        onMomentumScrollEnd={(e) => handlers.onMomentumEnd(e, ref)}
        scrollEventThrottle={16}>
        {weights.map((w) => {
          const isMainMarker = w % 10 === 0;
          const isNearWeight = Math.abs(w - value) <= 2;
          return (
            <View key={w} style={[styles.markerContainer, { width: ITEM_WIDTH }]}>
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
            left: indicatorPos || '50%',
          },
        ]}
      />
    </View>
  );

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

        {/* Current Weight */}
        <View style={[styles.section, styles.firstSection]}>
          <Text variant="body" weight="semibold" color="secondary" style={styles.sectionLabel}>
            Current Weight
          </Text>
          <View style={styles.weightDisplay}>
            <Text variant="h1" weight="bold" style={styles.weightValue}>
              {weight}
            </Text>
            <Text variant="body" color="secondary" style={styles.weightUnit}>
              lbs
            </Text>
          </View>
          {renderRuler(scrollRef1, weight, indicatorPos1, handler1)}
        </View>

        {/* Goal Weight */}
        <View style={styles.section}>
          <Text variant="body" weight="semibold" color="secondary" style={styles.sectionLabel}>
            Goal Weight
          </Text>
          <View style={styles.weightDisplay}>
            <Text variant="h1" weight="bold" style={styles.weightValue}>
              {goalWeight}
            </Text>
            <Text variant="body" color="secondary" style={styles.weightUnit}>
              lbs
            </Text>
          </View>
          {renderRuler(scrollRef2, goalWeight, indicatorPos2, handler2)}
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
  firstSection: {
    marginTop: spacing.xxl + spacing.sm,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionLabel: {
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  weightDisplay: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  weightValue: {
    marginBottom: spacing.xs,
  },
  weightUnit: {
    marginTop: spacing.xs,
  },
  rulerContainer: {
    position: 'relative',
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
