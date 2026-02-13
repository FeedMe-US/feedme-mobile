/**
 * ItemManagementModal - Modal for managing allergens or disliked foods
 *
 * Features:
 * - Backend-powered search via useItemSearch hook
 * - Debounced API queries with loading states
 * - Deduplication of suggestions
 * - No arbitrary custom items — only backend-matched or default items
 * - Error state surfaced (no silent fallback to local data)
 * - No free-text add when backend returns 0 results
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
  ActivityIndicator,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { Button } from '@/src/ui/Button';
import { MaterialIcons } from '@expo/vector-icons';
import { haptics } from '@/src/utils/haptics';
import { useItemSearch, SearchItem } from '@/src/hooks/useItemSearch';

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
  customItems: string[]; // Legacy custom items (displayed but no new ones can be added)
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
  placeholder = 'Search items...',
  isDislikedFoods = false,
}: ItemManagementModalProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];

  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const [customItems, setCustomItems] = useState<string[]>(initialCustomItems);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Convert standardOptions to SearchItem format for the hook
  // Memoize to prevent infinite re-render loop (unstable reference triggers useEffect)
  const defaults: SearchItem[] = useMemo(
    () => standardOptions.map(opt => ({ id: opt.id, name: opt.name })),
    [standardOptions]
  );

  const { query, setQuery, results, isLoading, hasNoResults, error } = useItemSearch({
    defaults,
    debounceMs: 300,
  });

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
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Filter custom items by search query
  const filteredCustomItems = (() => {
    if (!query.trim()) return customItems;
    const searchLower = query.toLowerCase();
    return customItems.filter(item => item.toLowerCase().includes(searchLower));
  })();

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
  const canSave = hasChanges;

  // Deduplicate: remove results whose names match custom items
  const customNamesLower = new Set(customItems.map(c => c.toLowerCase()));
  const deduplicatedResults = results.filter(r => !customNamesLower.has(r.name.toLowerCase()));

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
            <Text variant="body" color="secondary">
              Cancel
            </Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text variant="h4" weight="semibold" style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {subtitle && (
              <Text variant="caption" color="secondary" style={styles.subtitle} numberOfLines={2}>
                {subtitle}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!canSave}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.headerButton}>
            <Text
              variant="body"
              color={canSave ? 'primary' : 'secondary'}
              weight={canSave ? 'semibold' : 'normal'}>
              Save
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
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
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {isLoading && (
                <ActivityIndicator size="small" color={themeColors.primary} style={{ marginRight: spacing.xs }} />
              )}
              {query.length > 0 && !isLoading && (
                <TouchableOpacity
                  onPress={() => {
                    setQuery('');
                    Keyboard.dismiss();
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <MaterialIcons name="close" size={20} color={themeColors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}>
          {/* Error State */}
          {error && (
            <View style={styles.emptyState}>
              <MaterialIcons name="cloud-off" size={36} color={themeColors.textSecondary} />
              <Text variant="body" color="secondary" style={styles.emptyText}>
                {error}
              </Text>
            </View>
          )}

          {/* Search Results / Standard Options */}
          {!error && deduplicatedResults.length > 0 && (
            <View style={styles.section}>
              <Text variant="caption" color="secondary" style={styles.sectionLabel}>
                {query.trim() ? 'SEARCH RESULTS' : 'STANDARD OPTIONS'}
              </Text>
              <View style={styles.optionsList}>
                {deduplicatedResults.map((item) => {
                  const isSelected = selected.has(item.name);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.optionRow,
                        {
                          backgroundColor: isSelected
                            ? themeColors.primary + '20'
                            : themeColors.backgroundSecondary,
                          borderColor: isSelected ? themeColors.primary : themeColors.border,
                        },
                      ]}
                      onPress={() => toggleItem(item.name)}
                      activeOpacity={0.7}>
                      <Text
                        variant="body"
                        weight={isSelected ? 'semibold' : 'normal'}
                        style={[styles.optionText, { color: isSelected ? themeColors.primary : themeColors.text }]}>
                        {item.name}
                      </Text>
                      {isSelected && (
                        <MaterialIcons
                          name="check-circle"
                          size={20}
                          color={themeColors.primary}
                          style={styles.checkIcon}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Legacy Custom Items (previously added, still editable) */}
          {filteredCustomItems.length > 0 && (
            <View style={styles.section}>
              <Text variant="caption" color="secondary" style={styles.sectionLabel}>
                CUSTOM ITEMS
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
                          backgroundColor: isSelected
                            ? themeColors.primary + '20'
                            : themeColors.backgroundSecondary,
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
                          style={[styles.optionText, { color: isSelected ? themeColors.primary : themeColors.text }]}>
                          {item}
                        </Text>
                        {isSelected && (
                          <MaterialIcons
                            name="check-circle"
                            size={20}
                            color={themeColors.primary}
                            style={styles.checkIcon}
                          />
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

          {/* Empty State - No search */}
          {!query && !error && deduplicatedResults.length === 0 && filteredCustomItems.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons name="inbox" size={48} color={themeColors.textSecondary} />
              <Text variant="body" color="secondary" style={styles.emptyText}>
                No items yet. Search above to find items.
              </Text>
            </View>
          )}

          {/* Empty State - Search with no results */}
          {hasNoResults && filteredCustomItems.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons name="search-off" size={48} color={themeColors.textSecondary} />
              <Text variant="body" color="secondary" style={styles.emptyText}>
                No matches found for &quot;{query}&quot;
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Footer - Hide when keyboard is visible */}
        {!isKeyboardVisible && (
          <View style={[styles.footer, { borderTopColor: themeColors.border, backgroundColor: themeColors.background }]}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleSave}
              disabled={!canSave}>
              Save
            </Button>
          </View>
        )}
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
    paddingTop: Platform.OS === 'ios' ? spacing.xxl : spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  headerButton: {
    minWidth: 60,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.sm,
  },
  title: {
    marginBottom: spacing.xxs,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 16,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
  },
  optionsList: {
    gap: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 52,
  },
  optionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
  },
  checkIcon: {
    marginLeft: spacing.sm,
  },
  removeButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    marginTop: spacing.md,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
  },
});
