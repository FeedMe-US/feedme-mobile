import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, LayoutChangeEvent, PanResponder } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { Button } from '@/src/ui/Button';
import { Screen } from '@/src/ui/Screen';
import { haptics } from '@/src/utils/haptics';
import { saveOnboardingData } from '@/src/lib/onboardingData';

const NUM_STEPS = 5;

type PreferenceKey =
  | 'cuisine' // American Staples <-> World Flavors
  | 'spice' // Keep it mild <-> Actually spicy
  | 'heaviness' // Something light <-> Hearty & Filling
  | 'adventurousness' // Regulars <-> Try something new
  | 'texture'; // Smooth & Soft <-> Crunchy

type PreferenceState = Record<PreferenceKey, number>;

interface PreferenceSliderProps {
  value: number;
  onChange: (value: number) => void;
}

function PreferenceSlider({ value, onChange }: PreferenceSliderProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];

  const [sliderWidth, setSliderWidth] = useState(0);
  // Local step drives the thumb during drag, decoupled from parent state
  // to prevent the re-render feedback loop that caused jitter.
  const [localStep, setLocalStep] = useState(value);
  const [isDragging, setIsDragging] = useState(false);

  const sliderWidthRef = useRef(0);
  const containerRef = useRef<View>(null);
  // Absolute X of the container on screen — used to convert pageX to local coords.
  // We use pageX instead of locationX because locationX is relative to whichever
  // child view the touch lands on (thumb/dot), not the container, causing wild jumps.
  const containerLeftRef = useRef(0);
  const lastHapticStepRef = useRef<number>(value);
  const lastHapticTimeRef = useRef<number>(0);
  const localStepRef = useRef<number>(value);
  const isDraggingRef = useRef(false);
  // Store onChange in a ref so PanResponder is never recreated mid-gesture.
  const onChangeRef = useRef(onChange);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { sliderWidthRef.current = sliderWidth; }, [sliderWidth]);

  // Sync from parent prop when not dragging (handles external value changes)
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalStep(value);
      localStepRef.current = value;
    }
  }, [value]);

  const measureContainer = useCallback(() => {
    containerRef.current?.measureInWindow((x) => {
      if (x !== undefined) containerLeftRef.current = x;
    });
  }, []);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    if (width > 0) {
      setSliderWidth(width);
      measureContainer();
    }
  }, [measureContainer]);

  const stepPositions = useMemo(() => {
    if (sliderWidth === 0) return [];
    const thumbRadius = 10;
    const trackStart = thumbRadius;
    const trackEnd = sliderWidth - thumbRadius;
    const trackWidth = trackEnd - trackStart;
    const positions: number[] = [];
    for (let i = 0; i < NUM_STEPS; i++) {
      positions.push(trackStart + (i / (NUM_STEPS - 1)) * trackWidth);
    }
    return positions;
  }, [sliderWidth]);

  // Show localStep during drag, parent value otherwise
  const displayStep = isDragging ? localStep : value;

  const currentThumbPosition = useMemo(() => {
    if (stepPositions.length === 0) return 0;
    return stepPositions[displayStep];
  }, [stepPositions, displayStep]);

  // Pure calculation from container-relative X to nearest step.
  const getNearestStep = useCallback((x: number): number => {
    const width = sliderWidthRef.current;
    if (width === 0) return 0;
    const thumbRadius = 10;
    const trackStart = thumbRadius;
    const trackWidth = width - 2 * thumbRadius;
    const ratio = Math.max(0, Math.min(1, (x - trackStart) / trackWidth));
    return Math.round(ratio * (NUM_STEPS - 1));
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          // Re-measure in case scroll position changed since layout
          measureContainer();
          isDraggingRef.current = true;
          setIsDragging(true);
          const x = evt.nativeEvent.pageX - containerLeftRef.current;
          const step = getNearestStep(x);
          localStepRef.current = step;
          setLocalStep(step);
          // No haptic on initial touch - only during movement
        },
        onPanResponderMove: (evt) => {
          const x = evt.nativeEvent.pageX - containerLeftRef.current;
          const step = getNearestStep(x);
          if (step !== localStepRef.current) {
            localStepRef.current = step;
            setLocalStep(step);
            // Throttle haptics to prevent spam during boundary oscillation
            if (step !== lastHapticStepRef.current) {
              const now = Date.now();
              if (now - lastHapticTimeRef.current >= 80) {
                lastHapticStepRef.current = step;
                lastHapticTimeRef.current = now;
                haptics.light();
              } else {
                // Still update the ref so next step change can fire haptic
                lastHapticStepRef.current = step;
              }
            }
          }
        },
        onPanResponderRelease: () => {
          isDraggingRef.current = false;
          setIsDragging(false);
          onChangeRef.current(localStepRef.current);
        },
        onPanResponderTerminate: () => {
          isDraggingRef.current = false;
          setIsDragging(false);
          onChangeRef.current(localStepRef.current);
        },
      }),
    [getNearestStep, measureContainer]
  );

  const thumbTranslateX = currentThumbPosition - 10;

  return (
    <View
      ref={containerRef}
      style={[
        styles.sliderContainer,
        { backgroundColor: themeColors.backgroundSecondary },
      ]}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      {/* Track line — pointerEvents none so touches pass through to container */}
      <View
        pointerEvents="none"
        style={[
          styles.track,
          { backgroundColor: themeColors.border },
        ]}
      />

      {/* Step dots — pointerEvents none to prevent locationX misreporting */}
      {stepPositions.map((pos, index) => (
        <View
          key={index}
          pointerEvents="none"
          style={[
            styles.stepDot,
            {
              left: pos - 4,
              backgroundColor: index === displayStep ? themeColors.primary : themeColors.background,
              borderColor: index === displayStep ? themeColors.primary : themeColors.border,
            },
          ]}
        />
      ))}

      {/* Thumb — pointerEvents none so drags always register on the container */}
      <View
        pointerEvents="none"
        style={[
          styles.thumb,
          {
            borderColor: themeColors.primary,
            backgroundColor: themeColors.background,
            transform: [{ translateX: thumbTranslateX }],
          },
        ]}
      />
    </View>
  );
}

export default function MoodPreferencesScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [preferences, setPreferences] = useState<PreferenceState>({
    cuisine: 2,
    spice: 2,
    heaviness: 2,
    adventurousness: 2,
    texture: 2,
  });

  const handleChange = (key: PreferenceKey, value: number) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const handleContinue = async () => {
    await saveOnboardingData({
      moodPreferences: {
        cuisine: preferences.cuisine,
        spice: preferences.spice,
        heaviness: preferences.heaviness,
        adventurousness: preferences.adventurousness,
        texture: preferences.texture,
      },
    });
    router.push('/(onboarding)/dietary-requirements');
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text variant="h1" weight="bold" style={styles.title}>
              What are you in the mood for?
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              Move the sliders to set your baseline.
            </Text>
          </View>

          {/* Card container */}
          <View
            style={[
              styles.card,
              { backgroundColor: themeColors.backgroundSecondary },
            ]}
          >
            {/* American Staples / World Flavors */}
            <View style={styles.row}>
              <View style={styles.rowHeader}>
                <Text variant="body" weight="medium" style={styles.leftLabel}>
                  American Staples
                </Text>
                <Text variant="body" weight="medium" style={styles.rightLabel}>
                  World Flavors
                </Text>
              </View>
              <PreferenceSlider
                value={preferences.cuisine}
                onChange={(v) => handleChange('cuisine', v)}
              />
            </View>

            {/* Keep it mild / Actually spicy */}
            <View style={styles.row}>
              <View style={styles.rowHeader}>
                <Text variant="body" weight="medium" style={styles.leftLabel}>
                  Keep it mild
                </Text>
                <Text variant="body" weight="medium" style={styles.rightLabel}>
                  Actually spicy
                </Text>
              </View>
              <PreferenceSlider
                value={preferences.spice}
                onChange={(v) => handleChange('spice', v)}
              />
            </View>

            {/* Something light / Hearty & Filling */}
            <View style={styles.row}>
              <View style={styles.rowHeader}>
                <Text variant="body" weight="medium" style={styles.leftLabel}>
                  Something light
                </Text>
                <Text variant="body" weight="medium" style={styles.rightLabel}>
                  Hearty &amp; Filling
                </Text>
              </View>
              <PreferenceSlider
                value={preferences.heaviness}
                onChange={(v) => handleChange('heaviness', v)}
              />
            </View>

            {/* Regulars / Try something new */}
            <View style={styles.row}>
              <View style={styles.rowHeader}>
                <Text variant="body" weight="medium" style={styles.leftLabel}>
                  Regulars
                </Text>
                <Text variant="body" weight="medium" style={styles.rightLabel}>
                  Try something new
                </Text>
              </View>
              <PreferenceSlider
                value={preferences.adventurousness}
                onChange={(v) => handleChange('adventurousness', v)}
              />
            </View>

            {/* Smooth & Soft / Crunchy */}
            <View style={styles.row}>
              <View style={styles.rowHeader}>
                <Text variant="body" weight="medium" style={styles.leftLabel}>
                  Smooth &amp; Soft
                </Text>
                <Text variant="body" weight="medium" style={styles.rightLabel}>
                  Crunchy
                </Text>
              </View>
              <PreferenceSlider
                value={preferences.texture}
                onChange={(v) => handleChange('texture', v)}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleContinue}
        >
          Continue
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  backButton: {
    position: 'absolute',
    top: spacing.xl,
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
    marginBottom: spacing.lg,
    marginTop: spacing.xxl,
  },
  title: {
    marginBottom: spacing.sm,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  card: {
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  row: {
    marginBottom: spacing.md,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  leftLabel: {
    textAlign: 'left',
    flex: 1,
    fontSize: 13,
  },
  rightLabel: {
    textAlign: 'right',
    flex: 1,
    fontSize: 13,
  },
  sliderContainer: {
    height: 40,
    borderRadius: radius.lg,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 3,
    borderRadius: 1.5,
    top: 18.5,
  },
  stepDot: {
    position: 'absolute',
    top: 16, // Center of dot (16 + 4 = 20) aligns with center of track (18.5 + 1.5 = 20)
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  thumb: {
    position: 'absolute',
    top: 10, // Center of thumb (10 + 10 = 20) aligns with center of track (18.5 + 1.5 = 20)
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2.5,
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: 'transparent',
  },
});

