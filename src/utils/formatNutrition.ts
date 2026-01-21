/**
 * Formatting utilities for nutrition values
 * Prevents floating point garbage and ensures clean display
 */

/**
 * Format a macro value (protein, carbs, fat) in grams
 * - 0 decimals for >= 10g
 * - 1 decimal for < 10g
 * - Handles floating point precision issues
 */
export function formatMacro(value: number): string {
  // Round to 1 decimal place first to handle floating point precision
  const rounded = Math.round(value * 10) / 10;
  
  // If >= 10, return as integer (no decimals)
  if (rounded >= 10) {
    return Math.round(rounded).toString();
  }
  
  // Otherwise, return with at most 1 decimal, removing trailing zeros
  return rounded.toFixed(1).replace(/\.0$/, '');
}

/**
 * Format calories as integer (no decimals)
 */
export function formatCalories(value: number): string {
  return Math.round(value).toString();
}

/**
 * Format any nutrition value with appropriate precision
 * Automatically chooses format based on value size
 */
export function formatNutrition(value: number, unit: 'cal' | 'g' = 'g'): string {
  if (unit === 'cal') {
    return formatCalories(value);
  }
  return formatMacro(value);
}
