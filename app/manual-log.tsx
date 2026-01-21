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

  const loadRecentFoods = async () => {
    const recent = await foodService.getRecentFoods();
    setRecentFoods(recent);
  };

  const searchFoods = async () => {
    const results = await foodService.searchFoods(searchQuery);
    setSearchResults(results);
  };

  const handleAddFood = (food: FoodItem) => {
    haptics.success();
    addMeal({
      name: food.name,
      mealType: selectedMeal,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fat,
      quantity: 1,
    });
    foodService.addToRecent(food.id);
    router.back();
  };

  const scrollViewRef = useRef<ScrollView>(null);
  const searchInputRef = useRef<TextInput>(null);

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}>
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
              // Scroll to top when search is focused
              setTimeout(() => {
                scrollViewRef.current?.scrollTo({ y: 0, animated: true });
              }, 100);
            }}
            onBlur={() => {
              // Delay to allow tap events on results
              setTimeout(() => setIsSearchFocused(false), 200);
            }}
            returnKeyType="search"
            blurOnSubmit={false}
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
                    onTouchEnd={() => handleAddFood(food)}>
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
                      onTouchEnd={() => handleAddFood(food)}>
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
});

