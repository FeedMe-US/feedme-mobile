/**
 * Analytics Service - Fetches progress and analytics data from backend
 * Uses /user/progress endpoint for real data
 */

import { apiClient } from './api';
import { NetworkError, ApiError } from '@/src/types/errors';

// Backend response types (matching /user/progress response)
export interface DailySummary {
  date: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  meals: number;
  on_target: boolean;
}

export interface ProgressSummaryBackend {
  days_logged: number;
  total_meals: number;
  avg_calories: number;
  avg_protein_g: number;
  target_adherence: number;
}

export interface WeightProgress {
  start?: number;
  current?: number;
  change?: number;
  on_track: boolean;
}

export interface ProgressResponse {
  period: 'week' | 'month';
  start_date: string;
  end_date: string;
  summary: ProgressSummaryBackend;
  daily: DailySummary[];
  weight: WeightProgress;
}

// Legacy types for compatibility with existing UI
export interface DailyStats {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals_logged: number;
}

export interface WeeklyStats {
  week_start: string;
  avg_calories: number;
  avg_protein: number;
  avg_carbs: number;
  avg_fat: number;
  days_logged: number;
  consistency_score: number;
}

export interface MonthlyStats {
  month: string;
  avg_calories: number;
  avg_protein: number;
  total_meals: number;
  consistency_score: number;
  weight_start?: number;
  weight_end?: number;
}

export interface ProgressSummary {
  current_streak: number;
  longest_streak: number;
  total_days_logged: number;
  avg_daily_calories: number;
  avg_daily_protein: number;
  protein_goal_hit_rate: number;
  calorie_goal_hit_rate: number;
}

// Track API status
let isAnalyticsApiAvailable = true;
let lastAnalyticsError: Error | null = null;

export const getAnalyticsApiStatus = () => ({
  isAvailable: isAnalyticsApiAvailable,
  lastError: lastAnalyticsError,
  usingFallback: !isAnalyticsApiAvailable,
});

// Fallback mock data
const getMockDailyStats = (days: number): DailyStats[] => {
  const stats: DailyStats[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    stats.push({
      date: date.toISOString().split('T')[0],
      calories: 2000 + Math.floor(Math.random() * 600) - 300,
      protein: 150 + Math.floor(Math.random() * 60) - 30,
      carbs: 200 + Math.floor(Math.random() * 80) - 40,
      fat: 65 + Math.floor(Math.random() * 30) - 15,
      meals_logged: 2 + Math.floor(Math.random() * 2),
    });
  }

  return stats;
};

const getMockWeeklyStats = (weeks: number): WeeklyStats[] => {
  const stats: WeeklyStats[] = [];
  const today = new Date();

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());

    stats.push({
      week_start: weekStart.toISOString().split('T')[0],
      avg_calories: 2100 + Math.floor(Math.random() * 400) - 200,
      avg_protein: 175 + Math.floor(Math.random() * 50) - 25,
      avg_carbs: 220 + Math.floor(Math.random() * 60) - 30,
      avg_fat: 70 + Math.floor(Math.random() * 20) - 10,
      days_logged: 5 + Math.floor(Math.random() * 3) - 1,
      consistency_score: 70 + Math.floor(Math.random() * 30),
    });
  }

  return stats;
};

const getMockMonthlyStats = (months: number): MonthlyStats[] => {
  const stats: MonthlyStats[] = [];
  const today = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const month = new Date(today);
    month.setMonth(month.getMonth() - i);

    stats.push({
      month: month.toISOString().slice(0, 7),
      avg_calories: 2150 + Math.floor(Math.random() * 300) - 150,
      avg_protein: 180 + Math.floor(Math.random() * 40) - 20,
      total_meals: 60 + Math.floor(Math.random() * 30),
      consistency_score: 65 + Math.floor(Math.random() * 35),
      weight_start: 165 + i * 0.3,
      weight_end: 165 + (i - 1) * 0.3,
    });
  }

  return stats;
};

const getMockProgressSummary = (): ProgressSummary => ({
  current_streak: 5,
  longest_streak: 12,
  total_days_logged: 45,
  avg_daily_calories: 2180,
  avg_daily_protein: 178,
  protein_goal_hit_rate: 0.72,
  calorie_goal_hit_rate: 0.85,
});

// Helper to convert backend daily summary to frontend DailyStats
function convertToDailyStats(daily: DailySummary[]): DailyStats[] {
  return daily.map(d => ({
    date: d.date,
    calories: d.calories,
    protein: d.protein_g,
    carbs: d.carbs_g,
    fat: d.fat_g,
    meals_logged: d.meals,
  }));
}

export const analyticsService = {
  /**
   * Get raw progress data from backend
   */
  async getProgress(period: 'week' | 'month' = 'week'): Promise<ProgressResponse | null> {
    try {
      const response = await apiClient.get<ProgressResponse>(`/user/progress?period=${period}`);

      if (response.error) {
        isAnalyticsApiAvailable = false;
        lastAnalyticsError = new ApiError(response.status, 'API_ERROR', response.error);
        console.warn('[analyticsService] API error:', response.error);
        return null;
      }

      isAnalyticsApiAvailable = true;
      lastAnalyticsError = null;
      return response.data || null;
    } catch (error) {
      isAnalyticsApiAvailable = false;
      lastAnalyticsError = error instanceof Error ? error : new NetworkError();
      console.warn('[analyticsService] Network error:', error);
      return null;
    }
  },

  /**
   * Get daily stats for a date range
   * Uses /user/progress endpoint with week period
   * Returns only real data from backend - no mock data
   */
  async getDailyStats(days: number = 7): Promise<DailyStats[]> {
    const response = await this.getProgress('week');

    if (response && response.daily && response.daily.length > 0) {
      const converted = convertToDailyStats(response.daily);
      // Take the last N days
      return converted.slice(-days);
    }

    // Return empty array if no data available
    return [];
  },

  /**
   * Get weekly stats for a number of weeks
   * Returns only real data from backend - no mock historical data
   */
  async getWeeklyStats(weeks: number = 4): Promise<WeeklyStats[]> {
    // Try to get current week from backend
    const response = await this.getProgress('week');

    if (response && response.summary) {
      const currentWeekStats: WeeklyStats = {
        week_start: response.start_date,
        avg_calories: response.summary.avg_calories,
        avg_protein: response.summary.avg_protein_g,
        avg_carbs: 0, // Backend doesn't return carbs average
        avg_fat: 0, // Backend doesn't return fat average
        days_logged: response.summary.days_logged,
        consistency_score: Math.round(response.summary.target_adherence * 100),
      };

      // Return only real data - no mock historical data
      return [currentWeekStats];
    }

    // Return empty array if no data available
    return [];
  },

  /**
   * Get monthly stats for a number of months
   * Uses /user/progress with month period
   * Returns only real data from backend - no mock historical data
   */
  async getMonthlyStats(months: number = 12): Promise<MonthlyStats[]> {
    // Try to get current month from backend
    const response = await this.getProgress('month');

    if (response && response.summary) {
      const currentMonthStats: MonthlyStats = {
        month: response.start_date.slice(0, 7),
        avg_calories: response.summary.avg_calories,
        avg_protein: response.summary.avg_protein_g,
        total_meals: response.summary.total_meals,
        consistency_score: Math.round(response.summary.target_adherence * 100),
        weight_start: response.weight.start,
        weight_end: response.weight.current,
      };

      // Return only real data - no mock historical data
      return [currentMonthStats];
    }

    // Return empty array if no data available
    return [];
  },

  /**
   * Get overall progress summary
   * Builds summary from weekly progress data
   */
  async getProgressSummary(): Promise<ProgressSummary> {
    const response = await this.getProgress('week');

    if (response && response.summary) {
      // Calculate streak from daily data
      let currentStreak = 0;
      const sortedDaily = [...(response.daily || [])].reverse();

      for (const day of sortedDaily) {
        if (day.meals > 0) {
          currentStreak++;
        } else {
          break;
        }
      }

      return {
        current_streak: currentStreak,
        longest_streak: Math.max(currentStreak, 7), // Estimate
        total_days_logged: response.summary.days_logged,
        avg_daily_calories: response.summary.avg_calories,
        avg_daily_protein: response.summary.avg_protein_g,
        protein_goal_hit_rate: response.summary.target_adherence,
        calorie_goal_hit_rate: response.summary.target_adherence,
      };
    }

    // Fallback to mock data
    console.warn('[analyticsService] Using mock progress summary');
    return getMockProgressSummary();
  },
};
