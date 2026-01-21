/**
 * Recommendation Service
 * Handles meal recommendation requests to the backend API
 */

import { apiClient } from './api';

// Types matching backend schemas
export type MealPeriod = 'breakfast' | 'lunch' | 'dinner' | 'late_night';

export interface MacroTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface LocationBrief {
  id: number;
  name: string;
}

export interface PlateItem {
  recipe_id: string;
  name: string;
  servings: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface Plate {
  items: PlateItem[];
  totals: MacroTotals;
  fit_score: number;
  preference_score: number;
}

export interface RecommendResponse {
  plate: Plate;
  targets: MacroTotals;
  location: LocationBrief;
  meal_period: string;
  date: string;
}

export interface MealPlan {
  meal_label: string;
  time_window: string;
  location: LocationBrief;
  plate: Plate;
}

export interface DayPlan {
  date: string;
  meals: MealPlan[];
  totals: MacroTotals;
  overall_fit_score: number;
}

export interface DayPlanTargets extends MacroTotals {
  adjustment_factor: number;
}

export interface DayPlanResponse {
  day_plan: DayPlan;
  targets: DayPlanTargets;
}

// Service status tracking
interface ServiceStatus {
  isAvailable: boolean;
  lastError: string | null;
  remainingRerolls: number | null;
}

let serviceStatus: ServiceStatus = {
  isAvailable: true,
  lastError: null,
  remainingRerolls: null,
};

class RecommendService {
  /**
   * Get a meal plate recommendation for a specific location and meal period
   *
   * @param locationId - The dining location ID
   * @param mealPeriod - The meal period (breakfast, lunch, dinner, late_night)
   * @param excludedRecipeIds - Recipe IDs to exclude (for rerolls)
   * @param date - Optional date (defaults to today)
   * @returns Recommendation response or null if none found
   */
  async getRecommendation(
    locationId: number,
    mealPeriod: MealPeriod,
    excludedRecipeIds: string[] = [],
    date?: string,
  ): Promise<RecommendResponse | null> {
    const body: {
      location_id: number;
      meal_period: MealPeriod;
      excluded_recipe_ids: string[];
      date?: string;
    } = {
      location_id: locationId,
      meal_period: mealPeriod,
      excluded_recipe_ids: excludedRecipeIds,
    };

    if (date) {
      body.date = date;
    }

    const response = await apiClient.post<RecommendResponse>('/recommend', body);

    if (response.status === 204) {
      // No recommendation found (no menu items available)
      serviceStatus.isAvailable = true;
      serviceStatus.lastError = null;
      return null;
    }

    if (response.error) {
      serviceStatus.lastError = response.error;

      // Check for rate limit
      if (response.status === 429) {
        serviceStatus.remainingRerolls = 0;
        serviceStatus.lastError = 'Daily reroll limit reached (10/day)';
      }

      return null;
    }

    serviceStatus.isAvailable = true;
    serviceStatus.lastError = null;
    return response.data!;
  }

  /**
   * Get a full day meal plan
   *
   * @param date - Optional date (defaults to today)
   * @param preferredLocationIds - Optional list of preferred location IDs
   * @returns Day plan response or null if none found
   */
  async getDayPlan(
    date?: string,
    preferredLocationIds: number[] = [],
  ): Promise<DayPlanResponse | null> {
    const body: {
      date?: string;
      preferred_location_ids: number[];
    } = {
      preferred_location_ids: preferredLocationIds,
    };

    if (date) {
      body.date = date;
    }

    const response = await apiClient.post<DayPlanResponse>('/recommend/day', body);

    if (response.status === 204) {
      // No plan found
      serviceStatus.isAvailable = true;
      serviceStatus.lastError = null;
      return null;
    }

    if (response.error) {
      serviceStatus.lastError = response.error;
      return null;
    }

    serviceStatus.isAvailable = true;
    serviceStatus.lastError = null;
    return response.data!;
  }

  /**
   * Reroll a recommendation (get a new one excluding previous items)
   *
   * @param locationId - The dining location ID
   * @param mealPeriod - The meal period
   * @param currentPlate - The current plate to exclude
   * @param previouslyExcluded - Previously excluded recipe IDs
   * @param date - Optional date
   * @returns New recommendation or null
   */
  async reroll(
    locationId: number,
    mealPeriod: MealPeriod,
    currentPlate: Plate,
    previouslyExcluded: string[] = [],
    date?: string,
  ): Promise<RecommendResponse | null> {
    // Build exclusion list from current plate items and previously excluded
    const excludedIds = [
      ...previouslyExcluded,
      ...currentPlate.items.map(item => item.recipe_id),
    ];

    return this.getRecommendation(locationId, mealPeriod, excludedIds, date);
  }

  /**
   * Get service status
   */
  getStatus(): ServiceStatus {
    return { ...serviceStatus };
  }

  /**
   * Check if rerolls are available
   */
  hasRerollsRemaining(): boolean {
    return serviceStatus.remainingRerolls === null || serviceStatus.remainingRerolls > 0;
  }
}

export const recommendService = new RecommendService();
