/**
 * Day Plan Service
 * Handles fetching pre-computed day plans from the backend
 */

import { apiClient } from './api';
import { MacroTotals, PlateItem } from './recommendService';

// Types matching backend schemas
export interface DayPlanPlate {
  items: PlateItem[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  fit_score: number;
  preference_score: number;
}

export interface DayPlanMeal {
  meal_label: string;
  location: string;
  time_window: string;
  plate: DayPlanPlate;
}

export interface DayPlan {
  date: string;
  meals: DayPlanMeal[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  overall_fit_score: number;
}

export interface DayPlanTargets {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  adjustment_factor: number;
  capped: boolean;
  cap_direction: string | null;
  week_start: string;
  days_elapsed: number;
  days_remaining: number;
}

export interface DayPlanResponse {
  plan: DayPlan;
  targets: DayPlanTargets;
  generated_at: string;
  stale: boolean;
  source: 'precomputed' | 'regenerated';
  regeneration_reason?: string;
}

// Service status tracking
interface ServiceStatus {
  isAvailable: boolean;
  lastError: string | null;
  lastFetch: number | null;
}

let serviceStatus: ServiceStatus = {
  isAvailable: true,
  lastError: null,
  lastFetch: null,
};

// Cache for current day plan
let cachedDayPlan: DayPlanResponse | null = null;
let cachedDate: string | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class DayPlanService {
  /**
   * Get the pre-computed day plan for a specific date
   *
   * @param date - Optional date in YYYY-MM-DD format (defaults to today)
   * @returns Day plan response or null if unavailable
   */
  async getDayPlan(date?: string): Promise<DayPlanResponse | null> {
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Check cache first
    if (cachedDayPlan && cachedDate === targetDate && serviceStatus.lastFetch) {
      const age = Date.now() - serviceStatus.lastFetch;
      if (age < CACHE_DURATION) {
        return cachedDayPlan;
      }
    }

    const endpoint = date ? `/user/day-plan?plan_date=${date}` : '/user/day-plan';
    const response = await apiClient.get<DayPlanResponse>(endpoint);

    if (response.error) {
      serviceStatus.lastError = response.error;
      serviceStatus.isAvailable = false;
      return cachedDayPlan; // Return stale cache if available
    }

    cachedDayPlan = response.data || null;
    cachedDate = targetDate;
    serviceStatus.isAvailable = true;
    serviceStatus.lastError = null;
    serviceStatus.lastFetch = Date.now();

    return cachedDayPlan;
  }

  /**
   * Get today's day plan
   */
  async getTodaysPlan(): Promise<DayPlanResponse | null> {
    return this.getDayPlan();
  }

  /**
   * Get just the meals for a specific date
   */
  async getMeals(date?: string): Promise<DayPlanMeal[]> {
    const plan = await this.getDayPlan(date);
    return plan?.plan.meals || [];
  }

  /**
   * Get a specific meal from the day plan
   *
   * @param mealLabel - The meal label (e.g., "Breakfast", "Lunch", "Dinner")
   * @param date - Optional date
   */
  async getMeal(mealLabel: string, date?: string): Promise<DayPlanMeal | null> {
    const meals = await this.getMeals(date);
    return meals.find(m => m.meal_label.toLowerCase() === mealLabel.toLowerCase()) || null;
  }

  /**
   * Get targets with adjustment info
   */
  async getTargets(date?: string): Promise<DayPlanTargets | null> {
    const plan = await this.getDayPlan(date);
    return plan?.targets || null;
  }

  /**
   * Check if the day plan is stale and needs refresh
   */
  async isStale(date?: string): Promise<boolean> {
    const plan = await this.getDayPlan(date);
    return plan?.stale ?? true;
  }

  /**
   * Force refresh the day plan (bypasses cache)
   */
  async refresh(date?: string): Promise<DayPlanResponse | null> {
    this.clearCache();
    return this.getDayPlan(date);
  }

  /**
   * Get service status
   */
  getStatus(): ServiceStatus {
    return { ...serviceStatus };
  }

  /**
   * Clear cached data
   */
  clearCache(): void {
    cachedDayPlan = null;
    cachedDate = null;
    serviceStatus.lastFetch = null;
  }

  /**
   * Calculate remaining macros for the day
   *
   * @param consumed - Already consumed macros
   * @param date - Optional date
   */
  async getRemainingMacros(
    consumed: MacroTotals,
    date?: string,
  ): Promise<MacroTotals | null> {
    const targets = await this.getTargets(date);

    if (!targets) {
      return null;
    }

    return {
      calories: Math.max(0, targets.calories - consumed.calories),
      protein_g: Math.max(0, targets.protein_g - consumed.protein_g),
      carbs_g: Math.max(0, targets.carbs_g - consumed.carbs_g),
      fat_g: Math.max(0, targets.fat_g - consumed.fat_g),
    };
  }
}

export const dayPlanService = new DayPlanService();
