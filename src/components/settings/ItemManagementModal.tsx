/**
 * ItemManagementModal - Modal for managing disliked foods / ingredients to avoid
 *
 * Features:
 * - Local search filtering of standard options (no USDA API dependency)
 * - Free-text input to add custom keywords (e.g., "cilantro", "aubergine")
 * - Keywords are matched against recipe names in recommendations (word-boundary)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { Button } from '@/src/ui/Button';
import { MaterialIcons } from '@expo/vector-icons';
import { haptics } from '@/src/utils/haptics';

export interface ItemOption {
  id: string;
  name: string;
  emoji?: string;
}

interface ItemManagementModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  selectedItems: string[]; // Array of names
  standardOptions: ItemOption[]; // Default options to show
  customItems: string[]; // User-added custom keywords
  onSave: (selectedItems: string[], customItems: string[]) => void;
  placeholder?: string;
  addButtonLabel?: string;
  isDislikedFoods?: boolean;
}

export function ItemManagementModal({
  visible,
  onClose,
  title,
  subtitle,
  selectedItems: initialSelected,
  standardOptions,
  customItems: initialCustomItems,
  onSave,
  placeholder = 'Search or type a keyword...',
  isDislikedFoods = false,
}: ItemManagementModalProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];

  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const [customItems, setCustomItems] = useState<string[]>(initialCustomItems);
  const [query, setQuery] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Local filtering of standard options
  const filteredOptions = useMemo(() => {
    if (!query.trim()) return standardOptions;
    const lower = query.trim().toLowerCase();
    return standardOptions.filter(opt => opt.name.toLowerCase().includes(lower));
  }, [query, standardOptions]);

  // Check if query matches any standard option or existing custom item
  const queryMatchesExisting = useMemo(() => {
    if (!query.trim()) return true;
    const lower = query.trim().toLowerCase();
    const matchesStandard = standardOptions.some(opt => opt.name.toLowerCase() === lower);
    const matchesCustom = customItems.some(item => item.toLowerCase() === lower);
    return matchesStandard || matchesCustom;
  }, [query, standardOptions, customItems]);

  // Filter custom items by search query
  const filteredCustomItems = useMemo(() => {
    if (!query.trim()) return customItems;
    const lower = query.toLowerCase();
    return customItems.filter(item => item.toLowerCase().includes(lower));
  }, [query, customItems]);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSelected(new Set(initialSelected));
      setCustomItems(initialCustomItems);
      setQuery('');
    }
  }, [visible, initialSelected, initialCustomItems]);

  // Track keyboard visibility
  useEffect(() => {
    const showListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );
    return () => { showListener.remove(); hideListener.remove(); };
  }, []);

  const toggleItem = (name: string) => {
    haptics.light();
    const newSelected = new Set(selected);
    if (newSelected.has(name)) {
      newSelected.delete(name);
    } else {
      newSelected.add(name);
    }
    setSelected(newSelected);
  };

  const addCustomKeyword = () => {
    const trimmed = query.trim();
    if (!trimmed || queryMatchesExisting) return;

    haptics.light();
    const newCustom = [...customItems, trimmed];
    setCustomItems(newCustom);
    const newSelected = new Set(selected);
    newSelected.add(trimmed);
    setSelected(newSelected);
    setQuery('');
  };

  const removeCustomItem = (item: string) => {
    haptics.light();
    const newSelected = new Set(selected);
    newSelected.delete(item);
    setSelected(newSelected);
    setCustomItems(customItems.filter(i => i !== item));
  };

  const handleSave = () => {
    haptics.success();
    onSave(Array.from(selected), customItems);
    onClose();
  };

  const allSelectedItems = Array.from(selected);
  const hasChanges =
    JSON.stringify(allSelectedItems.sort()) !== JSON.stringify(initialSelected.sort()) ||
    JSON.stringify(customItems.sort()) !== JSON.stringify(initialCustomItems.sort());

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: themeColors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: themeColors.border, backgroundColor: themeColors.background }]}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.headerButton}>
            <Text variant="body" color="secondary">Cancel</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text variant="h4" weight="semibold" style={styles.title} numberOfLines={1}>{title}</Text>
            {subtitle && (
              <Text variant="caption" color="secondary" style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>
            )}
          </View>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!hasChanges}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.headerButton}>
            <Text
              variant="body"
              color={hasChanges ? 'primary' : 'secondary'}
              weight={hasChanges ? 'semibold' : 'normal'}>
              Save
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search + Add Bar */}
        <View style={[styles.searchContainer, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
          <View style={styles.searchRow}>
            <View style={[styles.searchInputWrapper, { backgroundColor: themeColors.backgroundSecondary, borderColor: themeColors.border }]}>
              <MaterialIcons name="search" size={20} color={themeColors.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: themeColors.text }]}
                placeholder={placeholder}
                placeholderTextColor={themeColors.textSecondary}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={addCustomKeyword}
                returnKeyType="done"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {query.length > 0 && (
                <TouchableOpacity
                  onPress={() => { setQuery(''); Keyboard.dismiss(); }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <MaterialIcons name="close" size={20} color={themeColors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            {/* Show "Add" button when query doesn't match existing options */}
            {query.trim().length > 0 && !queryMatchesExisting && (
              <TouchableOpacity
                onPress={addCustomKeyword}
                style={[styles.addKeywordButton, { backgroundColor: themeColors.primary }]}>
                <MaterialIcons name="add" size={18} color={themeColors.textInverse} />
                <Text variant="caption" weight="semibold" style={{ color: themeColors.textInverse }}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}>

          {/* Standard Options */}
          {filteredOptions.length > 0 && (
            <View style={styles.section}>
              <Text variant="caption" color="secondary" style={styles.sectionLabel}>
                COMMON OPTIONS
              </Text>
              <View style={styles.optionsList}>
                {filteredOptions.map((item) => {
                  const isSelected = selected.has(item.name);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.optionRow,
                        {
                          backgroundColor: isSelected ? themeColors.primary + '20' : themeColors.backgroundSecondary,
                          borderColor: isSelected ? themeColors.primary : themeColors.border,
                        },
                      ]}
                      onPress={() => toggleItem(item.name)}
                      activeOpacity={0.7}>
                      <Text
                        variant="body"
                        weight={isSelected ? 'semibold' : 'normal'}
                        style={{ color: isSelected ? themeColors.primary : themeColors.text, flex: 1 }}>
                        {item.name}
                      </Text>
                      {isSelected && (
                        <MaterialIcons name="check-circle" size={20} color={themeColors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Custom Keywords */}
          {filteredCustomItems.length > 0 && (
            <View style={styles.section}>
              <Text variant="caption" color="secondary" style={styles.sectionLabel}>
                YOUR KEYWORDS
              </Text>
              <View style={styles.optionsList}>
                {filteredCustomItems.map((item) => {
                  const isSelected = selected.has(item);
                  return (
                    <View
                      key={item}
                      style={[
                        styles.optionRow,
                        {
                          backgroundColor: isSelected ? themeColors.primary + '20' : themeColors.backgroundSecondary,
                          borderColor: isSelected ? themeColors.primary : themeColors.border,
                        },
                      ]}>
                      <TouchableOpacity
                        style={styles.optionContent}
                        onPress={() => toggleItem(item)}
                        activeOpacity={0.7}>
                        <Text
                          variant="body"
                          weight={isSelected ? 'semibold' : 'normal'}
                          style={{ color: isSelected ? themeColors.primary : themeColors.text, flex: 1 }}>
                          {item}
                        </Text>
                        {isSelected && (
                          <MaterialIcons name="check-circle" size={20} color={themeColors.primary} />
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => removeCustomItem(item)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={styles.removeButton}>
                        <MaterialIcons name="delete-outline" size={20} color={themeColors.error || '#EF4444'} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Empty state */}
          {filteredOptions.length === 0 && filteredCustomItems.length === 0 && query.trim().length > 0 && (
            <View style={styles.emptyState}>
              <Text variant="body" color="secondary" style={styles.emptyText}>
                No matches for &quot;{query}&quot; — press Add to create a custom keyword
              </Text>
            </View>
          )}

          {isDislikedFoods && (
            <View style={styles.helperContainer}>
              <Text variant="caption" color="secondary" style={styles.helperText}>
                Keywords are matched against recipe names. Type any ingredient (e.g., &quot;cilantro&quot;, &quot;aubergine&quot;) and we&apos;ll avoid items containing it.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        {!isKeyboardVisible && (
          <View style={[styles.footer, { borderTopColor: themeColors.border, backgroundColor: themeColors.background }]}>
            <Button variant="primary" size="lg" fullWidth onPress={handleSave} disabled={!hasChanges}>
              Save ({selected.size} selected)
            </Button>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? spacing.xxl : spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  headerButton: { minWidth: 60, alignItems: 'flex-start' },
  headerCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', marginHorizontal: spacing.sm },
  title: { marginBottom: spacing.xxs, textAlign: 'center' },
  subtitle: { textAlign: 'center', lineHeight: 16 },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: spacing.sm },
  addKeywordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: 4,
    minHeight: 44,
  },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl },
  section: { marginBottom: spacing.xl },
  sectionLabel: { marginBottom: spacing.md, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 },
  optionsList: { gap: spacing.sm },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 52,
  },
  optionContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  removeButton: { padding: spacing.xs, marginLeft: spacing.sm },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl },
  emptyText: { marginTop: spacing.md, textAlign: 'center', paddingHorizontal: spacing.lg },
  helperContainer: { marginTop: spacing.md, paddingTop: spacing.md },
  helperText: { fontStyle: 'italic', lineHeight: 18 },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
  },
});
