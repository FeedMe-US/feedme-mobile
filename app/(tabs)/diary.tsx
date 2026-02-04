/**
 * Diary Screen - View and manage logged meals
 * Similar to MyFitnessPal diary
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';
import { Card } from '@/src/ui/Card';
import { useDailyTracking, LoggedMeal } from '@/src/store/DailyTrackingContext';
import { haptics } from '@/src/utils/haptics';
import { AppIcon } from '@/src/components/AppIcon';
import { MaterialIcons } from '@expo/vector-icons';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export default function DiaryScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];
  const router = useRouter();
  const { tracking, updateMeal, removeMeal } = useDailyTracking();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>('');
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedMealIds, setSelectedMealIds] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<MealType>>(new Set());

  const mealsByType: Record<MealType, LoggedMeal[]> = {
    breakfast: tracking.loggedMeals.filter((m) => m.mealType === 'breakfast'),
    lunch: tracking.loggedMeals.filter((m) => m.mealType === 'lunch'),
    dinner: tracking.loggedMeals.filter((m) => m.mealType === 'dinner'),
    snack: tracking.loggedMeals.filter((m) => m.mealType === 'snack'),
  };

  const handleEditQuantity = (meal: LoggedMeal) => {
    setEditingId(meal.id);
    setEditQuantity(meal.quantity.toString());
  };

  const handleSaveQuantity = (id: string) => {
    const quantity = parseFloat(editQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid number greater than 0');
      return;
    }
    updateMeal(id, { quantity });
    setEditingId(null);
    setEditQuantity('');
    haptics.success();
  };

  const handleRemove = (id: string, name: string) => {
    Alert.alert('Remove Food', `Remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          removeMeal(id);
          haptics.success();
        },
      },
    ]);
  };

  const toggleMultiSelectMode = () => {
    setMultiSelectMode(!multiSelectMode);
    setSelectedMealIds(new Set());
    haptics.medium();
  };

  const toggleMealSelection = (id: string) => {
    const newSelected = new Set(selectedMealIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedMealIds(newSelected);
    haptics.light();
  };

  const handleLongPress = (id: string) => {
    if (!multiSelectMode) {
      setMultiSelectMode(true);
      setSelectedMealIds(new Set([id]));
      haptics.medium();
    }
  };

  const handleDeleteSelected = () => {
    const count = selectedMealIds.size;
    if (count === 0) return;

    Alert.alert('Delete Selected', `Delete ${count} item${count > 1 ? 's' : ''}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          for (const id of selectedMealIds) {
            await removeMeal(id);
          }
          setSelectedMealIds(new Set());
          setMultiSelectMode(false);
          haptics.success();
        },
      },
    ]);
  };

  const handleAddFood = (mealType: MealType) => {
    haptics.light();
    router.push({
      pathname: '/manual-log',
      params: { mealType },
    });
  };

  const toggleSectionExpansion = (mealType: MealType) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(mealType)) {
      newExpanded.delete(mealType);
    } else {
      newExpanded.add(mealType);
    }
    setExpandedSections(newExpanded);
    haptics.light();
  };

  const renderMealSection = (mealType: MealType) => {
    const meals = mealsByType[mealType];
    const isExpanded = expandedSections.has(mealType);
    const ITEM_LIMIT = 5;
    const hasMoreItems = meals.length > ITEM_LIMIT;
    const displayMeals = hasMoreItems && !isExpanded ? meals.slice(0, ITEM_LIMIT) : meals;

    return (
      <Card variant="elevated" padding="lg" style={styles.mealSection}>
        <View style={styles.sectionHeader}>
          <Text variant="h4" weight="semibold">
            {MEAL_LABELS[mealType]}
          </Text>
          {!multiSelectMode && (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: themeColors.primary + '20' }]}
              onPress={() => handleAddFood(mealType)}>
              <Text variant="caption" weight="semibold" style={{ color: themeColors.primary }}>
                + Add
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {displayMeals.map((meal) => {
          const isSelected = selectedMealIds.has(meal.id);
          const mealContent = (
            <>
              {multiSelectMode && (
                <View style={styles.checkboxContainer}>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: isSelected ? themeColors.primary : themeColors.border,
                        backgroundColor: isSelected ? themeColors.primary : 'transparent',
                      },
                    ]}>
                    {isSelected && (
                      <AppIcon type="check" size={14} color={themeColors.textInverse} />
                    )}
                  </View>
                </View>
              )}
              <View style={styles.mealItemLeft}>
                <Text variant="body" weight="medium" style={styles.mealName}>
                  {meal.name}
                </Text>
                <View style={styles.macroRow}>
                  <Text variant="caption" color="secondary">
                    {Math.round(meal.calories * meal.quantity)} cal
                  </Text>
                  <Text variant="caption" style={{ color: themeColors.protein }}>
                    {Math.round(meal.protein * meal.quantity)}g P
                  </Text>
                  <Text variant="caption" style={{ color: themeColors.carbs }}>
                    {Math.round(meal.carbs * meal.quantity)}g C
                  </Text>
                  <Text variant="caption" style={{ color: themeColors.fats }}>
                    {Math.round(meal.fats * meal.quantity)}g F
                  </Text>
                </View>
              </View>
              {!multiSelectMode && (
                <View style={styles.mealItemRight}>
                  {editingId === meal.id ? (
                    <View style={styles.quantityEdit}>
                      <TextInput
                        style={[
                          styles.quantityInput,
                          {
                            backgroundColor: themeColors.background,
                            color: themeColors.text,
                            borderColor: themeColors.border,
                          },
                        ]}
                        value={editQuantity}
                        onChangeText={setEditQuantity}
                        keyboardType="decimal-pad"
                        autoFocus
                        onSubmitEditing={() => handleSaveQuantity(meal.id)}
                      />
                      <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: themeColors.primary }]}
                        onPress={() => handleSaveQuantity(meal.id)}>
                        <Text style={{ color: themeColors.textInverse, fontSize: 12 }}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.quantityDisplay}>
                      <Text variant="body" weight="semibold">
                        ×{meal.quantity}
                      </Text>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEditQuantity(meal)}>
                        <Text variant="caption" color="primary">
                          Edit
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemove(meal.id, meal.name)}>
                    <Text style={styles.removeText}>×</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          );

          if (multiSelectMode) {
            return (
              <Pressable
                key={meal.id}
                style={[
                  styles.mealItem,
                  isSelected && {
                    backgroundColor: themeColors.primary + '20',
                    borderRadius: radius.md,
                  },
                ]}
                onLongPress={() => handleLongPress(meal.id)}
                onPress={() => toggleMealSelection(meal.id)}>
                {mealContent}
              </Pressable>
            );
          }

          return (
            <View key={meal.id} style={styles.mealItem}>
              {mealContent}
            </View>
          );
        })}
        {hasMoreItems && (
          <TouchableOpacity
            style={styles.seeMoreButton}
            onPress={() => toggleSectionExpansion(mealType)}>
            <Text variant="body" weight="medium" style={{ color: themeColors.primary }}>
              {isExpanded ? 'See less' : `See more (${meals.length - ITEM_LIMIT} more)`}
            </Text>
          </TouchableOpacity>
        )}
      </Card>
    );
  };

  const totalCalories = tracking.consumed.calories;
  const totalProtein = tracking.consumed.protein;
  const totalCarbs = tracking.consumed.carbs;
  const totalFats = tracking.consumed.fats;

  return (
    <Screen safeBottom={false} style={{ position: 'relative' }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="h2" weight="bold" style={styles.headerTitle}>
              Food Diary
            </Text>
            <Text variant="bodySmall" color="secondary">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
          {!multiSelectMode && (
            <TouchableOpacity
              style={styles.selectButton}
              onPress={toggleMultiSelectMode}>
              <Text variant="body" weight="medium" style={{ color: themeColors.primary }}>
                Select
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Daily Summary */}
        <Card variant="elevated" padding="lg" style={styles.summaryCard}>
          <Text variant="h4" weight="semibold" style={styles.summaryTitle}>
            Today&apos;s Totals
          </Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text variant="h3" weight="bold">
                {Math.round(totalCalories)}
              </Text>
              <Text variant="caption" color="secondary">
                Calories
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text variant="h3" weight="bold" style={{ color: themeColors.protein }}>
                {Math.round(totalProtein)}g
              </Text>
              <Text variant="caption" color="secondary">
                Protein
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text variant="h3" weight="bold" style={{ color: themeColors.carbs }}>
                {Math.round(totalCarbs)}g
              </Text>
              <Text variant="caption" color="secondary">
                Carbs
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text variant="h3" weight="bold" style={{ color: themeColors.fats }}>
                {Math.round(totalFats)}g
              </Text>
              <Text variant="caption" color="secondary">
                Fats
              </Text>
            </View>
          </View>
        </Card>

        {/* Meal Sections */}
        {renderMealSection('breakfast')}
        {renderMealSection('lunch')}
        {renderMealSection('dinner')}
        {renderMealSection('snack')}
      </ScrollView>

      {/* Floating Action Buttons for Multi-Select Mode */}
      {multiSelectMode && (
        <View style={styles.floatingButtons}>
          <TouchableOpacity
            style={[
              styles.floatingButton,
              styles.deleteFloatingButton,
              {
                backgroundColor: selectedMealIds.size > 0 ? themeColors.error : themeColors.cardBackgroundSecondary,
                opacity: selectedMealIds.size > 0 ? 1 : 0.5,
              },
            ]}
            onPress={handleDeleteSelected}
            disabled={selectedMealIds.size === 0}>
            <MaterialIcons
              name="delete"
              size={24}
              color={selectedMealIds.size > 0 ? '#FFFFFF' : themeColors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.floatingButton, styles.cancelFloatingButton, { backgroundColor: themeColors.cardBackground }]}
            onPress={() => {
              setMultiSelectMode(false);
              setSelectedMealIds(new Set());
              haptics.light();
            }}>
            <AppIcon type="close" size={20} color={themeColors.text} />
          </TouchableOpacity>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  selectButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  headerTitle: {
    marginBottom: spacing.xs,
  },
  floatingButtons: {
    position: 'absolute',
    right: spacing.lg,
    flexDirection: 'column',
    gap: spacing.sm,
    zIndex: 1000,
    bottom: 40, // Positioned above tab bar
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  deleteFloatingButton: {
    // Styles applied inline
  },
  cancelFloatingButton: {
    // Styles applied inline
  },
  checkboxContainer: {
    marginRight: spacing.md,
    justifyContent: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    marginBottom: spacing.lg,
  },
  summaryTitle: {
    marginBottom: spacing.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: radius.md,
  },
  mealSection: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  addButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  emptyMealText: {
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  mealItemLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  mealName: {
    marginBottom: spacing.xs,
  },
  macroRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  mealItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quantityDisplay: {
    alignItems: 'flex-end',
    marginRight: spacing.xs,
  },
  editButton: {
    marginTop: spacing.xs,
  },
  quantityEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  quantityInput: {
    width: 60,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    fontSize: 14,
    textAlign: 'center',
  },
  saveButton: {
    paddingHorizontal: spacing.sm,
    
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: '#FF3B30',
    fontSize: 20,
    lineHeight: 20,
  },
  seeMoreButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
});

