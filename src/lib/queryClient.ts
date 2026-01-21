/**
 * TanStack Query Client Configuration
 * ====================================
 * Centralized query client with default settings for the FeedMe app.
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed queries 2 times
      retry: 2,
      // Don't refetch on window focus in mobile app
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect automatically (handle manually)
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});

// Query keys factory for type-safe cache management
export const queryKeys = {
  // User queries
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    targets: () => [...queryKeys.user.all, 'targets'] as const,
    progress: (period: 'week' | 'month') => [...queryKeys.user.all, 'progress', period] as const,
  },

  // Menu queries
  menu: {
    all: ['menu'] as const,
    locations: () => [...queryKeys.menu.all, 'locations'] as const,
    detail: (locationId: number, date: string) =>
      [...queryKeys.menu.all, 'detail', locationId, date] as const,
  },

  // Daily tracking queries
  tracking: {
    all: ['tracking'] as const,
    daily: (date: string) => [...queryKeys.tracking.all, 'daily', date] as const,
  },

  // Recommendations
  recommend: {
    all: ['recommend'] as const,
    meal: (params: Record<string, unknown>) => [...queryKeys.recommend.all, 'meal', params] as const,
    day: (date?: string) => [...queryKeys.recommend.all, 'day', date] as const,
  },

  // Day plan
  dayplan: {
    all: ['dayplan'] as const,
    date: (date: string) => [...queryKeys.dayplan.all, date] as const,
  },
} as const;
