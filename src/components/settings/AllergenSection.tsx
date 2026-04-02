/**
 * AllergenSection - Displays and manages allergen exclusions
 *
 * Per §3.1 of BEHAVIORAL_CONTRACT.md:
 * - Allergens are SAFETY (medical) - hard filter, never recommend
 * - Separate from dislikes which are PREFERENCE (taste) - soft filter
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { MaterialIcons } from '@expo/vector-icons';

// Standard allergen options per spec (§3.1)
export const ALLERGEN_OPTIONS = [
  { id: 'wheat', label: 'Wheat/Gluten', emoji: '🌾' },
  { id: 'milk', label: 'Milk/Dairy', emoji: '🥛' },
  { id: 'eggs', label: 'Eggs', emoji: '🥚' },
  { id: 'fish', label: 'Fish', emoji: '🐟' },
  { id: 'shellfish', label: 'Shellfish', emoji: '🦐' },
  { id: 'tree_nuts', label: 'Tree Nuts', emoji: '🌰' },
  { id: 'peanuts', label: 'Peanuts', emoji: '🥜' },
  { id: 'soy', label: 'Soy', emoji: '🫘' },
  { id: 'sesame', label: 'Sesame', emoji: '🌱' },
] as const;

export type AllergenId = typeof ALLERGEN_OPTIONS[number]['id'];

interface AllergenSectionProps {
  /** Currently selected allergen IDs */
  selectedAllergens: string[];
  /** Callback when user wants to add/remove allergens */
  onPressAddAllergen: () => void;
  /** Callback to remove a specific allergen */
  onRemoveAllergen: (allergenId: string) => void;
  /** Optional: callback to navigate to the disliked foods modal */
  onNavigateToFoodsToAvoid?: () => void;
}

export function AllergenSection({
  selectedAllergens,
  onPressAddAllergen,
  onRemoveAllergen,
  onNavigateToFoodsToAvoid,
}: AllergenSectionProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];

  // Map allergen IDs to display info
  const getAllergenDisplay = (id: string) => {
    const option = ALLERGEN_OPTIONS.find((a) => a.id === id);
    if (option) {
      return { label: option.label, emoji: option.emoji };
    }
    // Custom allergen (not in standard list)
    return { label: id, emoji: '⚠️' };
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <MaterialIcons name="warning" size={20} color={themeColors.warning} />
        </View>
        <View style={styles.headerText}>
          <Text variant="body" weight="semibold">
            Allergen Exclusions
          </Text>
          <Text variant="caption" color="secondary">
            Foods we&apos;ll never recommend for your safety
          </Text>
        </View>
      </View>

      {/* Allergen Chips */}
      <View style={styles.chipsContainer}>
        {selectedAllergens.map((allergenId) => {
          const { label, emoji } = getAllergenDisplay(allergenId);
          return (
            <View
              key={allergenId}
              style={[
                styles.chip,
                { backgroundColor: '#FEE2E2' }, // Light red for allergen chips
              ]}
            >
              <Text variant="body" style={styles.chipEmoji}>
                {emoji}
              </Text>
              <Text variant="body" weight="medium">
                {label}
              </Text>
              <TouchableOpacity
                onPress={() => onRemoveAllergen(allergenId)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons
                  name="close"
                  size={16}
                  color={themeColors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Add Allergen Button */}
        <TouchableOpacity
          style={[
            styles.addButton,
            { borderColor: themeColors.border, backgroundColor: themeColors.backgroundSecondary },
          ]}
          onPress={onPressAddAllergen}
        >
          <MaterialIcons name="add" size={18} color={themeColors.primary} />
          <Text variant="body" color="primary" weight="medium">
            Add Allergen
          </Text>
        </TouchableOpacity>
      </View>

      {selectedAllergens.length === 0 && (
        <Text variant="caption" color="secondary" style={styles.emptyText}>
          No allergens selected. Tap &quot;Add Allergen&quot; to add any food allergies.
        </Text>
      )}

      {/* Helper text + link */}
      <View style={styles.helperContainer}>
        <Text variant="caption" color="secondary" style={styles.helperText}>
          For other sensitivities (e.g., beetroot), add them under Foods to Avoid.
        </Text>
        {onNavigateToFoodsToAvoid && (
          <TouchableOpacity onPress={onNavigateToFoodsToAvoid} style={styles.linkButton}>
            <Text variant="caption" color="primary" weight="semibold">
              Go to Foods to Avoid
            </Text>
            <MaterialIcons name="arrow-forward" size={14} color={themeColors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  headerText: {
    flex: 1,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    gap: spacing.xs,
  },
  chipEmoji: {
    fontSize: 14,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: spacing.xs,
  },
  emptyText: {
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  helperContainer: {
    marginTop: spacing.md,
  },
  helperText: {
    fontStyle: 'italic',
    lineHeight: 18,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
  },
});
