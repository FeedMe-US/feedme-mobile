/**
 * ItemManagementModal - Professional modal for managing allergens or disliked foods
 * 
 * Features:
 * - Proper keyboard handling
 * - Search functionality
 * - Add/remove items
 * - Professional UI
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
  selectedItems: string[]; // Array of IDs or names
  standardOptions: ItemOption[]; // Standard options to show
  customItems: string[]; // Custom items that were added
  onSave: (selectedItems: string[], customItems: string[]) => void; // Return both
  placeholder?: string;
  addButtonLabel?: string;
  isDislikedFoods?: boolean; // Special handling for disliked foods
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
  placeholder = 'Search or add new item...',
  addButtonLabel = 'Add',
  isDislikedFoods = false,
}: ItemManagementModalProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];

  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const [customItems, setCustomItems] = useState<string[]>(initialCustomItems);
  const [searchText, setSearchText] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSelected(new Set(initialSelected));
      setCustomItems(initialCustomItems);
      setSearchText('');
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

  // Filter options based on search
  const filteredStandardOptions = useMemo(() => {
    if (!searchText.trim()) return standardOptions;
    const searchLower = searchText.toLowerCase();
    return standardOptions.filter(
      opt => opt.name.toLowerCase().includes(searchLower) || opt.id.toLowerCase().includes(searchLower)
    );
  }, [standardOptions, searchText]);

  const filteredCustomItems = useMemo(() => {
    if (!searchText.trim()) return customItems;
    const searchLower = searchText.toLowerCase();
    return customItems.filter(item => item.toLowerCase().includes(searchLower));
  }, [customItems, searchText]);

  // Check if search has no results
  const hasNoSearchResults = searchText.trim().length > 0 && 
    filteredStandardOptions.length === 0 && 
    filteredCustomItems.length === 0;

  const toggleItem = (id: string) => {
    haptics.light();
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
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

  const handleAddFromSearch = () => {
    const trimmed = searchText.trim();
    if (!trimmed) return;

    // Check if it matches a standard option
    const matchingOption = standardOptions.find(
      opt => opt.name.toLowerCase() === trimmed.toLowerCase() || opt.id.toLowerCase() === trimmed.toLowerCase()
    );

    if (matchingOption) {
      // Select the matching standard option instead
      if (!selected.has(matchingOption.id)) {
        toggleItem(matchingOption.id);
      }
      setSearchText('');
      Keyboard.dismiss();
      return;
    }

    // Check if custom item already exists
    if (customItems.some(item => item.toLowerCase() === trimmed.toLowerCase())) {
      // Select existing custom item
      if (!selected.has(trimmed)) {
        toggleItem(trimmed);
      }
      setSearchText('');
      Keyboard.dismiss();
      return;
    }

    // Add as new custom item
    haptics.success();
    setCustomItems([...customItems, trimmed]);
    const newSelected = new Set(selected);
    newSelected.add(trimmed);
    setSelected(newSelected);
    setSearchText('');
    Keyboard.dismiss();
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
                value={searchText}
                onChangeText={setSearchText}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchText.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchText('');
                    Keyboard.dismiss();
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <MaterialIcons name="close" size={20} color={themeColors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            {hasNoSearchResults && searchText.trim().length > 0 && (
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: themeColors.primary }]}
                onPress={handleAddFromSearch}
                activeOpacity={0.8}>
                <MaterialIcons name="add" size={20} color="#FFFFFF" />
                <Text variant="body" weight="semibold" style={styles.addButtonText}>
                  Add
                </Text>
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
          {filteredStandardOptions.length > 0 && (
            <View style={styles.section}>
              <Text variant="caption" color="secondary" style={styles.sectionLabel}>
                STANDARD OPTIONS
              </Text>
              <View style={styles.optionsList}>
                {filteredStandardOptions.map((option) => {
                  const isSelected = selected.has(option.id);
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.optionRow,
                        {
                          backgroundColor: isSelected
                            ? themeColors.primary + '20'
                            : themeColors.backgroundSecondary,
                          borderColor: isSelected ? themeColors.primary : themeColors.border,
                        },
                      ]}
                      onPress={() => toggleItem(option.id)}
                      activeOpacity={0.7}>
                      {option.emoji && <Text style={styles.optionEmoji}>{option.emoji}</Text>}
                      <Text
                        variant="body"
                        weight={isSelected ? 'semibold' : 'normal'}
                        style={[styles.optionText, { color: isSelected ? themeColors.primary : themeColors.text }]}>
                        {option.name}
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

          {/* Custom Items */}
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
          {!searchText && filteredStandardOptions.length === 0 && filteredCustomItems.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons name="inbox" size={48} color={themeColors.textSecondary} />
              <Text variant="body" color="secondary" style={styles.emptyText}>
                No items yet. Search above to add items.
              </Text>
            </View>
          )}

          {/* Empty State - Search with no results */}
          {hasNoSearchResults && (
            <View style={styles.emptyState}>
              <MaterialIcons name="search-off" size={48} color={themeColors.textSecondary} />
              <Text variant="body" color="secondary" style={styles.emptyText}>
                {isDislikedFoods
                  ? `"${searchText}" not found. Tap the Add button above to include it.`
                  : `No results in our database for "${searchText}". Tap the Add button above to include it.`}
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.xs,
    minHeight: 44,
  },
  addButtonText: {
    color: '#FFFFFF',
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
  optionEmoji: {
    fontSize: 20,
    marginRight: spacing.sm,
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
