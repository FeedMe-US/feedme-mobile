/**
 * Date utilities for Pacific Time (UCLA's timezone)
 *
 * UCLA operates in Pacific Time, so all date calculations for menus,
 * hours, and meal periods should use this timezone rather than the
 * device's local timezone or UTC.
 */

const PACIFIC_TIMEZONE = 'America/Los_Angeles';

/**
 * Get today's date string in Pacific Time (YYYY-MM-DD format)
 *
 * This is the primary function to use when fetching menus or checking
 * operating hours. It ensures we're always using UCLA's local date,
 * regardless of the user's device timezone.
 *
 * @example
 * // At 11pm Pacific on Jan 19th: returns "2025-01-19"
 * // At 1am Pacific on Jan 20th: returns "2025-01-20"
 * // At 1am Eastern on Jan 20th (10pm Pacific Jan 19th): returns "2025-01-19"
 */
export function getPacificDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: PACIFIC_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/**
 * Get the current hour in Pacific Time (0-23)
 */
export function getPacificHour(date: Date = new Date()): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: PACIFIC_TIMEZONE,
    hour: '2-digit',
    hour12: false,
  });
  const hourStr = formatter.formatToParts(date).find(p => p.type === 'hour')?.value || '0';
  return parseInt(hourStr, 10);
}

/**
 * Get the current time in Pacific Time as HH:MM string
 */
export function getPacificTimeString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: PACIFIC_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const hour = parts.find(p => p.type === 'hour')?.value || '00';
  const minute = parts.find(p => p.type === 'minute')?.value || '00';
  return `${hour}:${minute}`;
}

/**
 * Get the day of week in Pacific Time (0=Sunday, 6=Saturday)
 */
export function getPacificDayOfWeek(date: Date = new Date()): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: PACIFIC_TIMEZONE,
    weekday: 'short',
  });
  const weekday = formatter.format(date);
  const days: Record<string, number> = {
    'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6,
  };
  return days[weekday] ?? 0;
}

/**
 * Check if two dates are the same day in Pacific Time
 */
export function isSamePacificDay(date1: Date, date2: Date): boolean {
  return getPacificDateString(date1) === getPacificDateString(date2);
}

/**
 * Format a date string for display (e.g., "Mon, Jan 20")
 */
export function formatPacificDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date + 'T12:00:00') : date;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: PACIFIC_TIMEZONE,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  return formatter.format(d);
}

// =============================================================================
// Spec-compliant aliases (per §6.1 of BEHAVIORAL_CONTRACT.md)
// =============================================================================

/**
 * Get the current date in Pacific timezone as YYYY-MM-DD string.
 * This is the canonical date format for all FeedMe cache keys and API calls.
 *
 * CRITICAL: Always use this for:
 * - AsyncStorage keys
 * - meal_date in API requests
 * - Log retrieval date parameters
 *
 * @example
 * getPacificDate() // "2026-01-27"
 */
export function getPacificDate(): string {
  return getPacificDateString();
}

/**
 * Get Pacific date for a specific timestamp.
 */
export function toPacificDate(date: Date): string {
  return getPacificDateString(date);
}

/**
 * Check if a given date string matches today in Pacific timezone.
 */
export function isPacificToday(dateStr: string): boolean {
  return dateStr === getPacificDate();
}

/**
 * Get Pacific time as HH:mm string (for comparing with API hours).
 * Alias for getPacificTimeString for spec compliance.
 */
export function getPacificTime(): string {
  return getPacificTimeString();
}