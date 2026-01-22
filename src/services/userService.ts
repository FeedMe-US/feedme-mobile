/**
 * User Service - Handles user profile and targets from backend
 * Includes local caching for offline support
 *
 * Uses types from api.ts which are generated from OpenAPI spec.
 */

import { apiClient } from './api';
import { NetworkError, ApiError } from '@/src/types/errors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  TargetsResponse,
  ProgressResponse,
  UserProfileResponse,
  UserProfileUpdateRequest,
  UserProfileUpdateRequestExtended,
  AdjustedTargetsResponse,
} from '@/src/types/api';

const CACHE_KEYS = {
  TARGETS: '@FeedMe:userTargets',
  PROFILE: '@FeedMe:userProfile',
};

// Simplified targets interface for components that just need the numbers
export interface SimpleTargets {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  adjusted?: boolean;
}

// Weight tracking types
export interface WeightLogEntry {
  id: string;
  weight_lbs: number;
  logged_at: string;
  source: 'manual' | 'inferred';
}

export interface WeightLogResponse {
  id: string;
  weight_lbs: number;
  logged_at: string;
  targets_recalculated: boolean;
}

export interface WeightHistoryResponse {
  entries: WeightLogEntry[];
  current_weight: number | null;
  goal_weight: number | null;
  start_weight: number | null;
  total_change: number | null;
}

// Track API status
let isApiAvailable = true;
let lastApiError: Error | null = null;

export const getUserApiStatus = () => ({
  isAvailable: isApiAvailable,
  lastError: lastApiError,
});

// Default targets to use when API is unavailable
const DEFAULT_TARGETS: SimpleTargets = {
  calories: 2000,
  protein_g: 150,
  carbs_g: 200,
  fat_g: 65,
  adjusted: false,
};

// Cache helpers
async function getCachedTargets(): Promise<SimpleTargets | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEYS.TARGETS);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

async function setCachedTargets(targets: SimpleTargets): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEYS.TARGETS, JSON.stringify(targets));
  } catch (error) {
    console.warn('[userService] Failed to cache targets:', error);
  }
}

async function getCachedProfile(): Promise<UserProfileResponse | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEYS.PROFILE);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

async function setCachedProfile(profile: UserProfileResponse): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (error) {
    console.warn('[userService] Failed to cache profile:', error);
  }
}

export const userService = {
  /**
   * Get user's adjusted daily nutrition targets
   * GET /user/targets
   *
   * Returns the full response including adjustment info and week summary.
   * For simple use cases, use getSimpleTargets() which extracts just the numbers.
   */
  async getTargetsResponse(): Promise<TargetsResponse | null> {
    try {
      const response = await apiClient.get<TargetsResponse>('/user/targets');

      if (response.error) {
        isApiAvailable = false;
        lastApiError = new ApiError(response.status, 'API_ERROR', response.error);
        console.warn('[userService] Failed to get targets:', response.error);
        return null;
      }

      isApiAvailable = true;
      lastApiError = null;

      // Cache the adjusted targets for offline
      if (response.data?.targets) {
        const simple: SimpleTargets = {
          calories: response.data.targets.calories,
          protein_g: response.data.targets.protein_g,
          carbs_g: response.data.targets.carbs_g,
          fat_g: response.data.targets.fat_g,
          adjusted: response.data.adjustment?.factor !== 1.0,
        };
        await setCachedTargets(simple);
      }

      return response.data || null;
    } catch (error) {
      isApiAvailable = false;
      lastApiError = error instanceof Error ? error : new NetworkError();
      console.warn('[userService] Network error getting targets:', error);
      return null;
    }
  },

  /**
   * Get simplified targets (just the numbers)
   * For components that don't need the full context.
   */
  async getTargets(): Promise<SimpleTargets> {
    const fullResponse = await this.getTargetsResponse();

    if (fullResponse?.targets) {
      return {
        calories: fullResponse.targets.calories,
        protein_g: fullResponse.targets.protein_g,
        carbs_g: fullResponse.targets.carbs_g,
        fat_g: fullResponse.targets.fat_g,
        adjusted: fullResponse.adjustment?.factor !== 1.0,
      };
    }

    // Fallback to cached or default
    const cached = await getCachedTargets();
    return cached || DEFAULT_TARGETS;
  },

  /**
   * Get user profile (includes preferences)
   * GET /user/profile
   */
  async getProfile(): Promise<UserProfileResponse | null> {
    try {
      const response = await apiClient.get<UserProfileResponse>('/user/profile');

      if (response.error) {
        isApiAvailable = false;
        lastApiError = new ApiError(response.status, 'API_ERROR', response.error);
        console.warn('[userService] Failed to get profile:', response.error);
        // Try cached
        return getCachedProfile();
      }

      isApiAvailable = true;
      lastApiError = null;

      if (response.data) {
        await setCachedProfile(response.data);
      }

      return response.data || null;
    } catch (error) {
      isApiAvailable = false;
      lastApiError = error instanceof Error ? error : new NetworkError();
      console.warn('[userService] Network error getting profile:', error);
      return getCachedProfile();
    }
  },

  /**
   * Get user's weekly or monthly progress stats
   * GET /user/progress?period={week|month}
   */
  async getProgress(period: 'week' | 'month' = 'week'): Promise<ProgressResponse | null> {
    try {
      const response = await apiClient.get<ProgressResponse>(`/user/progress?period=${period}`);

      if (response.error) {
        isApiAvailable = false;
        lastApiError = new ApiError(response.status, 'API_ERROR', response.error);
        console.warn('[userService] Failed to get progress:', response.error);
        return null;
      }

      isApiAvailable = true;
      lastApiError = null;
      return response.data || null;
    } catch (error) {
      isApiAvailable = false;
      lastApiError = error instanceof Error ? error : new NetworkError();
      console.warn('[userService] Network error getting progress:', error);
      return null;
    }
  },

  /**
   * Update user profile (includes preferences)
   * PUT /user/profile
   */
  async updateProfile(updates: UserProfileUpdateRequestExtended): Promise<UserProfileResponse | null> {
    try {
      const response = await apiClient.put<UserProfileResponse>('/user/profile', updates);

      if (response.error) {
        isApiAvailable = false;
        lastApiError = new ApiError(response.status, 'API_ERROR', response.error);
        console.warn('[userService] Failed to update profile:', response.error);
        return null;
      }

      isApiAvailable = true;
      lastApiError = null;

      // Update cache
      if (response.data) {
        await setCachedProfile(response.data);
      }

      return response.data || null;
    } catch (error) {
      isApiAvailable = false;
      lastApiError = error instanceof Error ? error : new NetworkError();
      console.warn('[userService] Network error updating profile:', error);
      return null;
    }
  },

  /**
   * Send thumbs-up for a recipe (increases affinity)
   * POST /preference/thumbs-up
   */
  async thumbsUp(recipeId: string): Promise<boolean> {
    try {
      const response = await apiClient.post('/preference/thumbs-up', { recipe_id: recipeId });

      if (response.error) {
        console.warn('[userService] Failed to record thumbs-up:', response.error);
        return false;
      }

      return true;
    } catch (error) {
      console.warn('[userService] Network error recording thumbs-up:', error);
      return false;
    }
  },

  /**
   * Block a recipe permanently
   * POST /preference/block
   */
  async blockRecipe(recipeId: string): Promise<boolean> {
    try {
      const response = await apiClient.post('/preference/block', { recipe_id: recipeId });

      if (response.error) {
        console.warn('[userService] Failed to block recipe:', response.error);
        return false;
      }

      return true;
    } catch (error) {
      console.warn('[userService] Network error blocking recipe:', error);
      return false;
    }
  },

  /**
   * Unblock a recipe
   * DELETE /preference/block/{recipe_id}
   */
  async unblockRecipe(recipeId: string): Promise<boolean> {
    try {
      const response = await apiClient.delete(`/preference/block/${recipeId}`);

      if (response.error) {
        console.warn('[userService] Failed to unblock recipe:', response.error);
        return false;
      }

      return true;
    } catch (error) {
      console.warn('[userService] Network error unblocking recipe:', error);
      return false;
    }
  },

  // =========================================================================
  // Weight Tracking
  // =========================================================================

  /**
   * Log a weight entry
   * POST /user/weight
   *
   * Logging weight will:
   * 1. Store the entry in weight history
   * 2. Update user's current weight
   * 3. Recalculate macro targets based on new weight
   */
  async logWeight(weightLbs: number): Promise<WeightLogResponse | null> {
    try {
      const response = await apiClient.post<WeightLogResponse>('/user/weight', {
        weight_lbs: weightLbs,
      });

      if (response.error) {
        console.warn('[userService] Failed to log weight:', response.error);
        return null;
      }

      return response.data || null;
    } catch (error) {
      console.warn('[userService] Network error logging weight:', error);
      return null;
    }
  },

  /**
   * Get weight history
   * GET /user/weight-history?weeks={N}
   */
  async getWeightHistory(weeks: number = 8): Promise<WeightHistoryResponse | null> {
    try {
      const response = await apiClient.get<WeightHistoryResponse>(
        `/user/weight-history?weeks=${weeks}`
      );

      if (response.error) {
        console.warn('[userService] Failed to get weight history:', response.error);
        return null;
      }

      return response.data || null;
    } catch (error) {
      console.warn('[userService] Network error getting weight history:', error);
      return null;
    }
  },

  // =========================================================================
  // Macro Customization
  // =========================================================================

  /**
   * Update macro customization preferences
   * PUT /user/profile (with macro-specific fields)
   *
   * This is a convenience method that updates only macro-related settings:
   * - carb_fat_ratio: How remaining calories are split (1.5 = 60% carbs / 40% fat)
   * - protein_locked: Whether protein auto-calculates from body weight
   * - protein_multiplier: Custom g/lb when protein is unlocked
   * - macros_custom_override: If true, skip all auto-recalculation
   */
  async updateMacroPreferences(prefs: {
    carb_fat_ratio?: number;
    protein_locked?: boolean;
    protein_multiplier?: number;
    macros_custom_override?: boolean;
  }): Promise<UserProfileResponse | null> {
    return this.updateProfile(prefs);
  },

  // =========================================================================
  // Preference Reset
  // =========================================================================

  /**
   * Reset all learned food preferences
   * DELETE /user/preferences/reset
   *
   * This clears all affinity scores from user_food_preferences.
   * Dietary restrictions and allergen exclusions are NOT affected.
   */
  async resetPreferences(): Promise<boolean> {
    try {
      const response = await apiClient.delete('/user/preferences/reset');

      if (response.error) {
        console.warn('[userService] Failed to reset preferences:', response.error);
        return false;
      }

      return true;
    } catch (error) {
      console.warn('[userService] Network error resetting preferences:', error);
      return false;
    }
  },
};

// Export types for backwards compatibility
export type { SimpleTargets as UserTargets };
export type { UserProfileResponse, ProgressResponse };
