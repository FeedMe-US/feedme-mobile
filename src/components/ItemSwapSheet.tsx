/**
 * ItemSwapSheet - Bottom sheet for selecting alternative menu items
 * Used when user wants to swap an item in their recommendation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius, typography } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { haptics } from '@/src/utils/haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { mealService, MenuItem } from '@/src/services/mealService';

export interface ItemSwapSheetProps {
  visible: boolean;
  onClose: () => void;
  locationId: number;
  currentMeal: string; // meal period: breakfast, lunch, dinner
  onSelectItem: (item: MenuItem) => void;
  currentItemName?: string; // to highlight current selection
}

interface MenuSection {
  name: string;
  items: MenuItem[];
}

export function ItemSwapSheet({
  visible,
  onClose,
  locationId,
  currentMeal,
  onSelectItem,
  currentItemName,
}: ItemSwapSheetProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [allItems, setAllItems] = useState<MenuItem[]>([]);

  // Fetch menu when sheet opens
  useEffect(() => {
    if (visible && locationId) {
      loadMenu();
    }
  }, [visible, locationId, currentMeal]);

  const loadMenu = async () => {
    setLoading(true);
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const menu = await mealService.getMenu(locationId, dateStr);
      if (menu && menu.meals[currentMeal]) {
        const mealMenu = menu.meals[currentMeal];
        setSections(mealMenu.sections);
        // Flatten all items for search
        const items = mealMenu.sections.flatMap((s) => s.items);
        setAllItems(items);
      } else {
        // Fallback: no menu available
        setSections([]);
        setAllItems([]);
      }
    } catch (error) {
      console.error('Failed to load menu:', error);
      setSections([]);
      setAllItems([]);
    }
    setLoading(false);
  };

  // Filter items based on search
  const filteredItems = searchQuery.trim()
    ? allItems.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  const handleSelectItem = (item: MenuItem) => {
    haptics.success();
    onSelectItem(item);
    onClose();
    setSearchQuery('');
  };

  const renderItem = ({ item }: { item: MenuItem }) => {
    const isCurrentItem = item.name === currentItemName;

    return (
      <TouchableOpacity
        style={[
          styles.itemRow,
          { backgroundColor: themeColors.cardBackground },
          isCurrentItem && {
            borderColor: themeColors.primary,
            borderWidth: 2,
          },
        ]}
        onPress={() => handleSelectItem(item)}
        activeOpacity={0.7}>
        <View style={styles.itemInfo}>
          <Text variant="body" weight="medium" numberOfLines={1}>
            {item.name}
          </Text>
          <Text variant="caption" color="secondary">
            {item.calories} cal • {item.protein_g}g P • {item.carbs_g}g C •{' '}
            {item.fat_g}g F
          </Text>
        </View>
        {isCurrentItem && (
          <MaterialIcons
            name="check-circle"
            size={20}
            color={themeColors.primary}
          />
        )}
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = (section: MenuSection) => (
    <View
      style={[
        styles.sectionHeader,
        { backgroundColor: themeColors.backgroundSecondary },
      ]}>
      <Text variant="bodySmall" weight="semibold" color="secondary">
        {section.name.toUpperCase()}
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.container,
            { backgroundColor: themeColors.background },
          ]}>
          {/* Header */}
          <View style={styles.header}>
            <Text variant="h3" weight="bold">
              Swap Item
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons
                name="close"
                size={24}
                color={themeColors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View
            style={[
              styles.searchContainer,
              { backgroundColor: themeColors.backgroundSecondary },
            ]}>
            <MaterialIcons
              name="search"
              size={20}
              color={themeColors.textSecondary}
            />
            <TextInput
              style={[styles.searchInput, { color: themeColors.text }]}
              placeholder="Search menu items..."
              placeholderTextColor={themeColors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons
                  name="close"
                  size={18}
                  color={themeColors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={themeColors.primary} />
              <Text variant="body" color="secondary" style={{ marginTop: spacing.md }}>
                Loading menu...
              </Text>
            </View>
          ) : filteredItems ? (
            // Search results
            <FlatList
              data={filteredItems}
              keyExtractor={(item) => item.recipe_id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MaterialIcons
                    name="search-off"
                    size={48}
                    color={themeColors.textTertiary}
                  />
                  <Text variant="body" color="secondary" style={{ marginTop: spacing.md }}>
                    No items found for &quot;{searchQuery}&quot;
                  </Text>
                </View>
              }
            />
          ) : sections.length > 0 ? (
            // Grouped by section
            <FlatList
              data={sections}
              keyExtractor={(section) => section.name}
              renderItem={({ item: section }) => (
                <View>
                  {renderSectionHeader(section)}
                  {section.items.map((item) => (
                    <View key={item.recipe_id}>
                      {renderItem({ item })}
                    </View>
                  ))}
                </View>
              )}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons
                name="restaurant-menu"
                size={48}
                color={themeColors.textTertiary}
              />
              <Text variant="body" color="secondary" style={{ marginTop: spacing.md }}>
                No menu items available
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    maxHeight: '85%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    paddingVertical: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  listContent: {
    paddingBottom: spacing.xxxl,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  itemInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
});
