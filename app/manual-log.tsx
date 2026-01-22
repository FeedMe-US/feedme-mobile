/**
 * Manual Log Screen - MyFitnessPal-style food logging
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';
import { Card } from '@/src/ui/Card';
import { Button } from '@/src/ui/Button';
import { foodService, FoodItem } from '@/src/services/foodService';
import { useDailyTracking } from '@/src/store/DailyTrackingContext';
import { haptics } from '@/src/utils/haptics';
import { AppIcon } from '@/src/components/AppIcon';
import { QuantityStepper } from '@/src/components/QuantityStepper';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export default function ManualLogScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];
  const router = useRouter();
  const params = useLocalSearchParams();
  const mealTypeParam = params.mealType as MealType | undefined;
  const { addMeal } = useDailyTracking();

  // Determine default meal type based on Pacific time
  const getDefaultMealType = (): MealType => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: '2-digit',
      hour12: false,
    });
    const hour = parseInt(formatter.formatToParts(new Date()).find(p => p.type === 'hour')?.value || '12', 10);
    if (hour >= 5 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 16) return 'lunch';
    if (hour >= 16 && hour < 21) return 'dinner';
    return 'snack';
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [recentFoods, setRecentFoods] = useState<FoodItem[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealType>(
    mealTypeParam || getDefaultMealType()
  );

  // Quantity modal state
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);
  const [quantityInputValue, setQuantityInputValue] = useState('1');

  useEffect(() => {
    loadRecentFoods();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchFoods();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Handle keyboard show/hide to scroll search input into view
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        if (isSearchFocused) {
          // Scroll to show search input when keyboard appears
          setTimeout(() => {
            scrollViewRef.current?.scrollTo({ y: 150, animated: true });
          }, 100);
        }
      }
    );

    return () => {
      keyboardWillShow.remove();
    };
  }, [isSearchFocused, isEditingQuantity]);

  const loadRecentFoods = async () => {
    const recent = await foodService.getRecentFoods();
    setRecentFoods(recent);
  };

  const searchFoods = async () => {
    const results = await foodService.searchFoods(searchQuery);
    setSearchResults(results);
  };

  const handleFoodSelect = (food: FoodItem) => {
    haptics.light();
    setSelectedFood(food);
    setQuantity(1);
    setQuantityInputValue('1');
    setIsEditingQuantity(false);
    setShowQuantityModal(true);
  };

  const handleLogFood = () => {
    if (!selectedFood) return;

    haptics.success();
    addMeal({
      name: selectedFood.name,
      mealType: selectedMeal,
      calories: selectedFood.calories * quantity,
      protein: selectedFood.protein * quantity,
      carbs: selectedFood.carbs * quantity,
      fats: selectedFood.fat * quantity,
      quantity: quantity,
    });
    foodService.addToRecent(selectedFood.id);
    setShowQuantityModal(false);
    setSelectedFood(null);
    router.back();
  };

  const scrollViewRef = useRef<ScrollView>(null);
  const searchInputRef = useRef<TextInput>(null);
  const quantityInputRef = useRef<TextInput>(null);

  // Format quantity for display (show fractions for common decimals)
  const formatQuantityDisplay = (value: number): string => {
    const whole = Math.floor(value);
    const decimal = value - whole;

    // Map common fractions
    const fractionMap: Record<number, string> = {
      0: '',
      0.125: '⅛',
      0.25: '¼',
      0.375: '⅜',
      0.5: '½',
      0.625: '⅝',
      0.75: '¾',
      0.875: '⅞',
    };

    const roundedDecimal = Math.round(decimal * 8) / 8;
    const fraction = fractionMap[roundedDecimal];

    if (fraction !== undefined) {
      if (whole === 0 && fraction) {
        return fraction;
      } else if (fraction) {
        return `${whole}${fraction}`;
      } else {
        return `${whole}`;
      }
    }

    // Fallback to decimal
    return value.toFixed(2).replace(/\.?0+$/, '');
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={true}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h2" weight="bold">
            Log Meal
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <AppIcon type="close" size={20} />
          </TouchableOpacity>
        </View>

        {/* Meal Type Selector - Smaller */}
        <View style={styles.mealSelector}>
          {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((meal) => (
            <TouchableOpacity
              key={meal}
              style={[
                styles.mealButton,
                {
                  backgroundColor:
                    selectedMeal === meal ? themeColors.primary : themeColors.cardBackground,
                },
              ]}
              onPress={() => {
                setSelectedMeal(meal);
                haptics.light();
              }}>
              <Text
                variant="caption"
                weight={selectedMeal === meal ? 'semibold' : 'medium'}
                style={{
                  color:
                    selectedMeal === meal ? themeColors.textInverse : themeColors.text,
                  textTransform: 'capitalize',
                  fontSize: 11,
                }}
                numberOfLines={1}
                adjustsFontSizeToFit>
                {meal}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Scan Options */}
        <View style={styles.scanOptionsContainer}>
          {/* Scan Meal Option */}
          <TouchableOpacity
            style={[styles.scanCard, { backgroundColor: themeColors.cardBackground }]}
            onPress={() => {
              haptics.medium();
              router.push({
                pathname: '/camera',
                params: { mode: 'photo' },
              });
            }}
            activeOpacity={0.7}>
            <View style={styles.scanCardContent}>
              <AppIcon type="camera" size={24} />
              <View style={styles.scanTextContainer}>
                <Text variant="bodySmall" weight="semibold">
                  Scan Meal
                </Text>
                <Text variant="caption" color="secondary" style={{ fontSize: 11 }}>
                  AI-powered meal analysis
                </Text>
              </View>
              <Text style={styles.arrowIcon}>→</Text>
            </View>
          </TouchableOpacity>

          {/* Barcode Scan Option */}
          <TouchableOpacity
            style={[styles.scanCard, { backgroundColor: themeColors.cardBackground }]}
            onPress={() => {
              haptics.medium();
              router.push({
                pathname: '/camera',
                params: { mode: 'barcode' },
              });
            }}
            activeOpacity={0.7}>
            <View style={styles.scanCardContent}>
              <AppIcon type="barcode" size={24} />
              <View style={styles.scanTextContainer}>
                <Text variant="bodySmall" weight="semibold">
                  Scan Barcode
                </Text>
                <Text variant="caption" color="secondary" style={{ fontSize: 11 }}>
                  Scan product barcode to add
                </Text>
              </View>
              <Text style={styles.arrowIcon}>→</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <TextInput
            ref={searchInputRef}
            style={[
              styles.searchInput,
              {
                backgroundColor: themeColors.cardBackground,
                color: themeColors.text,
                borderColor: themeColors.border,
              },
            ]}
            placeholder="Search foods..."
            placeholderTextColor={themeColors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => {
              setIsSearchFocused(true);
            }}
            onBlur={() => {
              // Delay to allow tap events on results
              setTimeout(() => setIsSearchFocused(false), 200);
            }}
            returnKeyType="search"
            blurOnSubmit={true}
            onSubmitEditing={() => {
              searchInputRef.current?.blur();
              Keyboard.dismiss();
            }}
          />
        </View>

        {/* Results */}
        <View style={styles.resultsContainer}>
          {searchQuery.trim() ? (
            searchResults.length > 0 ? (
              <View style={styles.resultsList}>
                {searchResults.map((food) => (
                  <Card
                    key={food.id}
                    variant="outlined"
                    padding="md"
                    style={styles.foodCard}
                    onTouchEnd={() => handleFoodSelect(food)}>
                    <View style={styles.foodCardContent}>
                      <View style={styles.foodInfo}>
                        <Text variant="body" weight="semibold">
                          {food.name}
                        </Text>
                        <Text variant="caption" color="secondary">
                          {food.servingSize}
                        </Text>
                      </View>
                      <View style={styles.foodMacros}>
                        <Text variant="bodySmall" weight="semibold">
                          {food.calories} cal
                        </Text>
                        <Text variant="caption" color="secondary">
                          {food.protein}g P • {food.carbs}g C • {food.fat}g F
                        </Text>
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text variant="body" color="secondary">
                  No foods found
                </Text>
              </View>
            )
          ) : (
            isSearchFocused && (
              <View>
                <Text variant="h4" weight="semibold" style={styles.sectionTitle}>
                  Recent Foods
                </Text>
                {recentFoods.length > 0 ? (
                <View style={styles.resultsList}>
                  {recentFoods.map((food) => (
                    <Card
                      key={food.id}
                      variant="outlined"
                      padding="md"
                      style={styles.foodCard}
                      onTouchEnd={() => handleFoodSelect(food)}>
                      <View style={styles.foodCardContent}>
                        <View style={styles.foodInfo}>
                          <Text variant="body" weight="semibold">
                            {food.name}
                          </Text>
                          <Text variant="caption" color="secondary">
                            {food.servingSize}
                          </Text>
                        </View>
                        <View style={styles.foodMacros}>
                          <Text variant="bodySmall" weight="semibold">
                            {food.calories} cal
                          </Text>
                        </View>
                      </View>
                    </Card>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text variant="body" color="secondary">
                    No recent foods
                  </Text>
                </View>
              )}
              </View>
            )
          )}
        </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Quantity Selection Modal */}
      <Modal
        visible={showQuantityModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQuantityModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={() => setShowQuantityModal(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.modalKeyboardAvoid, { backgroundColor: themeColors.surface }]}>
            <View
              style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
              {selectedFood && (
                <>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalHeaderContent}>
                      <Text variant="h3" weight="semibold" numberOfLines={2}>
                        {selectedFood.name}
                      </Text>
                      <Text variant="caption" color="secondary" style={styles.modalServingSize}>
                        {selectedFood.servingSize}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        haptics.light();
                        setShowQuantityModal(false);
                      }}
                      style={styles.modalCloseButton}>
                      <AppIcon type="close" size={20} />
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.modalNutritionInfo, { backgroundColor: themeColors.background }]}>
                    <View style={styles.nutritionRow}>
                      <Text variant="bodySmall" color="secondary">Calories</Text>
                      <Text variant="body" weight="semibold">
                        {Math.round(selectedFood.calories * quantity)} cal
                      </Text>
                    </View>
                    <View style={styles.nutritionRow}>
                      <Text variant="bodySmall" color="secondary">Protein</Text>
                      <Text variant="body" weight="semibold">
                        {Math.round(selectedFood.protein * quantity * 10) / 10}g
                      </Text>
                    </View>
                    <View style={styles.nutritionRow}>
                      <Text variant="bodySmall" color="secondary">Carbs</Text>
                      <Text variant="body" weight="semibold">
                        {Math.round(selectedFood.carbs * quantity * 10) / 10}g
                      </Text>
                    </View>
                    <View style={styles.nutritionRow}>
                      <Text variant="bodySmall" color="secondary">Fat</Text>
                      <Text variant="body" weight="semibold">
                        {Math.round(selectedFood.fat * quantity * 10) / 10}g
                      </Text>
                    </View>
                  </View>

                  <View style={styles.quantitySection}>
                    <Text variant="h4" weight="semibold" style={styles.quantityLabel}>
                      Quantity
                    </Text>
                    <View style={styles.quantityControls}>
                      <View style={styles.stepperContainer}>
                        <TouchableOpacity
                          style={[
                            styles.stepperButton,
                            {
                              backgroundColor: themeColors.backgroundTertiary,
                              opacity: quantity > 0.25 ? 1 : 0.4,
                            },
                          ]}
                          onPress={() => {
                            if (quantity > 0.25) {
                              haptics.light();
                              const newValue = Math.max(0.25, quantity - 1);
                              setQuantity(newValue);
                              setQuantityInputValue(newValue.toString());
                            }
                          }}
                          disabled={quantity <= 0.25}>
                          <Text
                            style={[styles.stepperButtonText, { fontSize: 16, color: themeColors.text }]}
                            weight="semibold">
                            −
                          </Text>
                        </TouchableOpacity>

                        {isEditingQuantity ? (
                          <TextInput
                            ref={quantityInputRef}
                            style={[
                              styles.quantityValueInput,
                              {
                                backgroundColor: themeColors.background,
                                color: themeColors.text,
                                borderColor: themeColors.primary,
                              },
                            ]}
                            value={quantityInputValue}
                            onChangeText={(text) => {
                              setQuantityInputValue(text);
                              const num = parseFloat(text);
                              if (!isNaN(num) && num >= 0.25 && num <= 10) {
                                setQuantity(num);
                              }
                            }}
                            onFocus={() => {
                              // Input will be visible due to KeyboardAvoidingView
                            }}
                            onBlur={() => {
                              const num = parseFloat(quantityInputValue);
                              if (isNaN(num) || num < 0.25) {
                                setQuantity(0.25);
                                setQuantityInputValue('0.25');
                              } else if (num > 10) {
                                setQuantity(10);
                                setQuantityInputValue('10');
                              } else {
                                setQuantity(num);
                                setQuantityInputValue(num.toString());
                              }
                              setIsEditingQuantity(false);
                            }}
                            keyboardType="decimal-pad"
                            autoFocus
                            selectTextOnFocus
                          />
                        ) : (
                          <TouchableOpacity
                            style={styles.quantityValueDisplay}
                            onPress={() => {
                              haptics.light();
                              setIsEditingQuantity(true);
                              setQuantityInputValue(quantity.toString());
                            }}>
                            <Text variant="body" weight="semibold" style={{ textAlign: 'center' }}>
                              {formatQuantityDisplay(quantity)}
                            </Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={[
                            styles.stepperButton,
                            {
                              backgroundColor: themeColors.primary,
                              opacity: quantity < 10 ? 1 : 0.4,
                            },
                          ]}
                          onPress={() => {
                            if (quantity < 10) {
                              haptics.light();
                              const newValue = Math.min(10, quantity + 1);
                              setQuantity(newValue);
                              setQuantityInputValue(newValue.toString());
                            }
                          }}
                          disabled={quantity >= 10}>
                          <Text
                            style={[styles.stepperButtonText, { fontSize: 16, color: themeColors.textInverse }]}
                            weight="semibold">
                            +
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <View style={styles.modalActions}>
                    <Button
                      variant="secondary"
                      size="md"
                      fullWidth
                      onPress={() => {
                        haptics.light();
                        setShowQuantityModal(false);
                      }}
                      style={styles.modalCancelButton}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      fullWidth
                      onPress={handleLogFood}
                      style={styles.modalLogButton}>
                      Log
                    </Button>
                  </View>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxxl,
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
  mealSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  mealButton: {
    flex: 1,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    minHeight: 32,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchInput: {
    height: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    fontSize: 16,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  resultsList: {
    gap: spacing.sm,
  },
  foodCard: {
    marginBottom: spacing.sm,
  },
  foodCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodInfo: {
    flex: 1,
  },
  foodMacros: {
    alignItems: 'flex-end',
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  scanOptionsContainer: {
    marginBottom: spacing.sm,
  },
  scanCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  scanCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  scanIcon: {
    fontSize: 24,
  },
  scanTextContainer: {
    flex: 1,
  },
  arrowIcon: {
    fontSize: 18,
    opacity: 0.5,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalOverlayTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  modalKeyboardAvoid: {
    width: '100%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  modalContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  modalHeaderContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  modalServingSize: {
    marginTop: spacing.xs,
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalNutritionInfo: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantitySection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  quantityLabel: {
    marginBottom: spacing.sm,
  },
  quantityControls: {
    width: '100%',
    alignItems: 'center',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: {
    lineHeight: 20,
  },
  quantityValueDisplay: {
    minWidth: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  quantityValueInput: {
    minWidth: 54,
    height: 36,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    borderWidth: 2,
    fontSize: 16,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalCancelButton: {
    flex: 1,
  },
  modalLogButton: {
    flex: 1,
  },
});

