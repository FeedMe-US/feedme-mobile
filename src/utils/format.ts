/**
 * Formatting utilities for nutrition values
 */

/**
 * Format calories as integer (no decimals)
 */
export function formatCalories(calories: number): string {
  return Math.round(calories).toString();
}

/**
 * Format macro value (grams)
 * - 0 decimals for >= 10g
 * - 1 decimal for < 10g
 * - Rounds to avoid floating point garbage
 */
export function formatMacro(grams: number): string {
  if (grams >= 10) {
    return Math.round(grams).toString();
  }
  // Round to 1 decimal place, then format to remove trailing zeros
  const rounded = Math.round(grams * 10) / 10;
  return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1);
}
