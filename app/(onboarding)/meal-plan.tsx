import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { Button } from '@/src/ui/Button';
import { Screen } from '@/src/ui/Screen';
import { MaterialIcons } from '@expo/vector-icons';
import { saveOnboardingData } from '@/src/lib/onboardingData';

type MealPlanOption = '19-premier' | '19-regular' | '14-premier' | '14-regular' | '11-premier' | '11-regular' | '7-meals-off-campus';

interface MealPlanCard {
  id: MealPlanOption;
  title: string;
  description: string;
}

const mealPlanOptions: MealPlanCard[] = [
  {
    id: '19-premier',
    title: '19 Premier',
    description: 'All-you-care-to-eat',
  },
  {
    id: '19-regular',
    title: '19 Regular',
    description: 'Standard dining',
  },
  {
    id: '14-premier',
    title: '14 Premier',
    description: 'All-you-care-to-eat',
  },
  {
    id: '14-regular',
    title: '14 Regular',
    description: 'Standard dining',
  },
  {
    id: '11-premier',
    title: '11 Premier',
    description: 'All-you-care-to-eat',
  },
  {
    id: '11-regular',
    title: '11 Regular',
    description: 'Standard dining',
  },
  {
    id: '7-meals-off-campus',
    title: '7 Meals/Week',
    description: 'Off-campus plan',
  },
];

export default function MealPlanScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<MealPlanOption | null>(null);

  const handleContinue = async () => {
    if (selectedPlan) {
      await saveOnboardingData({ mealPlan: selectedPlan });
      router.push('/(onboarding)/dining-locations');
    }
  };

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
              Which meal plan do you have?
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              This helps us recommend the right dining halls
            </Text>
          </View>

          {/* Meal Plan Options */}
          <View style={styles.optionsContainer}>
            {mealPlanOptions.map((option, index) => {
              const isSelected = selectedPlan === option.id;
              const isLast = index === mealPlanOptions.length - 1;
              const isOddNumber = mealPlanOptions.length % 2 !== 0;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionCard,
                    isOddNumber && isLast && styles.optionCardCentered,
                    {
                      backgroundColor: themeColors.backgroundSecondary,
                      borderColor: isSelected
                        ? themeColors.primary
                        : themeColors.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => setSelectedPlan(option.id)}
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
            {/* Invisible spacer to center last item when odd number */}
            {mealPlanOptions.length % 2 !== 0 && (
              <View style={styles.optionCardSpacer} />
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
          disabled={!selectedPlan}
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
    marginBottom: spacing.lg,
    marginTop: spacing.xxl + spacing.sm,
  },
  title: {
    marginBottom: spacing.sm,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    justifyContent: 'flex-start',
  },
  optionCard: {
    width: '47%',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    minHeight: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionCardCentered: {
    marginLeft: '26.5%',
  },
  optionCardSpacer: {
    width: '47%',
  },
  optionTitle: {
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  optionDescription: {
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: 'transparent',
  },
});
