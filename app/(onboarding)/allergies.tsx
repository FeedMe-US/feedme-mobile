import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { Button } from '@/src/ui/Button';
import { Screen } from '@/src/ui/Screen';
import { MaterialIcons } from '@expo/vector-icons';
import { saveOnboardingData } from '@/src/lib/onboardingData';

type AllergyOption = 'peanuts' | 'tree-nuts' | 'dairy' | 'gluten' | 'shellfish' | 'soy' | 'eggs' | 'fish' | 'beef' | 'pork';

const allergyOptions: { id: AllergyOption; name: string }[] = [
  { id: 'peanuts', name: 'Peanuts' },
  { id: 'tree-nuts', name: 'Tree Nuts' },
  { id: 'dairy', name: 'Dairy' },
  { id: 'gluten', name: 'Gluten' },
  { id: 'shellfish', name: 'Shellfish' },
  { id: 'soy', name: 'Soy' },
  { id: 'eggs', name: 'Eggs' },
  { id: 'fish', name: 'Fish' },
  { id: 'beef', name: 'Beef' },
  { id: 'pork', name: 'Pork' },
];

export default function AllergiesScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [selectedAllergies, setSelectedAllergies] = useState<Set<string>>(new Set());
  const [searchText, setSearchText] = useState('');
  const [customAllergies, setCustomAllergies] = useState<string[]>([]);

  const handleToggleAllergy = (allergyId: string) => {
    const newSelection = new Set(selectedAllergies);
    if (newSelection.has(allergyId)) {
      newSelection.delete(allergyId);
    } else {
      newSelection.add(allergyId);
    }
    setSelectedAllergies(newSelection);
  };

  const handleAddCustomAllergy = () => {
    const trimmedText = searchText.trim();
    if (!trimmedText) return;

    // Check if allergy already exists (case-insensitive)
    const allAllergies = [...allergyOptions.map(a => a.name), ...customAllergies];
    const existingAllergy = allAllergies.find(
      (allergy) => allergy.toLowerCase() === trimmedText.toLowerCase()
    );

    if (existingAllergy) {
      // Select the existing allergy instead of adding duplicate
      handleToggleAllergy(existingAllergy);
      setSearchText('');
    } else if (!customAllergies.includes(trimmedText)) {
      // Only add if it's truly new
      setCustomAllergies([...customAllergies, trimmedText]);
      setSelectedAllergies(new Set([...selectedAllergies, trimmedText]));
      setSearchText('');
    }
  };

  const handleContinue = async () => {
    const allSelected = Array.from(selectedAllergies);
    await saveOnboardingData({ allergies: allSelected });
    router.push('/(onboarding)/ingredients-avoid');
  };

  const allAllergies = [
    ...allergyOptions.map(a => ({ id: a.id, name: a.name, isCustom: false })),
    ...customAllergies.map(name => ({ id: name, name, isCustom: true })),
  ];

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
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
                Any allergies?
              </Text>
              <Text variant="body" color="secondary" style={styles.subtitle}>
                We&apos;ll make sure to filter these out
              </Text>
            </View>

            {/* Search Bar - Moved to top */}
            <View style={styles.searchContainer}>
              <TextInput
                style={[
                  styles.searchInput,
                  {
                    backgroundColor: themeColors.backgroundSecondary,
                    color: themeColors.text,
                    borderColor: themeColors.border,
                  },
                ]}
                placeholder="Search and add allergies..."
                placeholderTextColor={themeColors.textSecondary}
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={handleAddCustomAllergy}
                returnKeyType="done"
              />
              {searchText.trim() && (
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: themeColors.primary }]}
                  onPress={handleAddCustomAllergy}>
                  <Text variant="body" weight="bold" style={{ color: themeColors.textInverse }}>
                    Add
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Allergy Options */}
            <View style={styles.optionsContainer}>
              {allAllergies.map((allergy) => {
                const isSelected = selectedAllergies.has(allergy.name);
                return (
                  <TouchableOpacity
                    key={allergy.id}
                    style={[
                      styles.allergyChip,
                      {
                        backgroundColor: isSelected
                          ? themeColors.text
                          : themeColors.backgroundSecondary,
                        borderColor: isSelected
                          ? themeColors.text
                          : themeColors.border,
                        borderWidth: 1,
                      },
                    ]}
                    onPress={() => handleToggleAllergy(allergy.name)}
                    activeOpacity={0.7}>
                    <Text
                      variant="body"
                      weight={isSelected ? 'semibold' : 'normal'}
                      style={[
                        styles.chipText,
                        {
                          color: isSelected ? themeColors.textInverse : themeColors.text,
                        },
                      ]}>
                      {allergy.name}
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
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
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
  searchContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    fontSize: 16,
  },
  addButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    justifyContent: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  allergyChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    minWidth: 100,
    alignItems: 'center',
  },
  chipText: {
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: 'transparent',
  },
});
