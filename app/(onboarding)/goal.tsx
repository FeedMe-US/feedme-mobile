import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { Button } from '@/src/ui/Button';
import { Screen } from '@/src/ui/Screen';
import { saveOnboardingData } from '@/src/lib/onboardingData';

type GoalOption = 'lean_muscle' | 'cut' | 'maintain' | 'bulk';

interface GoalCard {
  id: GoalOption;
  title: string;
  description: string;
}

const goalOptions: GoalCard[] = [
  {
    id: 'lean_muscle',
    title: 'Lean Muscle Growth',
    description: 'Slight surplus with high protein for lean gains',
  },
  {
    id: 'cut',
    title: 'Cut',
    description: 'Lose fat while maintaining muscle',
  },
  {
    id: 'maintain',
    title: 'Maintain',
    description: 'Stay at your current weight',
  },
  {
    id: 'bulk',
    title: 'Bulk',
    description: 'Maximize muscle and strength gains',
  },
];

export default function GoalScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [selectedGoal, setSelectedGoal] = useState<GoalOption | null>(null);

  const handleContinue = async () => {
    if (selectedGoal) {
      await saveOnboardingData({ goal: selectedGoal });
      router.push('/(onboarding)/mood-preferences');
    }
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Back Button - Hidden on first screen */}
          
          {/* Header */}
          <View style={styles.header}>
            <Text variant="h1" weight="bold" style={styles.title}>
              What&apos;s your current goal?
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              Choose the goal that best fits your nutrition needs
            </Text>
          </View>

          {/* Goal Options */}
          <View style={styles.optionsContainer}>
            {goalOptions.map((option) => {
              const isSelected = selectedGoal === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: themeColors.backgroundSecondary,
                      borderColor: isSelected
                        ? themeColors.primary
                        : themeColors.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => setSelectedGoal(option.id)}
                  activeOpacity={0.7}>
                  <Text variant="h4" weight="bold" style={styles.optionTitle}>
                    {option.title}
                  </Text>
                  <Text variant="body" color="secondary" style={styles.optionDescription}>
                    {option.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!selectedGoal}
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
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    marginBottom: spacing.sm,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  optionsContainer: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  optionCard: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    minHeight: 65,
    justifyContent: 'center',
  },
  optionTitle: {
    marginBottom: spacing.xs,
  },
  optionDescription: {
    marginTop: spacing.xs,
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: 'transparent',
  },
});
