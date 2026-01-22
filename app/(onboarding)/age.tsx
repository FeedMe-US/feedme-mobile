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

const MIN_AGE = 13;
const MAX_AGE = 100;
const DEFAULT_AGE = 20;
const ITEM_HEIGHT = 60;

export default function AgeScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [age, setAge] = useState(DEFAULT_AGE);
  const scrollViewRef = useRef<RNScrollView>(null);
  const lastAgeRef = useRef(DEFAULT_AGE);

  useEffect(() => {
    // Scroll to initial age
    const initialOffset = (DEFAULT_AGE - MIN_AGE) * ITEM_HEIGHT;
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: initialOffset, animated: false });
    }, 100);
  }, []);

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const newAge = Math.round(offsetY / ITEM_HEIGHT) + MIN_AGE;
    const clampedAge = Math.max(MIN_AGE, Math.min(MAX_AGE, newAge));
    
    if (clampedAge !== lastAgeRef.current) {
      lastAgeRef.current = clampedAge;
      haptics.selection();
      setAge(clampedAge);
    }
  };

  const handleMomentumScrollEnd = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const newAge = Math.round(offsetY / ITEM_HEIGHT) + MIN_AGE;
    const clampedAge = Math.max(MIN_AGE, Math.min(MAX_AGE, newAge));
    const snapOffset = (clampedAge - MIN_AGE) * ITEM_HEIGHT;
    
    scrollViewRef.current?.scrollTo({ y: snapOffset, animated: true });
    setAge(clampedAge);
  };

  const handleContinue = async () => {
    await saveOnboardingData({ age });
    router.push('/(onboarding)/height');
  };

  // Generate all ages
  const ages: number[] = [];
  for (let i = MIN_AGE; i <= MAX_AGE; i++) {
    ages.push(i);
  }

  const visibleItems = 5;
  const paddingTop = (visibleItems - 1) / 2 * ITEM_HEIGHT;
  const paddingBottom = (visibleItems - 1) / 2 * ITEM_HEIGHT;

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
            How old are you?
          </Text>
        </View>

        {/* Scrollable Age Picker */}
        <View style={styles.pickerContainer}>
          <RNScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingTop, paddingBottom },
            ]}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_HEIGHT}
            decelerationRate="fast"
            onScroll={handleScroll}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            scrollEventThrottle={16}>
            {ages.map((ageOption) => {
              const isSelected = ageOption === age;
              const distance = Math.abs(ageOption - age);
              const opacity = Math.max(0.2, 1 - distance * 0.3);
              const scale = Math.max(0.7, 1 - distance * 0.15);
              
              return (
                <View
                  key={ageOption}
                  style={[
                    styles.ageItem,
                    { height: ITEM_HEIGHT },
                  ]}>
                  <Text
                    variant={isSelected ? 'h1' : 'h3'}
                    weight={isSelected ? 'bold' : 'normal'}
                    style={[
                      styles.ageText,
                      {
                        color: isSelected 
                          ? themeColors.text 
                          : themeColors.textSecondary,
                        opacity: isSelected ? 1 : opacity,
                        transform: [{ scale: isSelected ? 1 : scale }],
                      },
                    ]}>
                    {ageOption}
                  </Text>
                </View>
              );
            })}
          </RNScrollView>
          
          {/* Clean fade masks - no grey/fog effect */}
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
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  title: {
    marginBottom: spacing.sm,
  },
  pickerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  scrollView: {
    width: '100%',
    zIndex: 2,
  },
  scrollContent: {
    alignItems: 'center',
  },
  ageItem: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  ageText: {
    textAlign: 'center',
  },
  gradientMask: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 120,
    zIndex: 3,
  },
  gradientMaskTop: {
    top: 0,
  },
  gradientMaskBottom: {
    bottom: 0,
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: 'transparent',
  },
});
