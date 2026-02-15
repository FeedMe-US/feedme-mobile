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

type ActivityOption = 'sedentary' | 'light' | 'moderate' | 'very';

interface ActivityCard {
  id: ActivityOption;
  title: string;
  description: string;
}

const activityOptions: ActivityCard[] = [
  {
    id: 'sedentary',
    title: 'Sedentary',
    description: 'Little to no exercise',
  },
  {
    id: 'light',
    title: 'Lightly Active',
    description: '1-3 days per week',
  },
  {
    id: 'moderate',
    title: 'Moderately Active',
    description: '3-5 days per week',
  },
  {
    id: 'very',
    title: 'Very Active',
    description: '6-7 days per week',
  },
];

export default function ActivityScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [selectedActivity, setSelectedActivity] = useState<ActivityOption | null>(null);

  const handleContinue = async () => {
    if (selectedActivity) {
      await saveOnboardingData({ activityLevel: selectedActivity });
      router.push('/(onboarding)/diet-strictness');
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
              How active are you?
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              This helps us calculate your daily calorie needs
            </Text>
          </View>

          {/* Activity Options */}
          <View style={styles.optionsContainer}>
            {activityOptions.map((option) => {
              const isSelected = selectedActivity === option.id;
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
                  onPress={() => setSelectedActivity(option.id)}
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
          disabled={!selectedActivity}
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
    marginTop: spacing.xl,
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
