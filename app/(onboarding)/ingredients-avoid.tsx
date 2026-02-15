import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { Button } from '@/src/ui/Button';
import { Screen } from '@/src/ui/Screen';
import { MaterialIcons } from '@expo/vector-icons';
import { saveOnboardingData } from '@/src/lib/onboardingData';
import { DISLIKED_FOOD_OPTIONS } from '@/src/constants/preferences';
import { useItemSearch } from '@/src/hooks/useItemSearch';

export default function IngredientsAvoidScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());

  const { query, setQuery, results, isLoading, hasNoResults, error } = useItemSearch({
    defaults: DISLIKED_FOOD_OPTIONS,
    debounceMs: 300,
  });

  const handleToggleIngredient = (name: string) => {
    const newSelection = new Set(selectedIngredients);
    if (newSelection.has(name)) {
      newSelection.delete(name);
    } else {
      newSelection.add(name);
    }
    setSelectedIngredients(newSelection);
  };

  const handleSelectFromSearch = (item: { id: string; name: string }) => {
    const newSelection = new Set(selectedIngredients);
    newSelection.add(item.name);
    setSelectedIngredients(newSelection);
    setQuery('');
  };

  const handleContinue = async () => {
    const allSelected = Array.from(selectedIngredients);
    await saveOnboardingData({ ingredientsAvoid: allSelected });
    router.push('/(onboarding)/dining-locations');
  };

  const hasSelections = selectedIngredients.size > 0;

  // Build display list: selected items that aren't in current results + current results
  const selectedArray = Array.from(selectedIngredients);
  const resultNames = new Set(results.map(r => r.name));
  const extraSelected = selectedArray
    .filter(name => !resultNames.has(name))
    .map(name => ({ id: name, name, isSelected: true }));

  const displayItems = [
    ...extraSelected,
    ...results.map(r => ({ id: r.id, name: r.name, isSelected: selectedIngredients.has(r.name) })),
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
              placeholder="Search foods..."
              placeholderTextColor={themeColors.textSecondary}
              value={query}
              onChangeText={setQuery}
              returnKeyType="done"
            />
            {isLoading && (
              <View style={styles.loadingIndicator}>
                <ActivityIndicator size="small" color={themeColors.primary} />
              </View>
            )}
          </View>

          {/* Error State */}
          {error && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="cloud-off" size={20} color={themeColors.textSecondary} />
              <Text variant="caption" color="secondary" style={styles.errorText}>
                {error}
              </Text>
            </View>
          )}

          {/* No Results (backend returned 0 — no free-text add allowed) */}
          {hasNoResults && (
            <View style={styles.noResults}>
              <Text variant="body" color="secondary">
                No matches found for &quot;{query}&quot;
              </Text>
            </View>
          )}

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
                onPress={() => {
                  if (item.isSelected) {
                    handleToggleIngredient(item.name);
                  } else {
                    handleSelectFromSearch(item);
                  }
                }}
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
  loadingIndicator: {
    position: 'absolute',
    right: spacing.lg,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    flex: 1,
  },
  noResults: {
    paddingVertical: spacing.md,
    alignItems: 'center',
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
