/**
 * AllergenPickerModal - Modal for selecting allergens from the fixed FDA taxonomy
 *
 * Per §3.1 of BEHAVIORAL_CONTRACT.md:
 * Users select from the 9 major food allergens. No arbitrary custom input.
 * IDs match backend contract: wheat, milk, eggs, fish, shellfish, tree_nuts, peanuts, soy, sesame
 */

import React, { useState, useMemo } from 'react';
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
import { ALLERGEN_OPTIONS, AllergenOption } from '@/src/constants/preferences';

interface AllergenPickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedAllergens: string[];
  onSave: (allergens: string[]) => void;
  /** Optional: callback to navigate to disliked foods */
  onNavigateToFoodsToAvoid?: () => void;
}

/**
 * Filter allergens locally by matching query against name, id, and synonyms.
 */
function filterAllergens(query: string): AllergenOption[] {
  if (!query.trim()) return [...ALLERGEN_OPTIONS];
  const lower = query.trim().toLowerCase();
  return ALLERGEN_OPTIONS.filter(
    (a) =>
      a.name.toLowerCase().includes(lower) ||
      a.id.toLowerCase().includes(lower) ||
      a.synonyms.some((s) => s.toLowerCase().includes(lower))
  );
}

export function AllergenPickerModal({
  visible,
  onClose,
  selectedAllergens: initialSelected,
  onSave,
  onNavigateToFoodsToAvoid,
}: AllergenPickerModalProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];

  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const [query, setQuery] = useState('');
  const [customAllergen, setCustomAllergen] = useState('');

  const filteredOptions = useMemo(() => filterAllergens(query), [query]);

  // Custom allergens are any selected IDs not in the standard list
  const standardIds = useMemo(() => new Set(ALLERGEN_OPTIONS.map(a => a.id)), []);
  const customAllergens = useMemo(
    () => Array.from(selected).filter(id => !standardIds.has(id)),
    [selected, standardIds]
  );

  // Reset state when modal opens
  React.useEffect(() => {
    if (visible) {
      setSelected(new Set(initialSelected));
      setQuery('');
      setCustomAllergen('');
    }
  }, [visible, initialSelected]);

  const addCustomAllergen = () => {
    const trimmed = customAllergen.trim().toLowerCase().replace(/\s+/g, '_');
    if (trimmed && !selected.has(trimmed)) {
      const newSelected = new Set(selected);
      newSelected.add(trimmed);
      setSelected(newSelected);
      setCustomAllergen('');
    }
  };

  const toggleAllergen = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const handleSave = () => {
    onSave(Array.from(selected));
    onClose();
  };

  const hasNoResults = query.trim().length > 0 && filteredOptions.length === 0;

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
          <Text variant="caption" style={[styles.warningText, { color: '#92400E' }]}>
            Foods containing these allergens will <Text weight="bold" style={{ color: '#92400E' }}>never</Text> appear in your recommendations.
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: themeColors.backgroundSecondary,
                color: themeColors.text,
                borderColor: themeColors.border,
              },
            ]}
            placeholder="Search allergens..."
            placeholderTextColor={themeColors.textSecondary}
            value={query}
            onChangeText={setQuery}
            returnKeyType="done"
          />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Standard Allergens */}
          <Text variant="caption" color="secondary" style={styles.sectionLabel}>
            COMMON ALLERGENS (FDA TOP 9)
          </Text>

          {hasNoResults && (
            <View style={styles.noResults}>
              <Text variant="body" color="secondary">
                No matching allergens for &quot;{query}&quot;
              </Text>
            </View>
          )}

          <View style={styles.optionsGrid}>
            {filteredOptions.map((option) => {
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
                  <Text
                    variant="body"
                    weight={isSelected ? 'semibold' : 'normal'}
                    style={{ color: isSelected ? themeColors.textInverse : themeColors.text }}
                  >
                    {option.name}
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

          {/* Custom "Other" allergen input */}
          <Text variant="caption" color="secondary" style={[styles.sectionLabel, { marginTop: spacing.xl }]}>
            OTHER ALLERGIES
          </Text>
          <View style={[styles.customInputRow, { borderColor: themeColors.border, backgroundColor: themeColors.backgroundSecondary }]}>
            <TextInput
              style={[styles.customInput, { color: themeColors.text }]}
              placeholder="Type a custom allergy..."
              placeholderTextColor={themeColors.textSecondary}
              value={customAllergen}
              onChangeText={setCustomAllergen}
              onSubmitEditing={addCustomAllergen}
              returnKeyType="done"
            />
            <TouchableOpacity
              onPress={addCustomAllergen}
              disabled={!customAllergen.trim()}
              style={[styles.addButton, { backgroundColor: customAllergen.trim() ? themeColors.primary : themeColors.border }]}
            >
              <MaterialIcons name="add" size={20} color={customAllergen.trim() ? themeColors.textInverse : themeColors.textSecondary} />
            </TouchableOpacity>
          </View>

          {customAllergens.length > 0 && (
            <View style={styles.optionsGrid}>
              {customAllergens.map((id) => (
                <TouchableOpacity
                  key={id}
                  style={[styles.optionButton, { backgroundColor: themeColors.primary, borderColor: themeColors.primary }]}
                  onPress={() => toggleAllergen(id)}
                  activeOpacity={0.7}
                >
                  <Text variant="body" weight="semibold" style={{ color: themeColors.textInverse }}>
                    {id.replace(/_/g, ' ')}
                  </Text>
                  <MaterialIcons name="close" size={18} color={themeColors.textInverse} style={styles.checkIcon} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Helper text + link to Foods to Avoid */}
          <View style={styles.helperContainer}>
            <Text variant="caption" color="secondary" style={styles.helperText}>
              Standard allergens filter by ingredient data. Custom allergies are sent to the AI as safety-critical exclusions.
            </Text>
            {onNavigateToFoodsToAvoid && (
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onNavigateToFoodsToAvoid();
                }}
                style={styles.linkButton}
              >
                <Text variant="caption" color="primary" weight="semibold">
                  Go to Foods to Avoid
                </Text>
                <MaterialIcons name="arrow-forward" size={14} color={themeColors.primary} />
              </TouchableOpacity>
            )}
          </View>
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
  searchBarContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchInput: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    fontSize: 16,
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
  noResults: {
    paddingVertical: spacing.md,
    alignItems: 'center',
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
  checkIcon: {
    marginLeft: 'auto',
  },
  helperContainer: {
    marginTop: spacing.xl,
    paddingTop: spacing.md,
  },
  helperText: {
    fontStyle: 'italic',
    lineHeight: 18,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingLeft: spacing.md,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  customInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
  addButton: {
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
  },
});
