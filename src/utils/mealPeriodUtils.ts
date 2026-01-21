/**
 * Meal Period Utilities
 * Hall-specific period logic for the popup-based hall selection system
 */

import { DiningHall } from '../services/mealService';

export type MealPeriod = 'breakfast' | 'lunch' | 'dinner' | 'late_night';

/**
 * Get available meal periods for a hall based on its hours_today data.
 */
export function getAvailableMealPeriods(hall: DiningHall): MealPeriod[] {
  if (!hall.hours_today) return [];

  const periods: MealPeriod[] = [];
  if (hall.hours_today.breakfast) periods.push('breakfast');
  if (hall.hours_today.lunch) periods.push('lunch');
  if (hall.hours_today.dinner) periods.push('dinner');
  if (hall.hours_today.late_night) periods.push('late_night');

  return periods;
}

/**
 * Get the current or next meal period for a hall.
 * Uses the new API fields: current_meal and next_meal.
 */
export function getCurrentOrNextMealPeriod(hall: DiningHall): MealPeriod | null {
  // Use current_meal if available (hall is currently serving)
  if (hall.current_meal) {
    return hall.current_meal as MealPeriod;
  }
  // Fall back to next_meal if hall is between periods
  if (hall.next_meal) {
    return hall.next_meal as MealPeriod;
  }
  // Fall back to first available period
  const available = getAvailableMealPeriods(hall);
  return available.length > 0 ? available[0] : null;
}

/**
 * Check if a location is an all-day location (no distinct meal periods).
 */
export function isAllDayLocation(hall: DiningHall): boolean {
  return hall.is_all_day === true;
}

/**
 * Format meal period for display.
 */
export function formatMealPeriod(period: MealPeriod): string {
  const labels: Record<MealPeriod, string> = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    late_night: 'Late Night',
  };
  return labels[period] || period;
}
