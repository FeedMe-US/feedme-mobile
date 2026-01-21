/**
 * Shadow system for elevation and depth
 * Platform-specific implementations
 */

import { Platform } from 'react-native';

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: {
      elevation: 1,
    },
    default: {},
  }),
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
    default: {},
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    },
    android: {
      elevation: 8,
    },
    default: {},
  }),
  xl: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
    },
    android: {
      elevation: 12,
    },
    default: {},
  }),
  neumorphism: Platform.select({
    ios: {
      // Enhanced shadow with detailed parameters for depth - more visible
      shadowColor: '#000000', // Use pure black for shadow color
      shadowOffset: { width: 0, height: 4 }, // Downward offset for natural light
      shadowOpacity: 0.12, // Increased opacity for better visibility
      shadowRadius: 24, // Wide, soft blur for diffused shadow effect
    },
    android: {
      elevation: 6, // Increased elevation for better visibility on Android
    },
    default: {},
  }),
} as const;

export type ShadowKey = keyof typeof shadows;

