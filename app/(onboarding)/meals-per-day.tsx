import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius, shadows } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { Button } from '@/src/ui/Button';
import { Screen } from '@/src/ui/Screen';
import { MaterialIcons } from '@expo/vector-icons';
import { saveOnboardingData } from '@/src/lib/onboardingData';

type MealsPerDay = 2 | 3 | 4 | 5;

const mealsOptions: { count: MealsPerDay; description: string }[] = [
  { count: 2, description: 'Light eating schedule' },
  { count: 3, description: 'Classic breakfast, lunch, and dinner' },
  { count: 4, description: 'Three meals plus a snack' },
  { count: 5, description: 'Frequent smaller meals' },
];

export default function MealsPerDayScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [selectedMeals, setSelectedMeals] = useState<MealsPerDay | null>(null);

  const handleContinue = async () => {
    if (selectedMeals) {
      await saveOnboardingData({ mealsPerDay: selectedMeals });
      router.push('/(onboarding)/dietary-requirements');
    }
  };

  const selectedDescription = selectedMeals
    ? mealsOptions.find((opt) => opt.count === selectedMeals)?.description
    : null;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
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
              How many meals do you eat a day?
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              We'll distribute your nutrition goals accordingly
            </Text>
          </View>

          {/* Meals Selector */}
          <View style={styles.selectorContainer}>
            <View style={[
              styles.selectorWrapper, 
              { 
                backgroundColor: themeColors.border,
                borderColor: themeColors.border,
                borderWidth: 1,
              }
            ]}>
              {mealsOptions.map((option) => {
                const isSelected = selectedMeals === option.count;
                return (
                  <TouchableOpacity
                    key={option.count}
                    style={[
                      styles.mealOption,
                      isSelected && [
                        {
                          backgroundColor: themeColors.primary,
                          ...shadows.md,
                        },
                      ],
                    ]}
                    onPress={() => setSelectedMeals(option.count)}
                    activeOpacity={0.7}>
                    <Text
                      variant={isSelected ? 'h3' : 'body'}
                      weight={isSelected ? 'bold' : 'normal'}
                      style={{
                        color: isSelected ? themeColors.textInverse : themeColors.textSecondary,
                      }}>
                      {option.count}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedDescription && (
              <Text variant="body" color="secondary" style={styles.description}>
                {selectedDescription}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!selectedMeals}
          onPress={handleContinue}>
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
    marginTop: spacing.xxl + spacing.md,
  },
  title: {
    marginBottom: spacing.sm,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  selectorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    width: '100%',
  },
  selectorWrapper: {
    flexDirection: 'row',
    padding: spacing.xs,
    borderRadius: radius.lg,
    gap: spacing.xs,
    marginBottom: spacing.md,
    width: '100%',
    maxWidth: 400,
  },
  mealOption: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  description: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: 'transparent',
  },
});
