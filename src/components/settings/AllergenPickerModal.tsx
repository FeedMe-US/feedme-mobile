/**
 * AllergenPickerModal - Modal for selecting allergens from standard list
 *
 * Per §3.1 of BEHAVIORAL_CONTRACT.md:
 * Users can select from FDA's top 9 major food allergens
 */

import React, { useState } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { Button } from '@/src/ui/Button';
import { MaterialIcons } from '@expo/vector-icons';
import { ALLERGEN_OPTIONS, AllergenId } from './AllergenSection';

interface AllergenPickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedAllergens: string[];
  onSave: (allergens: string[]) => void;
}

export function AllergenPickerModal({
  visible,
  onClose,
  selectedAllergens: initialSelected,
  onSave,
}: AllergenPickerModalProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];

  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const [customAllergen, setCustomAllergen] = useState('');

  // Reset state when modal opens
  React.useEffect(() => {
    if (visible) {
      setSelected(new Set(initialSelected));
      setCustomAllergen('');
    }
  }, [visible, initialSelected]);

  const toggleAllergen = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const handleAddCustom = () => {
    const trimmed = customAllergen.trim().toLowerCase();
    if (trimmed && !selected.has(trimmed)) {
      const newSelected = new Set(selected);
      newSelected.add(trimmed);
      setSelected(newSelected);
      setCustomAllergen('');
    }
  };

  const handleSave = () => {
    onSave(Array.from(selected));
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: themeColors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Text variant="body" color="primary">
              Cancel
            </Text>
          </TouchableOpacity>
          <Text variant="body" weight="semibold">
            Allergen Exclusions
          </Text>
          <TouchableOpacity onPress={handleSave}>
            <Text variant="body" color="primary" weight="semibold">
              Save
            </Text>
          </TouchableOpacity>
        </View>

        {/* Warning Banner */}
        <View style={[styles.warningBanner, { backgroundColor: '#FEF3C7' }]}>
          <MaterialIcons name="warning" size={20} color="#D97706" />
          <Text variant="caption" style={styles.warningText}>
            Foods containing these allergens will <Text weight="bold">never</Text> appear in your recommendations.
          </Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Standard Allergens */}
          <Text variant="caption" color="secondary" style={styles.sectionLabel}>
            COMMON ALLERGENS (FDA TOP 9)
          </Text>

          <View style={styles.optionsGrid}>
            {ALLERGEN_OPTIONS.map((option) => {
              const isSelected = selected.has(option.id);
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: isSelected
                        ? themeColors.primary
                        : themeColors.backgroundSecondary,
                      borderColor: isSelected ? themeColors.primary : themeColors.border,
                    },
                  ]}
                  onPress={() => toggleAllergen(option.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionEmoji}>{option.emoji}</Text>
                  <Text
                    variant="body"
                    weight={isSelected ? 'semibold' : 'normal'}
                    style={{ color: isSelected ? themeColors.textInverse : themeColors.text }}
                  >
                    {option.label}
                  </Text>
                  {isSelected && (
                    <MaterialIcons
                      name="check-circle"
                      size={18}
                      color={themeColors.textInverse}
                      style={styles.checkIcon}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Allergen Input */}
          <Text variant="caption" color="secondary" style={styles.sectionLabel}>
            OTHER ALLERGEN
          </Text>

          <View style={styles.customInputContainer}>
            <TextInput
              style={[
                styles.customInput,
                {
                  backgroundColor: themeColors.backgroundSecondary,
                  color: themeColors.text,
                  borderColor: themeColors.border,
                },
              ]}
              placeholder="Add custom allergen..."
              placeholderTextColor={themeColors.textSecondary}
              value={customAllergen}
              onChangeText={setCustomAllergen}
              onSubmitEditing={handleAddCustom}
              returnKeyType="done"
            />
            {customAllergen.trim() && (
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: themeColors.primary }]}
                onPress={handleAddCustom}
              >
                <MaterialIcons name="add" size={20} color={themeColors.textInverse} />
              </TouchableOpacity>
            )}
          </View>

          {/* Custom allergens that were added */}
          {Array.from(selected).filter(
            (id) => !ALLERGEN_OPTIONS.some((o) => o.id === id)
          ).length > 0 && (
            <View style={styles.customList}>
              <Text variant="caption" color="secondary" style={styles.sectionLabel}>
                YOUR CUSTOM ALLERGENS
              </Text>
              <View style={styles.customChips}>
                {Array.from(selected)
                  .filter((id) => !ALLERGEN_OPTIONS.some((o) => o.id === id))
                  .map((id) => (
                    <TouchableOpacity
                      key={id}
                      style={[styles.customChip, { backgroundColor: themeColors.primary }]}
                      onPress={() => toggleAllergen(id)}
                    >
                      <Text variant="body" weight="medium" style={{ color: themeColors.textInverse }}>
                        {id}
                      </Text>
                      <MaterialIcons name="close" size={16} color={themeColors.textInverse} />
                    </TouchableOpacity>
                  ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Save Button */}
        <View style={[styles.footer, { borderTopColor: themeColors.border }]}>
          <Button variant="primary" size="lg" fullWidth onPress={handleSave}>
            Save Allergens ({selected.size})
          </Button>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  warningText: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  sectionLabel: {
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionsGrid: {
    gap: spacing.sm,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  optionEmoji: {
    fontSize: 20,
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  customInputContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  customInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    fontSize: 16,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customList: {
    marginTop: spacing.lg,
  },
  customChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  customChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    gap: spacing.xs,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
  },
});
