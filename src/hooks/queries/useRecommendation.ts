/**
 * Recommendation Query Hooks
 * ==========================
 * TanStack Query hooks for meal recommendations.
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys } from '@/src/lib/queryClient';
import { api } from '@/src/api';
import { getPacificDate } from '@/src/utils/dateUtils';
import type {
  RecommendRequest,
  RecommendResponse,
  MealPeriod,
} from '@/src/types/api';
import type { DayPlanResponse, RecommendDayRequest } from '@/src/api/endpoints/recommend';

/**
 * Fetch a single meal recommendation
 * Uses mutation since recommendations are generated on-demand
 */
export function useRecommendation() {
  return useMutation({
    mutationFn: async (request: RecommendRequest) => {
      const response = await api.recommend.getRecommendation(request);

      // 204 means no recommendation available
      if (response.status === 204) {
        return null;
      }

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data as RecommendResponse;
    },
  });
}

/**
 * Fetch a full day meal plan recommendation
 */
export function useDayRecommendation() {
  return useMutation({
    mutationFn: async (request: RecommendDayRequest = {}) => {
      const response = await api.recommend.getDayRecommendation(request);

      // 204 means no plan available
      if (response.status === 204) {
        return null;
      }

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data as DayPlanResponse;
    },
  });
}

/**
 * Fetch pre-computed day plan (cached on backend)
 */
export function useDayPlan(planDate?: string) {
  const date = planDate || getPacificDate();

  return useQuery({
    queryKey: queryKeys.dayplan.date(date),
    queryFn: async () => {
      const response = await api.dayplan.getDayPlan(planDate);

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - day plans don't change often
  });
}

/**
 * Helper to create a recommend request
 */
export function createRecommendRequest(
  mealPeriod: MealPeriod,
  locationId: number,
  options?: {
    date?: string;
    excludedRecipeIds?: string[];
  }
): RecommendRequest {
  return {
    meal_period: mealPeriod,
    location_id: locationId,
    date: options?.date,
    excluded_recipe_ids: options?.excludedRecipeIds,
  };
}
