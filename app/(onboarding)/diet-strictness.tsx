import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { Button } from '@/src/ui/Button';
import { Screen } from '@/src/ui/Screen';
import { saveOnboardingData } from '@/src/lib/onboardingData';

type DietStrictness = 'strict' | 'balanced' | 'relaxed';

interface StrictnessOption {
  id: DietStrictness;
  title: string;
  description: string;
}

const strictnessOptions: StrictnessOption[] = [
  {
    id: 'strict',
    title: 'Strict',
    description: 'More priority on health, less on taste.',
  },
  {
    id: 'balanced',
    title: 'Balanced',
    description: 'Equal balance between enjoying food and eating well.',
  },
  {
    id: 'relaxed',
    title: 'Relaxed',
    description: 'Prioritize taste while still avoiding overeating.',
  },
];

export default function DietStrictnessScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [selected, setSelected] = useState<DietStrictness | null>(null);

  const handleContinue = async () => {
    if (!selected) return;
    await saveOnboardingData({ dietStrictness: selected });
    router.push('/(onboarding)/complete');
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
              How strict are you about your diet?
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              We&apos;ll use this to balance health and taste in your recommendations.
            </Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {strictnessOptions.map((option) => {
              const isSelected = selected === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: themeColors.backgroundSecondary,
                      borderColor: isSelected ? themeColors.primary : themeColors.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => setSelected(option.id)}
                  activeOpacity={0.7}
                >
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
          disabled={!selected}
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
  optionsContainer: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  optionCard: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    minHeight: 62,
    justifyContent: 'center',
  },
  optionTitle: {
    marginBottom: spacing.xs / 2,
    fontSize: 17,
  },
  optionDescription: {
    marginTop: spacing.xs / 2,
    fontSize: 14,
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: 'transparent',
  },
});

