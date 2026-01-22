/**
 * Edit Recommendation Screen - Full customization before logging
 * Supports: quantity adjustment, item swapping, manual macro override
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';
import { Button } from '@/src/ui/Button';
import { useDailyTracking, MealType } from '@/src/store/DailyTrackingContext';
import { haptics } from '@/src/utils/haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { EditableItemRow, EditableItem } from '@/src/components/EditableItemRow';
import { MacroEditForm, MacroValues } from '@/src/components/MacroEditForm';
import { ItemSwapSheet } from '@/src/components/ItemSwapSheet';
import { MenuItem } from '@/src/services/mealService';
import { apiClient } from '@/src/services/api';

// Route params interface
type EditRecommendationParams = {
  items?: string; // JSON stringified EditableItem[]
  diningHall?: string;
  locationId?: string;
  mealType?: string;
};

export default function EditRecommendationScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];
  const router = useRouter();
  const { addMeal } = useDailyTracking();
  const params = useLocalSearchParams<EditRecommendationParams>();

  // Parse params
  const locationId = params.locationId ? parseInt(params.locationId, 10) : 1;
  const diningHall = params.diningHall || 'Dining Hall';
  const mealType: MealType = (params.mealType as MealType) || 'lunch';

  // Parse initial items from params
  const initialItems: EditableItem[] = params.items
    ? JSON.parse(params.items)
    : [
        // Default stub items if none provided
        {
          id: '1',
          name: 'Grilled Chicken Breast',
          servings: 1,
          calories: 165,
          protein: 31,
          carbs: 0,
          fat: 3.6,
        },
        {
          id: '2',
          name: 'Brown Rice',
          servings: 1,
          calories: 216,
          protein: 5,
          carbs: 45,
          fat: 1.8,
        },
        {
          id: '3',
          name: 'Steamed Broccoli',
          servings: 1,
          calories: 55,
          protein: 3.7,
          carbs: 11,
          fat: 0.6,
        },
      ];

  // State
  const [editableItems, setEditableItems] = useState<EditableItem[]>(
    initialItems.map((item, idx) => ({
      ...item,
      id: item.id || `${Date.now()}-${idx}`,
    }))
  );
  const [originalItems] = useState<EditableItem[]>(initialItems);

  // Modal states
  const [macroEditItem, setMacroEditItem] = useState<EditableItem | null>(null);
  const [swapItemId, setSwapItemId] = useState<string | null>(null);
  const [isLogging, setIsLogging] = useState(false);

  // Calculate totals
  const totals = useMemo(() => {
    return editableItems.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories * item.servings,
        protein: acc.protein + item.protein * item.servings,
        carbs: acc.carbs + item.carbs * item.servings,
        fat: acc.fat + item.fat * item.servings,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [editableItems]);

  // Item operations
  const updateQuantity = (itemId: string, servings: number) => {
    setEditableItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, servings } : item))
    );
  };

  const swapItem = (itemId: string, newItem: MenuItem) => {
    setEditableItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              id: item.id, // Keep same ID for stability
              recipe_id: newItem.recipe_id,
              name: newItem.name,
              servings: item.servings, // Preserve quantity
              calories: newItem.calories,
              protein: newItem.protein_g,
              carbs: newItem.carbs_g,
              fat: newItem.fat_g,
              isCustomized: false,
              originalMacros: undefined,
            }
          : item
      )
    );
  };

  const updateMacros = (itemId: string, macros: MacroValues) => {
    setEditableItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        // Store original if first customization
        const originalMacros = item.originalMacros || {
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
        };

        return {
          ...item,
          calories: macros.calories,
          protein: macros.protein,
          carbs: macros.carbs,
          fat: macros.fat,
          isCustomized: true,
          originalMacros,
        };
      })
    );
  };

  const removeItem = (itemId: string) => {
    haptics.warning();
    setEditableItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const addNewItem = (menuItem: MenuItem) => {
    const newItem: EditableItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      recipe_id: menuItem.recipe_id,
      name: menuItem.name,
      servings: 1,
      calories: menuItem.calories,
      protein: menuItem.protein_g,
      carbs: menuItem.carbs_g,
      fat: menuItem.fat_g,
      isCustomized: false,
    };
    setEditableItems((prev) => [...prev, newItem]);
  };

  // Log meal handler
  const handleLogMeal = async () => {
    if (editableItems.length === 0) {
      Alert.alert('No Items', 'Please add at least one item to log.');
      return;
    }

    setIsLogging(true);
    haptics.success();

    // Format items for API
    const logItems = editableItems.map((item) => ({
      recipe_id: item.recipe_id || undefined,
      name: item.name,
      servings: item.servings,
      calories: item.calories,
      protein_g: item.protein,
      carbs_g: item.carbs,
      fat_g: item.fat,
    }));

    // Try API first
    try {
      const response = await apiClient.post('/log', {
        meal_date: new Date().toISOString().split('T')[0],
        meal_type: mealType,
        items: logItems,
        source: 'recommendation',
      });

      if (response.error) {
        console.log('API error, using local tracking:', response.error);
      }
    } catch (error) {
      console.log('API unavailable, using local tracking:', error);
    }

    // Update local tracking context
    editableItems.forEach((item) => {
      addMeal({
        name: item.name,
        mealType: mealType,
        calories: Math.round(item.calories * item.servings),
        protein: Math.round(item.protein * item.servings),
        carbs: Math.round(item.carbs * item.servings),
        fats: Math.round(item.fat * item.servings),
        quantity: item.servings,
      });
    });

    setIsLogging(false);

    Alert.alert(
      'Meal Logged!',
      `Added ${Math.round(totals.calories)} calories to your daily total.`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  // Get current item for swap sheet
  const swapItemName = swapItemId
    ? editableItems.find((i) => i.id === swapItemId)?.name
    : undefined;

  return (
    <Screen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialIcons
                name="arrow-back"
                size={24}
                color={themeColors.text}
              />
            </TouchableOpacity>
            <View style={styles.headerTitle}>
              <Text variant="h3" weight="bold">
                Edit Meal
              </Text>
              <Text variant="caption" color="secondary">
                {diningHall} • {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Items List */}
        <ScrollView
          style={styles.itemsList}
          contentContainerStyle={styles.itemsContent}
          keyboardShouldPersistTaps="handled">
          {editableItems.map((item) => (
            <EditableItemRow
              key={item.id}
              item={item}
              onQuantityChange={(servings) => updateQuantity(item.id, servings)}
              onSwap={() => setSwapItemId(item.id)}
              onEditMacros={() => setMacroEditItem(item)}
              onRemove={() => removeItem(item.id)}
            />
          ))}

          {/* Add Item Button */}
          <TouchableOpacity
            style={[
              styles.addItemButton,
              { borderColor: themeColors.primary },
            ]}
            onPress={() => setSwapItemId('__new__')}
            activeOpacity={0.7}>
            <MaterialIcons
              name="add"
              size={24}
              color={themeColors.primary}
            />
            <Text
              variant="body"
              weight="medium"
              style={{ color: themeColors.primary }}>
              Add Item
            </Text>
          </TouchableOpacity>

          {/* Empty state */}
          {editableItems.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons
                name="restaurant"
                size={48}
                color={themeColors.textTertiary}
              />
              <Text
                variant="body"
                color="secondary"
                style={{ marginTop: spacing.md, textAlign: 'center' }}>
                No items in your meal.{'\n'}Tap &quot;Add Item&quot; to get started.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Footer - Totals & Log Button */}
        <View
          style={[
            styles.footer,
            { backgroundColor: themeColors.cardBackground },
          ]}>
          {/* Macro totals */}
          <View style={styles.totalsRow}>
            <View style={styles.totalItem}>
              <Text
                variant="h3"
                weight="bold"
                style={{ color: themeColors.calories }}>
                {Math.round(totals.calories)}
              </Text>
              <Text variant="caption" color="secondary">
                calories
              </Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalItem}>
              <Text
                variant="body"
                weight="semibold"
                style={{ color: themeColors.protein }}>
                {Math.round(totals.protein)}g
              </Text>
              <Text variant="caption" color="secondary">
                protein
              </Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalItem}>
              <Text
                variant="body"
                weight="semibold"
                style={{ color: themeColors.carbs }}>
                {Math.round(totals.carbs)}g
              </Text>
              <Text variant="caption" color="secondary">
                carbs
              </Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalItem}>
              <Text
                variant="body"
                weight="semibold"
                style={{ color: themeColors.fats }}>
                {Math.round(totals.fat)}g
              </Text>
              <Text variant="caption" color="secondary">
                fat
              </Text>
            </View>
          </View>

          {/* Log button */}
          <Button
            variant="primary"
            size="lg"
            onPress={handleLogMeal}
            loading={isLogging}
            disabled={editableItems.length === 0 || isLogging}
            fullWidth>
            Log Meal ({editableItems.length} item{editableItems.length !== 1 ? 's' : ''})
          </Button>
        </View>
      </View>

      {/* Macro Edit Modal */}
      {macroEditItem && (
        <MacroEditForm
          visible={!!macroEditItem}
          itemName={macroEditItem.name}
          macros={{
            calories: macroEditItem.calories,
            protein: macroEditItem.protein,
            carbs: macroEditItem.carbs,
            fat: macroEditItem.fat,
          }}
          originalMacros={macroEditItem.originalMacros}
          onSave={(macros) => updateMacros(macroEditItem.id, macros)}
          onClose={() => setMacroEditItem(null)}
        />
      )}

      {/* Item Swap Sheet */}
      <ItemSwapSheet
        visible={!!swapItemId}
        onClose={() => setSwapItemId(null)}
        locationId={locationId}
        currentMeal={mealType}
        onSelectItem={(item) => {
          if (swapItemId === '__new__') {
            addNewItem(item);
          } else if (swapItemId) {
            swapItem(swapItemId, item);
          }
          setSwapItemId(null);
        }}
        currentItemName={swapItemName}
      />
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerTitle: {
    gap: spacing.xs,
  },
  itemsList: {
    flex: 1,
  },
  itemsContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginTop: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  footer: {
    padding: spacing.lg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    gap: spacing.md,
  },
  totalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalItem: {
    flex: 1,
    alignItems: 'center',
  },
  totalDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});
