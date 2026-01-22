import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { Button } from '@/src/ui/Button';
import { Screen } from '@/src/ui/Screen';
import { MaterialIcons } from '@expo/vector-icons';
import { saveOnboardingData } from '@/src/lib/onboardingData';

const defaultIngredients = [
  'Mushrooms',
  'Cilantro',
  'Olives',
  'Spicy Food',
  'Mayonnaise',
  'Onions',
  'Pickles',
  'Blue Cheese',
  'Anchovies',
  'Tomatoes',
];

export default function IngredientsAvoidScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());
  const [searchText, setSearchText] = useState('');
  const [customIngredients, setCustomIngredients] = useState<string[]>([]);

  const handleToggleIngredient = (ingredient: string) => {
    const newSelection = new Set(selectedIngredients);
    if (newSelection.has(ingredient)) {
      newSelection.delete(ingredient);
    } else {
      newSelection.add(ingredient);
    }
    setSelectedIngredients(newSelection);
  };

  const handleAddCustomIngredient = () => {
    const trimmedText = searchText.trim();
    if (!trimmedText) return;

    // Check if ingredient already exists (case-insensitive)
    const allIngredients = [...defaultIngredients, ...customIngredients];
    const existingIngredient = allIngredients.find(
      (ing) => ing.toLowerCase() === trimmedText.toLowerCase()
    );

    if (existingIngredient) {
      // Select the existing ingredient instead of adding duplicate
      handleToggleIngredient(existingIngredient);
      setSearchText('');
    } else if (!customIngredients.includes(trimmedText)) {
      // Only add if it's truly new
      setCustomIngredients([...customIngredients, trimmedText]);
      setSelectedIngredients(new Set([...selectedIngredients, trimmedText]));
      setSearchText('');
    }
  };

  const handleContinue = async () => {
    const allSelected = Array.from(selectedIngredients);
    await saveOnboardingData({ ingredientsAvoid: allSelected });
    router.push('/(onboarding)/meal-times');
  };

  const allIngredients = [...defaultIngredients, ...customIngredients];
  const hasSelections = selectedIngredients.size > 0;

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
              Ingredients you avoid?
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              We won&apos;t show you meals with these
            </Text>
          </View>

          {/* Search Bar */}
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
              placeholder="Search and add ingredients..."
              placeholderTextColor={themeColors.textSecondary}
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleAddCustomIngredient}
              returnKeyType="done"
            />
            {searchText.trim() && (
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: themeColors.primary }]}
                onPress={handleAddCustomIngredient}>
                <Text variant="body" weight="bold" style={{ color: themeColors.textInverse }}>
                  Add
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Ingredient Options */}
          <View style={styles.optionsContainer}>
            {allIngredients.map((ingredient) => {
              const isSelected = selectedIngredients.has(ingredient);
              return (
                <TouchableOpacity
                  key={ingredient}
                  style={[
                    styles.ingredientChip,
                    {
                      backgroundColor: isSelected
                        ? themeColors.primary
                        : themeColors.backgroundSecondary,
                      borderColor: isSelected
                        ? themeColors.primary
                        : themeColors.border,
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => handleToggleIngredient(ingredient)}
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
                    {ingredient}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Button - Changes based on selection */}
      <View style={styles.buttonContainer}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleContinue}>
          {hasSelections ? 'Continue' : 'Skip'}
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
    marginBottom: spacing.xl,
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
  ingredientChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
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
