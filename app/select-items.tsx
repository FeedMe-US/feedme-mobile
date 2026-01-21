/**
 * Select Items Screen - Choose individual items from recommended meal
 * Supports BYO (Build-Your-Own) item customization
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';
import { Card } from '@/src/ui/Card';
import { Button } from '@/src/ui/Button';
import { useDailyTracking } from '@/src/store/DailyTrackingContext';
import { haptics } from '@/src/utils/haptics';
import { AppIcon } from '@/src/components/AppIcon';
import { mealService, MenuItem, BYOComponent } from '@/src/services/mealService';
import { BYOCustomizerModal } from '@/src/components/BYOCustomizerModal';

export interface MealItem {
  name: string;
  amount: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  recipe_id?: string;
}

export default function SelectItemsScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];
  const router = useRouter();
  const { addMeal } = useDailyTracking();
  const params = useLocalSearchParams();

  // Parse meal items from params or use defaults
  const [mealItems, setMealItems] = useState<MealItem[]>(
    params.items
      ? JSON.parse(params.items as string)
      : [
          { name: 'Scrambled Eggs', amount: '2 eggs', calories: 140, protein: 12, carbs: 1, fat: 10 },
          { name: 'Turkey Bacon', amount: '3 strips', calories: 70, protein: 6, carbs: 1, fat: 5 },
          { name: 'Whole Wheat Pancakes', amount: '2 pancakes', calories: 180, protein: 6, carbs: 32, fat: 4 },
          { name: 'Fresh Berries', amount: '1 cup', calories: 50, protein: 1, carbs: 12, fat: 0.3 },
        ]
  );

  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [byoItems, setByoItems] = useState<Set<number>>(new Set());
  const [byoItemsMissingRecipeId, setByoItemsMissingRecipeId] = useState<Set<number>>(new Set());
  const [byoModalVisible, setByoModalVisible] = useState(false);
  const [byoItemIndex, setByoItemIndex] = useState<number | null>(null);

  // Check which items are BYO items and which are missing recipe_id
  useEffect(() => {
    const checkBYOItems = () => {
      const byoIndices = new Set<number>();
      const missingRecipeIdIndices = new Set<number>();
      mealItems.forEach((item, index) => {
        // Check if item is BYO using name pattern
        const menuItem: MenuItem = {
          recipe_id: item.recipe_id || '',
          name: item.name,
          calories: item.calories,
          protein_g: item.protein,
          carbs_g: item.carbs,
          fat_g: item.fat,
          tags: [],
          allergens: [],
        };
        const isByo = mealService.isBYOItem(menuItem);
        if (isByo) {
          console.log('[SelectItems] BYO item detected:', item.name, 'recipe_id:', item.recipe_id || '(none)');
          byoIndices.add(index);
          // Track BYO items missing recipe_id for warning indicator
          if (!item.recipe_id || item.recipe_id.trim() === '') {
            console.log('[SelectItems] BYO item missing recipe_id:', item.name);
            missingRecipeIdIndices.add(index);
          }
        }
      });
      if (byoIndices.size > 0) {
        console.log('[SelectItems] Found', byoIndices.size, 'BYO items,', missingRecipeIdIndices.size, 'missing recipe_id');
      }
      setByoItems(byoIndices);
      setByoItemsMissingRecipeId(missingRecipeIdIndices);
    };
    checkBYOItems();
  }, [mealItems]);

  // Handle BYO customization
  const handleCustomizeBYO = (index: number) => {
    haptics.medium();
    setByoItemIndex(index);
    setByoModalVisible(true);
  };

  // Handle BYO log from customizer modal
  const handleBYOLog = (customItem: MenuItem, _selectedComponents: BYOComponent[]) => {
    if (byoItemIndex === null) return;

    // Update the meal item with customized nutrition
    const updatedItems = [...mealItems];
    updatedItems[byoItemIndex] = {
      ...updatedItems[byoItemIndex],
      name: customItem.name,
      calories: customItem.calories,
      protein: customItem.protein_g,
      carbs: customItem.carbs_g,
      fat: customItem.fat_g,
    };
    setMealItems(updatedItems);

    // Auto-select the customized item
    setSelectedItems((prev) => new Set([...prev, byoItemIndex]));
    setByoModalVisible(false);
    setByoItemIndex(null);
    haptics.success();
  };

  // Get the current BYO item as MenuItem for the modal
  const currentByoMenuItem: MenuItem | null = byoItemIndex !== null ? {
    recipe_id: mealItems[byoItemIndex].recipe_id || '',
    name: mealItems[byoItemIndex].name,
    calories: mealItems[byoItemIndex].calories,
    protein_g: mealItems[byoItemIndex].protein,
    carbs_g: mealItems[byoItemIndex].carbs,
    fat_g: mealItems[byoItemIndex].fat,
    tags: [],
    allergens: [],
  } : null;

  const toggleItem = (index: number) => {
    haptics.light();
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleLogSelected = () => {
    if (selectedItems.size === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item to log.');
      return;
    }

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    selectedItems.forEach((index) => {
      const item = mealItems[index];
      totalCalories += item.calories;
      totalProtein += item.protein;
      totalCarbs += item.carbs;
      totalFat += item.fat;
    });

    haptics.success();

    // Add each selected item as a meal
    // Determine meal type based on Pacific time
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: '2-digit',
      hour12: false,
    });
    const hour = parseInt(formatter.formatToParts(new Date()).find(p => p.type === 'hour')?.value || '12', 10);
    const mealType = hour >= 5 && hour < 11 ? 'breakfast' : hour < 16 ? 'lunch' : hour < 21 ? 'dinner' : 'snack';

    selectedItems.forEach((index) => {
      const item = mealItems[index];
      addMeal({
        name: item.name,
        mealType,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fats: item.fat,
        quantity: 1,
      });
    });

    Alert.alert(
      'Items Logged!',
      `Added ${totalCalories} calories from ${selectedItems.size} item(s) to your daily total.`
    );
    router.back();
  };

  return (
    <Screen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h2" weight="bold">
            Select Items
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <AppIcon type="close" size={20} />
          </TouchableOpacity>
        </View>

        {/* Items List */}
        <ScrollView
          style={styles.itemsList}
          contentContainerStyle={styles.itemsContent}>
          {mealItems.map((item, index) => {
            const isSelected = selectedItems.has(index);
            const isBYO = byoItems.has(index);
            const isMissingRecipeId = byoItemsMissingRecipeId.has(index);
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.itemCard,
                  { backgroundColor: themeColors.cardBackground },
                  isSelected && { borderColor: themeColors.primary, borderWidth: 2 },
                ]}
                onPress={() => toggleItem(index)}
                activeOpacity={0.7}>
                <View style={styles.itemContent}>
                  <View style={styles.itemLeft}>
                    <View
                      style={[
                        styles.checkbox,
                        {
                          backgroundColor: isSelected ? themeColors.primary : 'transparent',
                          borderColor: themeColors.primary,
                        },
                      ]}>
                      {isSelected && (
                        <AppIcon
                          type="check"
                          size={18}
                          color={themeColors.textInverse}
                        />
                      )}
                    </View>
                    <View style={styles.itemInfo}>
                      <View style={styles.itemNameRow}>
                        <Text variant="body" weight="semibold">
                          {item.name}
                        </Text>
                        {isBYO && (
                          <View style={styles.byoBadgeRow}>
                            <View style={[styles.byoBadge, { backgroundColor: themeColors.primary + '30' }]}>
                              <Text variant="caption" style={{ color: themeColors.primary, fontSize: 10 }}>
                                BYO
                              </Text>
                            </View>
                            {isMissingRecipeId && (
                              <View style={[styles.warningBadge, { backgroundColor: themeColors.warning + '30' }]}>
                                <Text variant="caption" style={{ color: themeColors.warning || '#FFA500', fontSize: 10 }}>
                                  Default Only
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                      <Text variant="caption" color="secondary">
                        {item.amount}
                      </Text>
                      {isBYO && (
                        <TouchableOpacity
                          style={[styles.customizeButton, { backgroundColor: themeColors.primary }]}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleCustomizeBYO(index);
                          }}>
                          <Text variant="caption" weight="semibold" style={{ color: themeColors.textInverse }}>
                            Customize Build
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  <View style={styles.itemMacros}>
                    <Text variant="bodySmall" weight="semibold">
                      {item.calories} cal
                    </Text>
                    <Text variant="caption" color="secondary">
                      {item.protein}g P • {item.carbs}g C • {item.fat}g F
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Summary & Log Button */}
        <View style={[styles.footer, { backgroundColor: themeColors.cardBackground }]}>
          <View style={styles.summary}>
            <Text variant="bodySmall" color="secondary">
              {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
            </Text>
            {selectedItems.size > 0 && (
              <Text variant="body" weight="semibold">
                {Array.from(selectedItems).reduce(
                  (sum, idx) => sum + mealItems[idx].calories,
                  0
                )}{' '}
                cal
              </Text>
            )}
          </View>
          <Button
            variant="primary"
            size="lg"
            onPress={handleLogSelected}
            disabled={selectedItems.size === 0}
            fullWidth>
            Log Selected ({selectedItems.size})
          </Button>
        </View>
      </View>

      {/* BYO Customizer Modal */}
      {currentByoMenuItem && (
        <BYOCustomizerModal
          visible={byoModalVisible}
          item={currentByoMenuItem}
          onClose={() => {
            setByoModalVisible(false);
            setByoItemIndex(null);
          }}
          onLog={handleBYOLog}
        />
      )}
    </Screen>
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
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  closeIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  itemsList: {
    flex: 1,
  },
  itemsContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  itemCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemInfo: {
    flex: 1,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  byoBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  byoBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  warningBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  customizeButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  itemMacros: {
    alignItems: 'flex-end',
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
});

