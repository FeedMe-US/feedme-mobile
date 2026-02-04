import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, LayoutChangeEvent, PanResponder, GestureResponderEvent } from 'react-native';
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
  const [isDragging, setIsDragging] = useState(false);
  const sliderWidthRef = useRef(0);
  const containerRef = useRef<View>(null);
  const lastHapticStepRef = useRef<number>(value);
  const lastHapticTimeRef = useRef<number>(0);
  const currentValueRef = useRef<number>(value);

  // Track width and value for calculations
  useEffect(() => {
    sliderWidthRef.current = sliderWidth;
  }, [sliderWidth]);

  useEffect(() => {
    currentValueRef.current = value;
  }, [value]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    if (width > 0) {
      setSliderWidth(width);
    }
  }, []);

  // Calculate step positions (5 steps = 0, 1, 2, 3, 4)
  const stepPositions = useMemo(() => {
    if (sliderWidth === 0) return [];
    const thumbRadius = 10; // Half of thumb width
    const trackStart = thumbRadius;
    const trackEnd = sliderWidth - thumbRadius;
    const trackWidth = trackEnd - trackStart;
    const positions: number[] = [];
    for (let i = 0; i < NUM_STEPS; i++) {
      const ratio = i / (NUM_STEPS - 1);
      positions.push(trackStart + ratio * trackWidth);
    }
    return positions;
  }, [sliderWidth]);

  // Get current thumb position based on value
  const currentThumbPosition = useMemo(() => {
    if (stepPositions.length === 0) return 0;
    return stepPositions[value];
  }, [stepPositions, value]);

  const updateFromTouch = useCallback(
    (x: number) => {
      const width = sliderWidthRef.current;
      if (width === 0) return;

      const thumbRadius = 10;
      const trackStart = thumbRadius;
      const trackEnd = width - thumbRadius;

      // Calculate step positions (same as in stepPositions useMemo)
      const trackWidth = trackEnd - trackStart;
      const positions: number[] = [];
      for (let i = 0; i < NUM_STEPS; i++) {
        const ratio = i / (NUM_STEPS - 1);
        positions.push(trackStart + ratio * trackWidth);
      }

      // Allow clicks slightly outside the track for better UX
      const clampedX = Math.max(0, Math.min(width, x));

      // Find nearest step using calculated positions
      let nearestStep = 0;
      let minDistance = Infinity;

      for (let i = 0; i < NUM_STEPS; i++) {
        const distance = Math.abs(clampedX - positions[i]);
        if (distance < minDistance) {
          minDistance = distance;
          nearestStep = i;
        }
      }

      // Only update if step changed (use ref to avoid recreating this callback)
      const currentValue = currentValueRef.current;
      if (nearestStep !== currentValue) {
        onChange(nearestStep);

        // Throttle haptics to prevent buzzing - only fire if:
        // 1. Step is different from last haptic-triggered step
        // 2. At least 50ms has passed since last haptic
        const now = Date.now();
        if (nearestStep !== lastHapticStepRef.current && now - lastHapticTimeRef.current > 50) {
          lastHapticStepRef.current = nearestStep;
          lastHapticTimeRef.current = now;
          haptics.light();
        }
      }
    },
    [onChange]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt: GestureResponderEvent) => {
          setIsDragging(true);
          updateFromTouch(evt.nativeEvent.locationX);
        },
        onPanResponderMove: (evt: GestureResponderEvent) => {
          updateFromTouch(evt.nativeEvent.locationX);
        },
        onPanResponderRelease: () => {
          setIsDragging(false);
        },
        onPanResponderTerminate: () => {
          setIsDragging(false);
        },
      }),
    [updateFromTouch]
  );

  const thumbTranslateX = currentThumbPosition - 10; // Center thumb on position

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
      {/* Track line */}
      <View
        style={[
          styles.track,
          { backgroundColor: themeColors.border },
        ]}
      />

      {/* Visible step dots */}
      {stepPositions.map((pos, index) => (
        <View
          key={index}
          style={[
            styles.stepDot,
            {
              left: pos - 4,
              backgroundColor: index === value ? themeColors.primary : themeColors.background,
              borderColor: index === value ? themeColors.primary : themeColors.border,
            },
          ]}
        />
      ))}

      {/* Thumb */}
      <View
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
    router.push('/(onboarding)/diet-strictness');
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

