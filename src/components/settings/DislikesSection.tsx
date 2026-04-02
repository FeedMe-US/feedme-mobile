/**
 * DislikesSection - Displays and manages food dislikes (preferences)
 *
 * Per §3.1 of BEHAVIORAL_CONTRACT.md:
 * - Dislikes are PREFERENCE (taste) - soft filter, deprioritize
 * - Separate from allergens which are SAFETY (medical) - hard filter
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { MaterialIcons } from '@expo/vector-icons';

interface DislikesSectionProps {
  /** Currently disliked food names */
  dislikedFoods: string[];
  /** Callback when a food is added to dislikes */
  onAddDislike: (foodName: string) => void;
  /** Callback when a food is removed from dislikes */
  onRemoveDislike: (foodName: string) => void;
}

export function DislikesSection({
  dislikedFoods,
  onAddDislike,
  onRemoveDislike,
}: DislikesSectionProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];

  const [inputValue, setInputValue] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleAddFood = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !dislikedFoods.includes(trimmed)) {
      onAddDislike(trimmed);
      setInputValue('');
      setShowInput(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <MaterialIcons name="thumb-down" size={20} color={themeColors.textSecondary} />
        </View>
        <View style={styles.headerText}>
          <Text variant="body" weight="semibold">
            Disliked Foods
          </Text>
          <Text variant="caption" color="secondary">
            Foods you&apos;d rather skip (we&apos;ll deprioritize these)
          </Text>
        </View>
      </View>

      {/* Disliked Foods List */}
      {dislikedFoods.length > 0 && (
        <View style={styles.listContainer}>
          {dislikedFoods.map((food) => (
            <View
              key={food}
              style={[styles.listItem, { borderBottomColor: themeColors.border }]}
            >
              <Text variant="body">{food}</Text>
              <TouchableOpacity
                onPress={() => onRemoveDislike(food)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.removeButton}
              >
                <Text variant="body" color="primary">
                  Remove
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Add Food Input */}
      {showInput ? (
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: themeColors.backgroundSecondary,
                color: themeColors.text,
                borderColor: themeColors.border,
              },
            ]}
            placeholder="Enter food name..."
            placeholderTextColor={themeColors.textSecondary}
            value={inputValue}
            onChangeText={setInputValue}
            onSubmitEditing={handleAddFood}
            autoFocus
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[
              styles.addButton,
              {
                backgroundColor: inputValue.trim() ? themeColors.primary : themeColors.border,
              },
            ]}
            onPress={handleAddFood}
            disabled={!inputValue.trim()}
          >
            <MaterialIcons
              name="add"
              size={20}
              color={inputValue.trim() ? themeColors.textInverse : themeColors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setShowInput(false);
              setInputValue('');
            }}
          >
            <MaterialIcons name="close" size={20} color={themeColors.textSecondary} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.addFoodButton, { borderColor: themeColors.border }]}
          onPress={() => setShowInput(true)}
        >
          <MaterialIcons name="add" size={18} color={themeColors.primary} />
          <Text variant="body" color="primary">
            Add Disliked Food
          </Text>
        </TouchableOpacity>
      )}

      {dislikedFoods.length === 0 && !showInput && (
        <Text variant="caption" color="secondary" style={styles.emptyText}>
          No disliked foods. Tap above to add foods you&apos;d prefer to avoid.
        </Text>
      )}
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
  listContainer: {
    marginBottom: spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  removeButton: {
    paddingHorizontal: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    fontSize: 16,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addFoodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: spacing.xs,
  },
  emptyText: {
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
});
