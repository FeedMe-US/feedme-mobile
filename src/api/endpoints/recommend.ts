/**
 * Recommend API Endpoints
 * =======================
 * Type-safe wrappers for /recommend/* endpoints
 *
 * Contract source: backend/api/src/contracts/recommend.py
 *
 * Note: Rate limited to 10 recommendations per day
 */

import { apiClient } from '@/src/services/api';
import type {
  RecommendRequest,
  RecommendResponse,
  MealType,
  Macros,
} from '@/src/types/api';

// Day plan request/response types for POST /recommend/day
export interface RecommendDayRequest {
  date?: string;
  preferred_location_ids?: number[];
}

export interface DayPlanMealItem {
  recipe_id: string;
  name: string;
  servings: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface DayPlanMeal {
  meal_type: MealType;
  location_id: number;
  location_name: string;
  items: DayPlanMealItem[];
  totals: Macros;
}

export interface DayPlanData {
  meals: DayPlanMeal[];
  totals: Macros;
}

export interface DayPlanResponse {
  day_plan: DayPlanData;
  targets: Macros;
}

/**
 * Generate a single meal plate recommendation
 * POST /recommend
 * Auth: Yes
 * Rate Limit: 10/day
 *
 * Returns 204 No Content if no suitable plate found
 */
export async function getRecommendation(request: RecommendRequest) {
  return apiClient.post<RecommendResponse>('/recommend', request);
}

/**
 * Generate a full day meal plan
 * POST /recommend/day
 * Auth: Yes
 *
 * Returns 204 No Content if no suitable plan found
 */
export async function getDayRecommendation(request: RecommendDayRequest) {
  return apiClient.post<DayPlanResponse>('/recommend/day', request);
}
