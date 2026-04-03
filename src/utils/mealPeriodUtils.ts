/**
 * Meal Period Utilities
 * Hall-specific period logic for the popup-based hall selection system
 */

import { DiningHall } from '../services/mealService';
import { getPacificTimeString } from './dateUtils';

/**
 * Location status for display purposes
 */
export type LocationStatus = 'open' | 'opening_soon' | 'closed';

export interface LocationStatusInfo {
  status: LocationStatus;
  label: string;
  colorKey: 'success' | 'warning' | 'error';
}

/**
 * Parse a time string (HH:mm) into minutes since midnight
 */
function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Check if a location is opening within a specified number of minutes.
 * Uses the next_meal_time field from the API.
 *
 * @param hall - The dining hall to check
 * @param withinMinutes - How many minutes ahead to check (default: 30)
 * @returns true if the hall is closed but opens within the specified time
 */
export function isOpeningSoon(hall: DiningHall, withinMinutes: number = 30): boolean {
  // Already open? Not "opening soon"
  if (hall.is_open_now) return false;

  // No next_meal_time means we can't determine opening soon
  if (!hall.next_meal_time) return false;

  const currentTimeStr = getPacificTimeString();
  const currentMinutes = parseTimeToMinutes(currentTimeStr);
  const nextMealMinutes = parseTimeToMinutes(hall.next_meal_time);

  // Calculate difference (handling midnight wrap-around)
  let minutesUntilOpen = nextMealMinutes - currentMinutes;

  // If next meal is earlier than current time, it's tomorrow (not opening soon today)
  if (minutesUntilOpen < 0) return false;

  return minutesUntilOpen <= withinMinutes;
}

/**
 * Get the display status for a location including label and color.
 *
 * @param hall - The dining hall to check
 * @returns Status info with label and color key
 */
export function getLocationStatus(hall: DiningHall): LocationStatusInfo {
  if (hall.is_open_now) {
    return { status: 'open', label: 'Open', colorKey: 'success' };
  }

  if (isOpeningSoon(hall)) {
    return { status: 'opening_soon', label: 'Opening Soon', colorKey: 'warning' };
  }

  return { status: 'closed', label: 'Closed', colorKey: 'error' };
}

/**
 * Check if any location in a group is opening soon.
 * Useful for grouped locations like LuValle Commons.
 *
 * @param locations - Array of dining halls
 * @returns true if any location is opening soon (and none are open)
 */
export function isAnyOpeningSoon(locations: DiningHall[]): boolean {
  // If any is open, group is not "opening soon"
  if (locations.some(l => l.is_open_now)) return false;
  return locations.some(l => isOpeningSoon(l));
}

/**
 * Get the display status for a group of locations (like LuValle Commons).
 *
 * @param locations - Array of dining halls
 * @returns Status info for the group
 */
export function getGroupLocationStatus(locations: DiningHall[]): LocationStatusInfo {
  if (locations.some(l => l.is_open_now)) {
    return { status: 'open', label: 'Open', colorKey: 'success' };
  }

  if (isAnyOpeningSoon(locations)) {
    return { status: 'opening_soon', label: 'Opening Soon', colorKey: 'warning' };
  }

  return { status: 'closed', label: 'Closed', colorKey: 'error' };
}

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
  // Fall back to next_meal if hall is between periods but has an upcoming period today
  if (hall.next_meal) {
    return hall.next_meal as MealPeriod;
  }
  // No current or next meal — hall is closed for the day
  return null;
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

// ============================================================================
// RENDEZVOUS EAST/WEST SPLIT (ID: 39)
// ============================================================================

export type RendezvousStation = 'east' | 'west';

/**
 * Check if a location uses the East/West station split (Rendezvous).
 * Rendezvous (ID 39) has two halves: East (Asian) and West (Latin).
 */
export function isStationBasedLocation(hall: DiningHall): boolean {
  return hall.id === 39;
}

/**
 * Get the station tabs for Rendezvous.
 */
export function getStationTabs(): RendezvousStation[] {
  return ['east', 'west'];
}

/**
 * Format station name for display.
 */
export function formatStation(station: RendezvousStation): string {
  const labels: Record<RendezvousStation, string> = {
    east: 'East (Asian)',
    west: 'West (Latin)',
  };
  return labels[station];
}
