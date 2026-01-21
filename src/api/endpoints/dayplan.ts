/**
 * Day Plan API Endpoints
 * ======================
 * Type-safe wrappers for day plan endpoints
 *
 * Contract source: backend/api/src/contracts/user.py
 */

import { apiClient } from '@/src/services/api';

// Day plan types (complex, defined inline for clarity)
export interface PlannedMealItem {
  recipe_id: string;
  name: string;
  servings: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface PlannedMeal {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  location_id: number;
  location_name: string;
  items: PlannedMealItem[];
  totals: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
}

export interface DayPlanData {
  meals: PlannedMeal[];
  totals: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
}

export interface TargetsData {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface PrecomputedDayPlanResponse {
  plan: DayPlanData;
  targets: TargetsData;
  generated_at: string;
  stale: boolean;
  source: 'precomputed' | 'regenerated';
  regeneration_reason?: string;
}

/**
 * Get the pre-computed day plan for a specific date
 * GET /user/day-plan
 * Auth: Yes
 *
 * @param planDate - Optional date in YYYY-MM-DD format (defaults to today)
 *
 * Returns a pre-computed meal plan with targets.
 * May regenerate if the plan is stale or missing.
 */
export async function getDayPlan(planDate?: string) {
  const query = planDate ? `?plan_date=${planDate}` : '';
  return apiClient.get<PrecomputedDayPlanResponse>(`/user/day-plan${query}`);
}
