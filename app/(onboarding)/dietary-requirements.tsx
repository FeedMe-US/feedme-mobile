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

type DietaryOption = 'vegan' | 'vegetarian' | 'pescatarian' | 'halal' | 'kosher' | 'none';

interface DietaryCard {
  id: DietaryOption;
  title: string;
  icon: string;
}

const dietaryOptions: DietaryCard[] = [
  { id: 'vegan', title: 'Vegan', icon: 'eco' },
  { id: 'vegetarian', title: 'Vegetarian', icon: 'eco' },
  { id: 'pescatarian', title: 'Pescatarian', icon: 'set-meal' },
  { id: 'halal', title: 'Halal', icon: 'opacity' },
  { id: 'kosher', title: 'Kosher', icon: 'opacity' },
  { id: 'none', title: 'None', icon: '' },
];

export default function DietaryRequirementsScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [selectedRequirements, setSelectedRequirements] = useState<Set<DietaryOption>>(new Set());

  const handleToggleRequirement = (requirementId: DietaryOption) => {
    const newSelection = new Set(selectedRequirements);
    if (newSelection.has(requirementId)) {
      newSelection.delete(requirementId);
    } else {
      // If "none" is selected, clear all others
      if (requirementId === 'none') {
        newSelection.clear();
        newSelection.add('none');
      } else {
        // If selecting something else, remove "none"
        newSelection.delete('none');
        newSelection.add(requirementId);
      }
    }
    setSelectedRequirements(newSelection);
  };

  const handleContinue = async () => {
    const requirements = Array.from(selectedRequirements).map(id => dietaryOptions.find(o => o.id === id)?.title || id);
    await saveOnboardingData({ dietaryRequirements: requirements });
    router.push('/(onboarding)/allergies');
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
              Do you have any dietary requirements?
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              Select all that apply
            </Text>
          </View>

          {/* Dietary Options */}
          <View style={styles.optionsContainer}>
            {dietaryOptions.map((option) => {
              const isSelected = selectedRequirements.has(option.id);
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
                  onPress={() => handleToggleRequirement(option.id)}
                  activeOpacity={0.7}>
                  {option.icon ? (
                    <MaterialIcons
                      name={option.icon as any}
                      size={24}
                      color={isSelected ? themeColors.primary : themeColors.text}
                      style={styles.icon}
                    />
                  ) : null}
                  <Text variant="body" weight="semibold" style={styles.optionTitle}>
                    {option.title}
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  optionCard: {
    width: '47%',
    padding: spacing.md,
    borderRadius: radius.lg,
    minHeight: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: spacing.xs,
  },
  optionTitle: {
    marginTop: spacing.xs,
    fontSize: 14,
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: 'transparent',
  },
});
