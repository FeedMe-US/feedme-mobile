/**
 * Log Service - Handles food logging with backend persistence
 *
 * Uses types from api.ts which are generated from OpenAPI spec.
 */

import { apiClient } from './api';
import { MealType } from '../store/DailyTrackingContext';
import { NetworkError, ApiError } from '@/src/types/errors';
import { getPacificDate } from '@/src/utils/dateUtils';
import type {
  LogResponse as ApiLogResponse,
  LogItemRequest,
  DailyTrackingResponse,
  FoodLogEntry,
} from '@/src/types/api';

// Re-export types for consumers
export type { LogItemRequest as LogItem, FoodLogEntry as LogEntry };

// Source type matching backend schema
export type LogSource = 'recommendation' | 'manual' | 'photo_ai' | 'barcode';

// Track API status
let isApiAvailable = true;
let lastApiError: Error | null = null;

export const getLogApiStatus = () => ({
  isAvailable: isApiAvailable,
  lastError: lastApiError,
});

export const logService = {
  /**
   * Log a meal to the backend
   * POST /log
   */
  async logMeal(
    items: LogItemRequest[],
    mealType: MealType,
    source: LogSource = 'manual',
    date?: string
  ): Promise<ApiLogResponse | null> {
    try {
      const mealDate = date || getPacificDate();
      const response = await apiClient.post<ApiLogResponse>('/log', {
        meal_date: mealDate,  // Backend expects meal_date, not date
        meal_type: mealType,
        items,
        source,
      });

      if (response.error) {
        isApiAvailable = false;
        lastApiError = new ApiError(response.status, 'API_ERROR', response.error);
        console.warn('[logService] Failed to log meal:', response.error);
        return null;
      }

      isApiAvailable = true;
      lastApiError = null;
      return response.data || null;
    } catch (error) {
      isApiAvailable = false;
      lastApiError = error instanceof Error ? error : new NetworkError();
      console.warn('[logService] Network error logging meal:', error);
      return null;
    }
  },

  /**
   * Get logged meals for a specific date
   * GET /log?log_date={date}
   */
  async getLogsForDate(date: string): Promise<FoodLogEntry[]> {
    try {
      // Backend uses query param: GET /log?log_date=YYYY-MM-DD
      const response = await apiClient.get<DailyTrackingResponse>(`/log?log_date=${date}`);

      if (response.error) {
        isApiAvailable = false;
        lastApiError = new ApiError(response.status, 'API_ERROR', response.error);
        console.warn('[logService] Failed to get logs:', response.error);
        return [];
      }

      isApiAvailable = true;
      lastApiError = null;
      return response.data?.entries || [];
    } catch (error) {
      isApiAvailable = false;
      lastApiError = error instanceof Error ? error : new NetworkError();
      console.warn('[logService] Network error getting logs:', error);
      return [];
    }
  },

  /**
   * Get daily tracking data (entries + totals)
   * GET /log?log_date={date}
   */
  async getDailyTracking(date: string): Promise<DailyTrackingResponse | null> {
    try {
      const response = await apiClient.get<DailyTrackingResponse>(`/log?log_date=${date}`);

      if (response.error) {
        isApiAvailable = false;
        lastApiError = new ApiError(response.status, 'API_ERROR', response.error);
        console.warn('[logService] Failed to get daily tracking:', response.error);
        return null;
      }

      isApiAvailable = true;
      lastApiError = null;
      return response.data || null;
    } catch (error) {
      isApiAvailable = false;
      lastApiError = error instanceof Error ? error : new NetworkError();
      console.warn('[logService] Network error getting daily tracking:', error);
      return null;
    }
  },

  /**
   * Delete a logged meal
   * DELETE /log/{log_id}
   */
  async deleteLog(logId: string): Promise<boolean> {
    try {
      const response = await apiClient.delete(`/log/${logId}`);

      if (response.error) {
        isApiAvailable = false;
        lastApiError = new ApiError(response.status, 'API_ERROR', response.error);
        console.warn('[logService] Failed to delete log:', response.error);
        return false;
      }

      isApiAvailable = true;
      lastApiError = null;
      return true;
    } catch (error) {
      isApiAvailable = false;
      lastApiError = error instanceof Error ? error : new NetworkError();
      console.warn('[logService] Network error deleting log:', error);
      return false;
    }
  },

  /**
   * Update a logged meal
   * PUT /log/{log_id}
   * Backend expects { items: LogItemRequest[] }
   */
  async updateLog(logId: string, items: LogItemRequest[]): Promise<ApiLogResponse | null> {
    try {
      const response = await apiClient.put<ApiLogResponse>(`/log/${logId}`, { items });

      if (response.error) {
        isApiAvailable = false;
        lastApiError = new ApiError(response.status, 'API_ERROR', response.error);
        console.warn('[logService] Failed to update log:', response.error);
        return null;
      }

      isApiAvailable = true;
      lastApiError = null;
      return response.data || null;
    } catch (error) {
      isApiAvailable = false;
      lastApiError = error instanceof Error ? error : new NetworkError();
      console.warn('[logService] Network error updating log:', error);
      return null;
    }
  },

  /**
   * Get daily summary with totals
   * Uses GET /log?log_date={date} which returns DailyTrackingResponse with totals
   * @deprecated Use getDailyTracking instead which returns the full response
   */
  async getDailySummary(date: string): Promise<DailyTrackingResponse | null> {
    return this.getDailyTracking(date);
  },
};
