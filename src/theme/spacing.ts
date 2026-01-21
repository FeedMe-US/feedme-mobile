/**
 * Spacing system using 4px base unit
 * Provides consistent spacing throughout the app
 */

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export type SpacingKey = keyof typeof spacing;

/**
 * Helper to get spacing value
 */
export const getSpacing = (key: SpacingKey | number): number => {
  if (typeof key === 'number') return key;
  return spacing[key];
};

