import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { Button } from '@/src/ui/Button';
import { Screen } from '@/src/ui/Screen';
import { MaterialIcons } from '@expo/vector-icons';
import { saveOnboardingData } from '@/src/lib/onboardingData';
import { ALLERGEN_OPTIONS } from '@/src/constants/preferences';

/**
 * Filter allergens locally by matching query against name and synonyms.
 * No API call — allergens are a fixed taxonomy.
 */
function filterAllergens(query: string) {
  if (!query.trim()) return ALLERGEN_OPTIONS;
  const lower = query.trim().toLowerCase();
  return ALLERGEN_OPTIONS.filter(
    (a) =>
      a.name.toLowerCase().includes(lower) ||
      a.id.toLowerCase().includes(lower) ||
      a.synonyms.some((s) => s.toLowerCase().includes(lower))
  );
}

export default function AllergiesScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [selectedAllergens, setSelectedAllergens] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');

  const filteredOptions = useMemo(() => filterAllergens(query), [query]);

  const handleToggle = (id: string) => {
    const next = new Set(selectedAllergens);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedAllergens(next);
  };

  const handleContinue = async () => {
    // Store backend-contract IDs (e.g. 'wheat', 'tree_nuts')
    await saveOnboardingData({ allergies: Array.from(selectedAllergens) });
    router.push('/(onboarding)/ingredients-avoid');
  };

  // Build display: selected items not in filtered results shown first, then filtered results
  const filteredIds = new Set(filteredOptions.map((a) => a.id));
  const extraSelected = Array.from(selectedAllergens)
    .filter((id) => !filteredIds.has(id))
    .map((id) => {
      const opt = ALLERGEN_OPTIONS.find((a) => a.id === id);
      return { id, name: opt?.name ?? id, isSelected: true };
    });

  const displayItems = [
    ...extraSelected,
    ...filteredOptions.map((a) => ({ id: a.id, name: a.name, isSelected: selectedAllergens.has(a.id) })),
  ];

  const hasNoResults = query.trim().length > 0 && filteredOptions.length === 0;

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
                placeholder="Search allergies..."
                placeholderTextColor={themeColors.textSecondary}
                value={query}
                onChangeText={setQuery}
                returnKeyType="done"
              />
            </View>

            {/* No Results */}
            {hasNoResults && (
              <View style={styles.noResults}>
                <Text variant="body" color="secondary">
                  No matching allergens for &quot;{query}&quot;
                </Text>
              </View>
            )}

            {/* Allergy Options */}
            <View style={styles.optionsContainer}>
              {displayItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.allergyChip,
                    {
                      backgroundColor: item.isSelected
                        ? themeColors.text
                        : themeColors.backgroundSecondary,
                      borderColor: item.isSelected
                        ? themeColors.text
                        : themeColors.border,
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => handleToggle(item.id)}
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

            {/* Helper text + link to Foods to Avoid */}
            <View style={styles.helperContainer}>
              <Text variant="caption" color="secondary" style={styles.helperText}>
                For other sensitivities (e.g., beetroot), add them under Foods to Avoid.
              </Text>
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
  noResults: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
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
  helperContainer: {
    marginBottom: spacing.xl,
  },
  helperText: {
    fontStyle: 'italic',
    lineHeight: 18,
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: 'transparent',
  },
});
