/**
 * Daily Tracking Query Hook
 * =========================
 * TanStack Query hook for fetching and managing daily food logs.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/lib/queryClient';
import { api } from '@/src/api';
import { getPacificDate } from '@/src/utils/dateUtils';
import type {
  DailyTrackingResponse,
  LogRequest,
  LogResponse,
  LogItemRequest,
  MealType,
  LogSource,
} from '@/src/types/api';

/**
 * Fetch daily tracking data for a specific date
 */
export function useDailyTracking(date?: string) {
  const trackingDate = date || getPacificDate();

  return useQuery({
    queryKey: queryKeys.tracking.daily(trackingDate),
    queryFn: async () => {
      const response = await api.user.getTargets();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Fetch user targets (daily macro goals)
 */
export function useUserTargets() {
  return useQuery({
    queryKey: queryKeys.user.targets(),
    queryFn: async () => {
      const response = await api.user.getTargets();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - targets don't change often
  });
}

/**
 * Log meal mutation with optimistic updates
 */
export function useLogMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: LogRequest) => {
      const response = await api.log.createLog(request);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data as LogResponse;
    },
    onMutate: async (newLog) => {
      // Cancel outgoing refetches
      const today = getPacificDate();
      await queryClient.cancelQueries({ queryKey: queryKeys.tracking.daily(today) });

      // Snapshot previous value
      const previousTracking = queryClient.getQueryData(queryKeys.tracking.daily(today));

      // Return context for rollback
      return { previousTracking };
    },
    onError: (_err, _newLog, context) => {
      // Rollback on error
      if (context?.previousTracking) {
        const today = getPacificDate();
        queryClient.setQueryData(queryKeys.tracking.daily(today), context.previousTracking);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      const today = getPacificDate();
      queryClient.invalidateQueries({ queryKey: queryKeys.tracking.daily(today) });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.targets() });
    },
  });
}

/**
 * Update logged meal mutation
 */
export function useUpdateLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ logId, items }: { logId: string; items: LogItemRequest[] }) => {
      const response = await api.log.updateLog(logId, items);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data as LogResponse;
    },
    onSettled: () => {
      const today = getPacificDate();
      queryClient.invalidateQueries({ queryKey: queryKeys.tracking.daily(today) });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.targets() });
    },
  });
}

/**
 * Delete logged meal mutation
 */
export function useDeleteLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (logId: string) => {
      const response = await api.log.deleteLog(logId);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSettled: () => {
      const today = getPacificDate();
      queryClient.invalidateQueries({ queryKey: queryKeys.tracking.daily(today) });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.targets() });
    },
  });
}

/**
 * Helper to create a log request
 */
export function createLogRequest(
  items: LogItemRequest[],
  mealType: MealType,
  source: LogSource = 'manual',
  mealDate?: string
): LogRequest {
  return {
    meal_date: mealDate || getPacificDate(),
    meal_type: mealType,
    items,
    source,
  };
}
