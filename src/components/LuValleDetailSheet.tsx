/**
 * LuValleDetailSheet - Bottom sheet modal for LuValle Commons
 * Shows all LuValle sub-locations as tabs, with menus from each restaurant.
 *
 * LuValle Commons contains multiple restaurants:
 * - Fusion
 * - All Rise Pizza
 * - Epazote
 * - Burger Assemble
 * - Northern Lights Poke
 * - Northern Lights Panini
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { Chip } from '@/src/components/Chip';
import { DiningHall, MenuItem, MenuSection, mealService } from '@/src/services/mealService';
import { MenuItemDetailModal } from './MenuItemDetailModal';
import { useDailyTracking } from '@/src/store/DailyTrackingContext';
import { haptics } from '@/src/utils/haptics';
import { getPacificDateString } from '@/src/utils/dateUtils';
import { PlateItem } from './DiningHallDetailSheet';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface LuValleDetailSheetProps {
  visible: boolean;
  locations: DiningHall[];
  onClose: () => void;
}

// Use the shared Pacific time utility for consistent date handling
const getTodayDate = getPacificDateString;

// Get short name for LuValle sub-location
function getShortName(name: string): string {
  // Extract the part after "LuValle:" or just use the name
  const match = name.match(/LuValle:\s*(.+)/i);
  return match ? match[1].trim() : name;
}

export function LuValleDetailSheet({
  visible,
  locations,
  onClose,
}: LuValleDetailSheetProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];
  const { addMeal } = useDailyTracking();

  const [selectedLocation, setSelectedLocation] = useState<DiningHall | null>(null);
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [itemModalVisible, setItemModalVisible] = useState(false);

  // Plate building state
  const [plate, setPlate] = useState<PlateItem[]>([]);

  // Calculate plate totals
  const plateTotals = useMemo(() => {
    return plate.reduce(
      (acc, { item, quantity }) => ({
        calories: acc.calories + item.calories * quantity,
        protein: acc.protein + item.protein_g * quantity,
        carbs: acc.carbs + item.carbs_g * quantity,
        fat: acc.fat + item.fat_g * quantity,
        itemCount: acc.itemCount + quantity,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, itemCount: 0 }
    );
  }, [plate]);

  // Sort locations: open first, then by name
  const sortedLocations = useMemo(() => {
    return [...locations].sort((a, b) => {
      if (a.is_open_now && !b.is_open_now) return -1;
      if (!a.is_open_now && b.is_open_now) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [locations]);

  // Check if any location is open
  const anyOpen = useMemo(() => {
    return locations.some(l => l.is_open_now);
  }, [locations]);

  // Reset state when sheet opens
  useEffect(() => {
    if (visible && sortedLocations.length > 0) {
      // Default to first open location, or first location if all closed
      const firstOpen = sortedLocations.find(l => l.is_open_now);
      setSelectedLocation(firstOpen ?? sortedLocations[0]);
      setSections([]);
      setError(null);
      setPlate([]);
    }
  }, [visible, sortedLocations]);

  // Fetch menu when selected location changes
  useEffect(() => {
    if (visible && selectedLocation) {
      loadMenu();
    }
  }, [visible, selectedLocation]);

  const loadMenu = async () => {
    if (!selectedLocation) return;

    setLoading(true);
    setError(null);

    try {
      const today = getTodayDate();
      const menu = await mealService.getMenu(selectedLocation.id, today);

      // ASUCLA locations are all-day, so we combine all meals
      if (menu) {
        const allSections: MenuSection[] = [];
        const mealTypes = ['breakfast', 'lunch', 'dinner', 'late_night'] as const;

        for (const mealType of mealTypes) {
          if (menu.meals[mealType]?.sections) {
            allSections.push(...menu.meals[mealType].sections);
          }
        }

        // Deduplicate sections by name
        const uniqueSections = allSections.reduce((acc, section) => {
          const existing = acc.find(s => s.name === section.name);
          if (existing) {
            // Merge items
            existing.items = [...existing.items, ...section.items];
          } else {
            acc.push({ ...section, items: [...section.items] });
          }
          return acc;
        }, [] as MenuSection[]);

        setSections(uniqueSections);
      } else {
        setSections([]);
        setError('No menu available');
      }
    } catch (err) {
      console.error('Failed to load menu:', err);
      setSections([]);
      setError('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (location: DiningHall) => {
    haptics.selection();
    setSelectedLocation(location);
  };

  const handleItemPress = (item: MenuItem) => {
    haptics.light();
    setSelectedItem(item);
    setItemModalVisible(true);
  };

  // Add item to plate or increment quantity
  const handleAddToPlate = (item: MenuItem) => {
    haptics.light();
    setPlate((prev) => {
      const existing = prev.find((p) => p.item.recipe_id === item.recipe_id);
      if (existing) {
        return prev.map((p) =>
          p.item.recipe_id === item.recipe_id
            ? { ...p, quantity: p.quantity + 1 }
            : p
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  // Remove item from plate or decrement quantity
  const handleRemoveFromPlate = (item: MenuItem) => {
    haptics.light();
    setPlate((prev) => {
      const existing = prev.find((p) => p.item.recipe_id === item.recipe_id);
      if (!existing) return prev;

      if (existing.quantity <= 1) {
        return prev.filter((p) => p.item.recipe_id !== item.recipe_id);
      }
      return prev.map((p) =>
        p.item.recipe_id === item.recipe_id
          ? { ...p, quantity: p.quantity - 1 }
          : p
      );
    });
  };

  // Get quantity of item on plate
  const getItemQuantity = (item: MenuItem): number => {
    return plate.find((p) => p.item.recipe_id === item.recipe_id)?.quantity ?? 0;
  };

  // Log entire plate
  const handleLogPlate = () => {
    if (plate.length === 0) return;

    haptics.success();

    // Log each plate item with its quantity
    plate.forEach(({ item, quantity }) => {
      addMeal({
        name: item.name,
        mealType: 'lunch', // LuValle is primarily a lunch destination
        calories: Math.round(item.calories * quantity),
        protein: Math.round(item.protein_g * quantity),
        carbs: Math.round(item.carbs_g * quantity),
        fats: Math.round(item.fat_g * quantity),
        quantity,
      });
    });

    // Clear plate and close
    setPlate([]);
    onClose();
  };

  // Clear entire plate
  const handleClearPlate = () => {
    haptics.light();
    setPlate([]);
  };

  const handleLogItem = (item: MenuItem) => {
    // When logging from detail modal, add to plate instead of logging directly
    handleAddToPlate(item);
    setItemModalVisible(false);
  };

  if (locations.length === 0) return null;

  const renderMenuItem = (item: MenuItem, index: number) => {
    const quantity = getItemQuantity(item);

    return (
      <View
        key={`${item.recipe_id}-${index}`}
        style={[styles.menuItem, { borderBottomColor: themeColors.border }]}
      >
        {/* Item info (tappable for details) */}
        <TouchableOpacity
          style={styles.menuItemContent}
          onPress={() => handleItemPress(item)}
          activeOpacity={0.7}
        >
          <Text variant="body" weight="medium" numberOfLines={1} style={styles.itemName}>
            {item.name}
          </Text>
          <View style={styles.macrosRow}>
            <Text variant="caption" color="secondary">
              {Math.round(item.calories)} cal
            </Text>
            <View style={styles.macros}>
              <Text variant="caption" style={{ color: themeColors.protein }}>
                P: {Math.round(item.protein_g)}g
              </Text>
              <Text variant="caption" style={{ color: themeColors.carbs }}>
                C: {Math.round(item.carbs_g)}g
              </Text>
              <Text variant="caption" style={{ color: themeColors.fats }}>
                F: {Math.round(item.fat_g)}g
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Quantity controls */}
        <View style={styles.quantityControls}>
          {quantity > 0 && (
            <>
              <TouchableOpacity
                style={[styles.quantityButton, { backgroundColor: themeColors.error + '20' }]}
                onPress={() => handleRemoveFromPlate(item)}
              >
                <Text variant="body" weight="bold" style={{ color: themeColors.error }}>
                  −
                </Text>
              </TouchableOpacity>
              <Text variant="body" weight="semibold" style={styles.quantityText}>
                {quantity}
              </Text>
            </>
          )}
          <TouchableOpacity
            style={[styles.quantityButton, { backgroundColor: themeColors.success + '20' }]}
            onPress={() => handleAddToPlate(item)}
          >
            <Text variant="body" weight="bold" style={{ color: themeColors.success }}>
              +
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.container,
                  { backgroundColor: themeColors.background },
                ]}
              >
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.handle} />
                  <View style={styles.headerContent}>
                    <View style={styles.headerLeft}>
                      <Text variant="h3" weight="bold" numberOfLines={1} style={styles.hallName}>
                        LuValle Commons
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: anyOpen
                              ? themeColors.success + '30'
                              : themeColors.error + '30',
                          },
                        ]}
                      >
                        <Text
                          variant="caption"
                          style={{
                            color: anyOpen
                              ? themeColors.success
                              : themeColors.error,
                          }}
                        >
                          {anyOpen ? 'Open' : 'Closed'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                      <Text variant="h4" color="secondary">
                        X
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Plate Display (shows when items added) */}
                {plate.length > 0 && (
                  <View style={[styles.plateSection, { backgroundColor: themeColors.cardBackground }]}>
                    <View style={styles.plateHeader}>
                      <Text variant="label" weight="semibold">
                        Your Plate ({plateTotals.itemCount} {plateTotals.itemCount === 1 ? 'item' : 'items'})
                      </Text>
                      <TouchableOpacity onPress={handleClearPlate}>
                        <Text variant="caption" color="error">Clear</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.plateTotals}>
                      <View style={styles.plateTotalItem}>
                        <Text variant="h4" weight="bold" color="calories">
                          {Math.round(plateTotals.calories)}
                        </Text>
                        <Text variant="caption" color="secondary">cal</Text>
                      </View>
                      <View style={styles.plateTotalItem}>
                        <Text variant="body" weight="semibold" style={{ color: themeColors.protein }}>
                          {Math.round(plateTotals.protein)}g
                        </Text>
                        <Text variant="caption" color="secondary">protein</Text>
                      </View>
                      <View style={styles.plateTotalItem}>
                        <Text variant="body" weight="semibold" style={{ color: themeColors.carbs }}>
                          {Math.round(plateTotals.carbs)}g
                        </Text>
                        <Text variant="caption" color="secondary">carbs</Text>
                      </View>
                      <View style={styles.plateTotalItem}>
                        <Text variant="body" weight="semibold" style={{ color: themeColors.fats }}>
                          {Math.round(plateTotals.fat)}g
                        </Text>
                        <Text variant="caption" color="secondary">fat</Text>
                      </View>
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.plateItemsScroll}
                    >
                      {plate.map(({ item, quantity }) => (
                        <View key={item.recipe_id} style={[styles.plateItemChip, { backgroundColor: themeColors.background }]}>
                          <Text variant="caption" numberOfLines={1} style={styles.plateItemName}>
                            {item.name}
                          </Text>
                          {quantity > 1 && (
                            <Text variant="caption" color="secondary"> x{quantity}</Text>
                          )}
                        </View>
                      ))}
                    </ScrollView>
                    <TouchableOpacity
                      style={[styles.logPlateButton, { backgroundColor: themeColors.success }]}
                      onPress={handleLogPlate}
                    >
                      <Text variant="body" weight="semibold" style={{ color: themeColors.textInverse }}>
                        Log This Plate
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Location Selector (tabs for sub-locations) */}
                <View style={styles.locationSelector}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.locationSelectorContent}
                  >
                    {sortedLocations.map((location) => (
                      <View
                        key={location.id}
                        style={!location.is_open_now ? { opacity: 0.6 } : undefined}
                      >
                        <Chip
                          label={getShortName(location.name)}
                          selected={selectedLocation?.id === location.id}
                          onPress={() => handleLocationChange(location)}
                          style={styles.locationChip}
                        />
                      </View>
                    ))}
                  </ScrollView>
                </View>

                {/* Menu Content */}
                <ScrollView
                  style={styles.menuScroll}
                  contentContainerStyle={styles.menuContent}
                  showsVerticalScrollIndicator={false}
                >
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color={themeColors.primary} />
                      <Text variant="body" color="secondary" style={styles.loadingText}>
                        Loading menu...
                      </Text>
                    </View>
                  ) : error ? (
                    <View style={styles.emptyContainer}>
                      <Text variant="body" color="secondary">
                        {error}
                      </Text>
                    </View>
                  ) : sections.length > 0 ? (
                    sections.map((section, sectionIndex) => (
                      <View key={`${section.name}-${sectionIndex}`} style={styles.menuSection}>
                        <Text variant="label" color="secondary" style={styles.sectionName}>
                          {section.name}
                        </Text>
                        {section.items.map((item, itemIndex) =>
                          renderMenuItem(item, itemIndex)
                        )}
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Text variant="body" color="secondary">
                        No menu available
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Menu Item Detail Modal */}
      <MenuItemDetailModal
        visible={itemModalVisible}
        item={selectedItem}
        onClose={() => setItemModalVisible(false)}
        onLog={handleLogItem}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    height: SCREEN_HEIGHT * 0.75,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.3)',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#808080',
    borderRadius: 2,
    marginBottom: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  hallName: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
  },
  closeButton: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
  locationSelector: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.3)',
  },
  locationSelectorContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  locationChip: {
    marginRight: spacing.xs,
  },
  menuScroll: {
    flex: 1,
  },
  menuContent: {
    paddingBottom: spacing.xxxl,
  },
  menuSection: {
    paddingTop: spacing.sm,
  },
  sectionName: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuItemContent: {
    flex: 1,
  },
  itemName: {
    marginBottom: spacing.xxs,
  },
  macrosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  macros: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  loadingContainer: {
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
  },
  emptyContainer: {
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  // Quantity controls for plate building
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginLeft: spacing.sm,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    minWidth: 20,
    textAlign: 'center',
  },
  // Plate display section
  plateSection: {
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.lg,
  },
  plateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  plateTotals: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  plateTotalItem: {
    alignItems: 'center',
  },
  plateItemsScroll: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  plateItemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    maxWidth: 150,
  },
  plateItemName: {
    flexShrink: 1,
  },
  logPlateButton: {
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
});
