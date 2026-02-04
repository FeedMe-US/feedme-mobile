import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView as RNScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { Button } from '@/src/ui/Button';
import { Screen } from '@/src/ui/Screen';
import { haptics } from '@/src/utils/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { saveOnboardingData } from '@/src/lib/onboardingData';

const MIN_FEET = 3;
const MAX_FEET = 8;
const MIN_INCHES = 0;
const MAX_INCHES = 11;
const DEFAULT_FEET = 5;
const DEFAULT_INCHES = 8;
const ITEM_HEIGHT = 50;

export default function HeightScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [feet, setFeet] = useState(DEFAULT_FEET);
  const [inches, setInches] = useState(DEFAULT_INCHES);
  const feetScrollRef = useRef<RNScrollView>(null);
  const inchesScrollRef = useRef<RNScrollView>(null);
  const lastFeetRef = useRef(DEFAULT_FEET);
  const lastInchesRef = useRef(DEFAULT_INCHES);

  useEffect(() => {
    // Scroll to initial values
    const feetOffset = (DEFAULT_FEET - MIN_FEET) * ITEM_HEIGHT;
    const inchesOffset = DEFAULT_INCHES * ITEM_HEIGHT;
    setTimeout(() => {
      feetScrollRef.current?.scrollTo({ y: feetOffset, animated: false });
      inchesScrollRef.current?.scrollTo({ y: inchesOffset, animated: false });
    }, 100);
  }, []);

  const handleFeetScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const newFeet = Math.round(offsetY / ITEM_HEIGHT) + MIN_FEET;
    const clampedFeet = Math.max(MIN_FEET, Math.min(MAX_FEET, newFeet));
    
    if (clampedFeet !== lastFeetRef.current) {
      lastFeetRef.current = clampedFeet;
      haptics.selection();
      setFeet(clampedFeet);
    }
  };

  const handleFeetMomentumScrollEnd = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const newFeet = Math.round(offsetY / ITEM_HEIGHT) + MIN_FEET;
    const clampedFeet = Math.max(MIN_FEET, Math.min(MAX_FEET, newFeet));
    const snapOffset = (clampedFeet - MIN_FEET) * ITEM_HEIGHT;
    
    feetScrollRef.current?.scrollTo({ y: snapOffset, animated: true });
    setFeet(clampedFeet);
  };

  const handleInchesScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const newInches = Math.round(offsetY / ITEM_HEIGHT);
    const clampedInches = Math.max(MIN_INCHES, Math.min(MAX_INCHES, newInches));
    
    if (clampedInches !== lastInchesRef.current) {
      lastInchesRef.current = clampedInches;
      haptics.selection();
      setInches(clampedInches);
    }
  };

  const handleInchesMomentumScrollEnd = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const newInches = Math.round(offsetY / ITEM_HEIGHT);
    const clampedInches = Math.max(MIN_INCHES, Math.min(MAX_INCHES, newInches));
    const snapOffset = clampedInches * ITEM_HEIGHT;
    
    inchesScrollRef.current?.scrollTo({ y: snapOffset, animated: true });
    setInches(clampedInches);
  };

  const handleContinue = async () => {
    await saveOnboardingData({ heightFeet: feet, heightInches: inches });
    router.push('/(onboarding)/weight');
  };

  // Generate feet and inches arrays
  const feetArray: number[] = [];
  for (let i = MIN_FEET; i <= MAX_FEET; i++) {
    feetArray.push(i);
  }

  const inchesArray: number[] = [];
  for (let i = MIN_INCHES; i <= MAX_INCHES; i++) {
    inchesArray.push(i);
  }

  const visibleItems = 5;
  const paddingTop = (visibleItems - 1) / 2 * ITEM_HEIGHT;
  const paddingBottom = (visibleItems - 1) / 2 * ITEM_HEIGHT;

  return (
    <Screen>
      <View style={styles.container}>
        {/* Back Button - Top Left */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>

        {/* Header with Title */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text variant="h1" weight="bold" style={styles.title} numberOfLines={1}>
              How tall are you?
            </Text>
          </View>
        </View>

        {/* Center: Scrollable Pickers */}
        <View style={styles.pickersContainer}>
          <View style={styles.pickersRow}>
            {/* Feet Picker */}
            <View style={styles.pickerWrapper}>
              <View style={[styles.selectionIndicator, { borderColor: themeColors.border }]} />
              <RNScrollView
                ref={feetScrollRef}
                style={styles.scrollView}
                contentContainerStyle={[
                  styles.scrollContent,
                  { paddingTop, paddingBottom },
                ]}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onScroll={handleFeetScroll}
                onMomentumScrollEnd={handleFeetMomentumScrollEnd}
                scrollEventThrottle={16}>
                {feetArray.map((feetOption) => {
                  const isSelected = feetOption === feet;
                  const distance = Math.abs(feetOption - feet);
                  const opacity = Math.max(0.2, 1 - distance * 0.3);
                  const scale = Math.max(0.7, 1 - distance * 0.15);
                  
                  return (
                    <View
                      key={feetOption}
                      style={[styles.pickerItem, { height: ITEM_HEIGHT }]}>
                      <Text
                        variant={isSelected ? 'h2' : 'body'}
                        weight={isSelected ? 'bold' : 'normal'}
                        style={[
                          styles.pickerText,
                          {
                            color: isSelected ? themeColors.text : themeColors.textSecondary,
                            opacity: isSelected ? 1 : opacity,
                            transform: [{ scale: isSelected ? 1 : scale }],
                          },
                        ]}>
                        {feetOption}
                      </Text>
                    </View>
                  );
                })}
              </RNScrollView>
              <LinearGradient
                colors={[
                  themeColors.background,
                  themeColors.background + '00', // Fully transparent
                ]}
                locations={[0, 1]}
                style={[styles.gradientMask, styles.gradientMaskTop]}
                pointerEvents="none"
              />
              <LinearGradient
                colors={[
                  themeColors.background + '00', // Fully transparent
                  themeColors.background,
                ]}
                locations={[0, 1]}
                style={[styles.gradientMask, styles.gradientMaskBottom]}
                pointerEvents="none"
              />
            </View>

            {/* Inches Picker */}
            <View style={styles.pickerWrapper}>
              <View style={[styles.selectionIndicator, { borderColor: themeColors.border }]} />
              <RNScrollView
                ref={inchesScrollRef}
                style={styles.scrollView}
                contentContainerStyle={[
                  styles.scrollContent,
                  { paddingTop, paddingBottom },
                ]}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onScroll={handleInchesScroll}
                onMomentumScrollEnd={handleInchesMomentumScrollEnd}
                scrollEventThrottle={16}>
                {inchesArray.map((inchesOption) => {
                  const isSelected = inchesOption === inches;
                  const distance = Math.abs(inchesOption - inches);
                  const opacity = Math.max(0.2, 1 - distance * 0.3);
                  const scale = Math.max(0.7, 1 - distance * 0.15);
                  
                  return (
                    <View
                      key={inchesOption}
                      style={[styles.pickerItem, { height: ITEM_HEIGHT }]}>
                      <Text
                        variant={isSelected ? 'h2' : 'body'}
                        weight={isSelected ? 'bold' : 'normal'}
                        style={[
                          styles.pickerText,
                          {
                            color: isSelected ? themeColors.text : themeColors.textSecondary,
                            opacity: isSelected ? 1 : opacity,
                            transform: [{ scale: isSelected ? 1 : scale }],
                          },
                        ]}>
                        {inchesOption}
                      </Text>
                    </View>
                  );
                })}
              </RNScrollView>
              <LinearGradient
                colors={[
                  themeColors.background,
                  themeColors.background + '00', // Fully transparent
                ]}
                locations={[0, 1]}
                style={[styles.gradientMask, styles.gradientMaskTop]}
                pointerEvents="none"
              />
              <LinearGradient
                colors={[
                  themeColors.background + '00', // Fully transparent
                  themeColors.background,
                ]}
                locations={[0, 1]}
                style={[styles.gradientMask, styles.gradientMaskBottom]}
                pointerEvents="none"
              />
            </View>
          </View>
        </View>

        {/* Bottom: Large Number Displays */}
        <View style={styles.numbersContainer}>
          <View style={styles.numberGroup}>
            <Text variant="h1" weight="bold" style={styles.numberValue}>
              {feet}
            </Text>
            <Text variant="body" color="secondary" style={styles.numberUnit}>
              ft
            </Text>
          </View>
          <View style={styles.numberGroup}>
            <Text variant="h1" weight="bold" style={styles.numberValue}>
              {inches}
            </Text>
            <Text variant="body" color="secondary" style={styles.numberUnit}>
              in
            </Text>
          </View>
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
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.xl,
  },
  backButton: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    width: '100%',
  },
  title: {
    textAlign: 'center',
    fontSize: 28,
    flexShrink: 1,
  },
  pickersContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  pickerWrapper: {
    width: 80,
    position: 'relative',
    alignItems: 'center',
    height: ITEM_HEIGHT * 5,
  },
  selectionIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: ITEM_HEIGHT,
    marginTop: -ITEM_HEIGHT / 2,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    zIndex: 1,
  },
  scrollView: {
    width: '100%',
    height: ITEM_HEIGHT * 5,
    zIndex: 2,
  },
  scrollContent: {
    alignItems: 'center',
  },
  pickerItem: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  pickerText: {
    textAlign: 'center',
  },
  gradientMask: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 100,
    zIndex: 3,
  },
  gradientMaskTop: {
    top: 0,
  },
  gradientMaskBottom: {
    bottom: 0,
  },
  numbersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
    marginBottom: spacing.xl,
  },
  numberGroup: {
    alignItems: 'center',
  },
  numberValue: {
    marginBottom: spacing.xs,
  },
  numberUnit: {
    marginTop: spacing.xs,
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: 'transparent',
  },
});
