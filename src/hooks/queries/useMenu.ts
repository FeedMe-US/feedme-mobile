/**
 * Menu Query Hooks
 * ================
 * TanStack Query hooks for dining hall menus.
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/src/lib/queryClient';
import { api } from '@/src/api';
import { getPacificDateString } from '@/src/utils/dateUtils';
import type { LocationResponse, MenuResponse } from '@/src/types/api';

/**
 * Fetch all dining locations for the user's university
 */
export function useLocations() {
  return useQuery({
    queryKey: queryKeys.menu.locations(),
    queryFn: async () => {
      const response = await api.menu.getLocations();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data?.locations as LocationResponse[];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - locations rarely change
  });
}

/**
 * Fetch menu for a specific location and date
 * Uses Pacific Time (UCLA's timezone) for the date to ensure
 * menus are fetched for the correct day even after midnight
 */
export function useMenu(locationId: number, date?: string) {
  // Use Pacific time for date to ensure correct menu at midnight
  const menuDate = date || getPacificDateString();

  return useQuery({
    queryKey: queryKeys.menu.detail(locationId, menuDate),
    queryFn: async () => {
      const response = await api.menu.getMenu(locationId, menuDate);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data as MenuResponse;
    },
    // Only fetch if we have a valid location ID
    enabled: locationId > 0,
    staleTime: 15 * 60 * 1000, // 15 minutes - menus can update during the day
  });
}

/**
 * Prefetch menu data for a location
 * Useful for prefetching next day's menu or nearby location menus
 */
export function usePrefetchMenu() {
  const queryClient = useQuery({
    queryKey: ['_prefetch_helper'],
    queryFn: () => null,
    enabled: false,
  });

  return async (locationId: number, date: string) => {
    await queryClient.refetch();
  };
}
