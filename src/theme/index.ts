/**
 * Theme system export
 * Centralized design tokens for the FeedMe app
 */

export * from './colors';
export * from './spacing';
export * from './radius';
export * from './typography';
export * from './shadows';

import { colors } from './colors';
import { spacing } from './spacing';
import { radius } from './radius';
import { typography, textStyles, fontFamily } from './typography';
import { shadows } from './shadows';

export const theme = {
  colors,
  spacing,
  radius,
  typography,
  textStyles,
  fontFamily,
  shadows,
} as const;

