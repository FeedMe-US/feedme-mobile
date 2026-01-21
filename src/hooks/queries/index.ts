/**
 * Query Hooks Index
 * =================
 * Centralized exports for all TanStack Query hooks.
 */

// Daily Tracking
export {
  useDailyTracking,
  useUserTargets,
  useLogMeal,
  useUpdateLog,
  useDeleteLog,
  createLogRequest,
} from './useDailyTracking';

// Recommendations
export {
  useRecommendation,
  useDayRecommendation,
  useDayPlan,
  createRecommendRequest,
} from './useRecommendation';

// User Profile
export {
  useUserProfile,
  useUpdateProfile,
  useTargets,
  useProgress,
} from './useUserProfile';

// Menu
export {
  useLocations,
  useMenu,
  usePrefetchMenu,
} from './useMenu';
