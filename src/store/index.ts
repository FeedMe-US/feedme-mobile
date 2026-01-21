/**
 * Store exports
 * Re-exports all Zustand stores and their hooks
 */

// Auth Store
export {
  useAuthStore,
  useIsAuthenticated,
  useUser,
  useUniversity,
  useAuthStatus,
  useAuthLoading,
  type AuthStatus,
} from './authStore';

// Theme Store
export {
  useThemeStore,
  useTheme,
  useResolvedTheme,
  useColorScheme,
  useSetTheme,
  type ThemeMode,
  type ResolvedTheme,
} from './themeStore';

// Re-export DailyTrackingContext (still using Context for now)
export { DailyTrackingProvider, useDailyTracking } from './DailyTrackingContext';
