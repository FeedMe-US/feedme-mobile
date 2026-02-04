/**
 * DiningHallDetailSheet - Bottom sheet modal for viewing dining hall menu
 * Opens at 75% screen height with meal period selection and menu items
 *
 * Features plate-building: tap items to see details, use +/- to add to plate,
 * view running totals at top, then log entire plate at once.
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
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { Chip } from '@/src/components/Chip';
import { DiningHall, MenuItem, MenuSection, mealService } from '@/src/services/mealService';
import { MenuItemDetailModal } from './MenuItemDetailModal';
import { useDailyTracking } from '@/src/store/DailyTrackingContext';
import { haptics } from '@/src/utils/haptics';
import {
  MealPeriod,
  getAvailableMealPeriods,
  getCurrentOrNextMealPeriod,
  isAllDayLocation,
  formatMealPeriod,
  getLocationStatus,
} from '@/src/utils/mealPeriodUtils';
import { getPacificDateString } from '@/src/utils/dateUtils';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Plate item with quantity tracking
export interface PlateItem {
  item: MenuItem;
  quantity: number;
}

export interface DiningHallDetailSheetProps {
  visible: boolean;
  hall: DiningHall | null;
  onClose: () => void;
}

// Use the shared Pacific time utility for consistent date handling
const getTodayDate = getPacificDateString;

export function DiningHallDetailSheet({
  visible,
  hall,
  onClose,
}: DiningHallDetailSheetProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];
  const { addMeal } = useDailyTracking();
  const router = useRouter();

  const [selectedPeriod, setSelectedPeriod] = useState<MealPeriod | null>(null);
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [recommendLoading, setRecommendLoading] = useState(false);

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

  // Reset state when hall changes or sheet opens
  useEffect(() => {
    if (visible && hall) {
      const defaultPeriod = getCurrentOrNextMealPeriod(hall);
      setSelectedPeriod(defaultPeriod);
      setSections([]);
      setError(null);
      setPlate([]); // Clear plate when opening new hall
    }
  }, [visible, hall]);

  // Fetch menu when period changes
  useEffect(() => {
    if (visible && hall && selectedPeriod) {
      loadMenu();
    }
  }, [visible, hall, selectedPeriod]);

  const loadMenu = async () => {
    if (!hall || !selectedPeriod) return;

    setLoading(true);
    setError(null);

    try {
      const today = getTodayDate();
      const menu = await mealService.getMenu(hall.id, today);

      if (menu && menu.meals[selectedPeriod]) {
        setSections(menu.meals[selectedPeriod].sections);
      } else {
        setSections([]);
        setError('No menu available for this meal period');
      }
    } catch (err) {
      console.error('Failed to load menu:', err);
      setSections([]);
      setError('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (period: MealPeriod) => {
    haptics.selection();
    setSelectedPeriod(period);
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
    const logMealType = selectedPeriod === 'late_night' ? 'snack' : (selectedPeriod || 'lunch');

    // Log each plate item with its quantity
    // Store per-serving nutrition values (not pre-multiplied by quantity)
    plate.forEach(({ item, quantity }) => {
      addMeal({
        name: item.name,
        mealType: logMealType,
        calories: Math.round(item.calories),
        protein: Math.round(item.protein_g),
        carbs: Math.round(item.carbs_g),
        fats: Math.round(item.fat_g),
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

  // Get AI recommendation and navigate to home with plate
  const handleGetRecommendation = async () => {
    if (!hall || !selectedPeriod) return;

    haptics.light();
    setRecommendLoading(true);

    try {
      const today = getTodayDate();
      const recommendation = await mealService.getRecommendedMealWithOptions(
        hall.slug,
        selectedPeriod,
        { mode: 'specific', date: today }
      );

      // Convert recommendation to format for home screen
      const mealRecommendation = {
        diningHall: recommendation.diningHall,
        mealItems: recommendation.mealItems,
        calories: recommendation.calories,
        protein: recommendation.protein,
        carbs: recommendation.carbs,
        fat: recommendation.fat,
      };

      // Navigate to home with the recommendation data
      haptics.success();
      onClose(); // Close the sheet first

      // Small delay to ensure sheet closes smoothly
      setTimeout(() => {
        router.push({
          pathname: '/(tabs)',
          params: {
            buildPlate: 'true',
            hallSlug: hall.slug || '',
            hallName: hall.name || '',
            mealPeriod: selectedPeriod || '',
            recommendation: JSON.stringify(mealRecommendation),
          },
        });
      }, 300);
    } catch (error) {
      console.error('Failed to get recommendation:', error);
      haptics.error();
    } finally {
      setRecommendLoading(false);
    }
  };

  const handleLogItem = (item: MenuItem) => {
    // When logging from detail modal, add to plate instead of logging directly
    handleAddToPlate(item);
    setItemModalVisible(false);
  };

  if (!hall) return null;

  const availablePeriods = getAvailableMealPeriods(hall);
  const isAllDay = isAllDayLocation(hall);

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
                    <Text variant="h3" weight="bold" numberOfLines={1} style={styles.hallName}>
                      {hall.name}
                    </Text>
                    {(() => {
                      const statusInfo = getLocationStatus(hall);
                      return (
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: themeColors[statusInfo.colorKey] + '30' },
                          ]}
                        >
                          <Text
                            variant="caption"
                            style={{ color: themeColors[statusInfo.colorKey] }}
                          >
                            {statusInfo.label}
                          </Text>
                        </View>
                      );
                    })()}
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

                {/* Meal Period Selector (hidden for all-day locations) */}
                {!isAllDay && availablePeriods.length > 0 && (
                  <View style={styles.periodSelector}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.periodSelectorContent}
                    >
                      {availablePeriods.map((period) => (
                        <Chip
                          key={period}
                          label={formatMealPeriod(period)}
                          selected={selectedPeriod === period}
                          onPress={() => handlePeriodChange(period)}
                          style={styles.periodChip}
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}

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
                        {selectedPeriod
                          ? `No items available for ${formatMealPeriod(selectedPeriod)}`
                          : 'No menu available'}
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
    gap: spacing.sm,
  },
  hallName: {
    flex: 1,
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
  },
  periodSelector: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.3)',
  },
  periodSelectorContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  periodChip: {
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
