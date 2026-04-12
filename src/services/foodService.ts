/**
 * Food Service - Service for food search and logging
 * Connects to the FeedMe backend API with stub fallback
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api';
import { getPacificDate } from '@/src/utils/dateUtils';

export interface FoodItem {
  id: string;
  name: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tags?: string[];
  allergens?: string[];
}

// API Response Types
interface MenuItemResponse {
  recipe_id: string;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  tags: string[];
  allergens: string[];
}

interface MenuSectionResponse {
  name: string;
  items: MenuItemResponse[];
}

interface MealMenuResponse {
  sections: MenuSectionResponse[];
}

interface MenuResponse {
  location: { id: number; name: string };
  date: string;
  meals: Record<string, MealMenuResponse>;
}

const STUB_FOODS: FoodItem[] = [
  { id: '1', name: 'Grilled Chicken Breast', servingSize: '6 oz', calories: 280, protein: 52, carbs: 0, fat: 6 },
  { id: '2', name: 'Brown Rice', servingSize: '1 cup', calories: 216, protein: 5, carbs: 45, fat: 2 },
  { id: '3', name: 'Salmon', servingSize: '5 oz', calories: 280, protein: 39, carbs: 0, fat: 12 },
  { id: '4', name: 'Broccoli', servingSize: '1 cup', calories: 55, protein: 4, carbs: 11, fat: 0 },
  { id: '5', name: 'Greek Yogurt', servingSize: '1 cup', calories: 130, protein: 20, carbs: 9, fat: 0 },
  { id: '6', name: 'Banana', servingSize: '1 medium', calories: 105, protein: 1, carbs: 27, fat: 0 },
  { id: '7', name: 'Oatmeal', servingSize: '1 cup', calories: 166, protein: 6, carbs: 28, fat: 4 },
  { id: '8', name: 'Eggs', servingSize: '2 large', calories: 140, protein: 12, carbs: 1, fat: 10 },
  { id: '9', name: 'Avocado', servingSize: '1/2', calories: 160, protein: 2, carbs: 9, fat: 15 },
  { id: '10', name: 'Sweet Potato', servingSize: '1 medium', calories: 103, protein: 2, carbs: 24, fat: 0 },
];

const RECENT_FOODS_KEY = '@FeedMe:recentFoods';

// Flag to enable/disable API calls (set to false to use stub data only)
const USE_API = true;

// Cache for menu items fetched from API
let menuItemsCache: FoodItem[] = [];

/**
 * Fetch menu items from a location and cache them for searching
 */
async function fetchMenuItems(locationId: number): Promise<FoodItem[]> {
  const today = getPacificDate();
  const response = await apiClient.get<MenuResponse>(`/menu/${locationId}/${today}`);

  if (!response.data?.meals) {
    return [];
  }

  const items: FoodItem[] = [];

  for (const [, mealMenu] of Object.entries(response.data.meals)) {
    for (const section of mealMenu.sections) {
      for (const item of section.items) {
        items.push({
          id: item.recipe_id,
          name: item.name,
          servingSize: '1 serving',
          calories: item.calories,
          protein: item.protein_g,
          carbs: item.carbs_g,
          fat: item.fat_g,
          tags: item.tags,
          allergens: item.allergens,
        });
      }
    }
  }

  return items;
}

// API response for food search (v1 USDA-only and v2 multi-source)
interface FoodSearchResponse {
  success: boolean;
  foods: Array<{
    id: string;
    name: string;
    brand?: string;
    serving_size: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g?: number;
    sugar_g?: number;
    sodium_mg?: number;
    source?: 'usda_foundation' | 'open_food_facts' | 'usda_branded';
  }>;
  error?: string;
}

type USDAFoodSearchResponse = FoodSearchResponse;

export const foodService = {
  /**
   * Search for foods by name using USDA FoodData Central API
   */
  async searchFoods(query: string): Promise<FoodItem[]> {
    if (!query || query.length < 2) {
      return [];
    }

    // Try USDA API first
    if (USE_API) {
      try {
        const response = await apiClient.get<USDAFoodSearchResponse>(
          `/food/search?q=${encodeURIComponent(query)}&limit=25`
        );

        if (response.data?.success && response.data.foods.length > 0) {
          return response.data.foods.map((food) => ({
            id: food.id,
            name: food.brand ? `${food.name} (${food.brand})` : food.name,
            servingSize: food.serving_size,
            calories: Math.round(food.calories),
            protein: Math.round(food.protein_g),
            carbs: Math.round(food.carbs_g),
            fat: Math.round(food.fat_g),
          }));
        }
      } catch (error) {
        console.log('[foodService] USDA search failed, using local data:', error);
      }
    }

    // Try menu items cache
    const lowerQuery = query.toLowerCase();
    if (menuItemsCache.length > 0) {
      const results = menuItemsCache.filter(
        (food) =>
          food.name.toLowerCase().includes(lowerQuery) ||
          food.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
      );
      if (results.length > 0) {
        return results;
      }
    }

    // Fallback to stub data
    return STUB_FOODS.filter(
      (food) =>
        food.name.toLowerCase().includes(lowerQuery) ||
        food.servingSize.toLowerCase().includes(lowerQuery)
    );
  },

  /**
   * Search using the v2 multi-source endpoint (USDA Foundation + Open Food Facts + Branded).
   * Falls back to v1 searchFoods() if v2 returns nothing.
   */
  async searchFoodsV2(query: string): Promise<FoodItem[]> {
    if (!query || query.length < 2) {
      return [];
    }

    if (USE_API) {
      try {
        const response = await apiClient.get<FoodSearchResponse>(
          `/v2/food/search?q=${encodeURIComponent(query)}&limit=20`
        );

        if (response.data?.success && response.data.foods.length > 0) {
          return response.data.foods.map((food) => ({
            id: food.id,
            name: food.brand ? `${food.name} (${food.brand})` : food.name,
            servingSize: food.serving_size,
            calories: Math.round(food.calories),
            protein: Math.round(food.protein_g),
            carbs: Math.round(food.carbs_g),
            fat: Math.round(food.fat_g),
          }));
        }
      } catch (error) {
        console.log('[foodService] v2 search failed, falling back to v1:', error);
      }
    }

    // Fall back to v1 if v2 returns nothing or fails
    return foodService.searchFoods(query);
  },

  /**
   * Refresh the menu items cache for a specific location
   */
  async refreshMenuItems(locationId: number): Promise<void> {
    if (!USE_API) return;

    try {
      const items = await fetchMenuItems(locationId);
      // Merge with existing cache, avoiding duplicates
      const existingIds = new Set(menuItemsCache.map((i) => i.id));
      const newItems = items.filter((i) => !existingIds.has(i.id));
      menuItemsCache = [...menuItemsCache, ...newItems];
    } catch (error) {
      console.log('Failed to refresh menu items:', error);
    }
  },

  /**
   * Get recently logged foods
   */
  async getRecentFoods(): Promise<FoodItem[]> {
    try {
      const recentIds = await AsyncStorage.getItem(RECENT_FOODS_KEY);
      if (!recentIds) return [];

      const ids = JSON.parse(recentIds) as string[];

      // Search in both cache and stub foods
      const allFoods = [...menuItemsCache, ...STUB_FOODS];

      return ids
        .map((id) => allFoods.find((food) => food.id === id))
        .filter((food): food is FoodItem => food !== undefined);
    } catch {
      return [];
    }
  },

  /**
   * Add a food to the recent foods list
   */
  async addToRecent(foodId: string): Promise<void> {
    try {
      const recentIds = await AsyncStorage.getItem(RECENT_FOODS_KEY);
      const ids = recentIds ? (JSON.parse(recentIds) as string[]) : [];

      // Remove if already exists, then add to front
      const filtered = ids.filter((id) => id !== foodId);
      const updated = [foodId, ...filtered].slice(0, 10); // Keep last 10

      await AsyncStorage.setItem(RECENT_FOODS_KEY, JSON.stringify(updated));
    } catch {
      // Ignore errors
    }
  },

  /**
   * Get all available foods (for browsing)
   */
  async getAllFoods(): Promise<FoodItem[]> {
    if (USE_API && menuItemsCache.length > 0) {
      return [...menuItemsCache];
    }
    return [...STUB_FOODS];
  },
};
