import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { Button } from '@/src/ui/Button';
import { Screen } from '@/src/ui/Screen';
import { MaterialIcons } from '@expo/vector-icons';
import { saveOnboardingData } from '@/src/lib/onboardingData';
import { DISLIKED_FOOD_OPTIONS } from '@/src/constants/preferences';

export default function IngredientsAvoidScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');

  // Local filtering of standard options
  const filteredOptions = useMemo(() => {
    if (!query.trim()) return DISLIKED_FOOD_OPTIONS;
    const lower = query.trim().toLowerCase();
    return DISLIKED_FOOD_OPTIONS.filter(opt => opt.name.toLowerCase().includes(lower));
  }, [query]);

  // Check if query matches any existing option or selection
  const queryIsNew = useMemo(() => {
    if (!query.trim()) return false;
    const lower = query.trim().toLowerCase();
    return !DISLIKED_FOOD_OPTIONS.some(opt => opt.name.toLowerCase() === lower)
      && !selectedIngredients.has(query.trim());
  }, [query, selectedIngredients]);

  const handleToggleIngredient = (name: string) => {
    const newSelection = new Set(selectedIngredients);
    if (newSelection.has(name)) {
      newSelection.delete(name);
    } else {
      newSelection.add(name);
    }
    setSelectedIngredients(newSelection);
  };

  const addCustomKeyword = () => {
    const trimmed = query.trim();
    if (!trimmed || !queryIsNew) return;
    const newSelection = new Set(selectedIngredients);
    newSelection.add(trimmed);
    setSelectedIngredients(newSelection);
    setQuery('');
  };

  const handleContinue = async () => {
    const allSelected = Array.from(selectedIngredients);
    await saveOnboardingData({ ingredientsAvoid: allSelected });
    router.push('/(onboarding)/dining-locations');
  };

  const hasSelections = selectedIngredients.size > 0;

  // Build display list: selected custom items (not in standard list) + standard options
  const standardNames = new Set(DISLIKED_FOOD_OPTIONS.map(o => o.name));
  const customSelected = Array.from(selectedIngredients)
    .filter(name => !standardNames.has(name))
    .map(name => ({ id: name, name, isSelected: true }));

  const displayItems = [
    ...customSelected,
    ...filteredOptions.map(o => ({ id: o.id, name: o.name, isSelected: selectedIngredients.has(o.name) })),
  ];

  return (
    <Screen>
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
              Foods to avoid?
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              We&apos;ll deprioritize meals with these ingredients
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
              placeholder="Search or type a keyword..."
              placeholderTextColor={themeColors.textSecondary}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={addCustomKeyword}
              returnKeyType="done"
            />
            {queryIsNew && (
              <TouchableOpacity
                onPress={addCustomKeyword}
                style={[styles.addButton, { backgroundColor: themeColors.primary }]}>
                <MaterialIcons name="add" size={18} color={themeColors.textInverse} />
              </TouchableOpacity>
            )}
          </View>

          {/* Ingredient Options */}
          <View style={styles.optionsContainer}>
            {displayItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.ingredientChip,
                  {
                    backgroundColor: item.isSelected
                      ? themeColors.primary
                      : themeColors.backgroundSecondary,
                    borderColor: item.isSelected
                      ? themeColors.primary
                      : themeColors.border,
                    borderWidth: 1,
                  },
                ]}
                onPress={() => handleToggleIngredient(item.name)}
                activeOpacity={0.7}>
                <Text
                  variant="body"
                  weight={item.isSelected ? 'semibold' : 'normal'}
                  style={[
                    styles.chipText,
                    {
                      color: item.isSelected ? themeColors.textInverse : themeColors.text,
                    },
                  ]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
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
    alignItems: 'center',
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
    padding: spacing.sm,
    borderRadius: radius.md,
    marginLeft: spacing.sm,
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
