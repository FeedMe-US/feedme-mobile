/**
 * User Profile Query Hooks
 * ========================
 * TanStack Query hooks for user profile management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/lib/queryClient';
import { api } from '@/src/api';
import type {
  UserProfileResponse,
  UserProfileUpdateRequest,
  TargetsResponse,
  ProgressResponse,
} from '@/src/types/api';

/**
 * Fetch user profile
 */
export function useUserProfile() {
  return useQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: async () => {
      const response = await api.user.getProfile();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data as UserProfileResponse;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Update user profile mutation
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: UserProfileUpdateRequest) => {
      const response = await api.user.updateProfile(updates);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data as UserProfileResponse;
    },
    onSuccess: (data) => {
      // Update cache with new profile
      queryClient.setQueryData(queryKeys.user.profile(), data);
      // Invalidate targets as they may have changed
      queryClient.invalidateQueries({ queryKey: queryKeys.user.targets() });
    },
  });
}

/**
 * Fetch user's adjusted daily targets
 */
export function useTargets() {
  return useQuery({
    queryKey: queryKeys.user.targets(),
    queryFn: async () => {
      const response = await api.user.getTargets();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data as TargetsResponse;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch user progress over a time period
 */
export function useProgress(period: 'week' | 'month' = 'week') {
  return useQuery({
    queryKey: queryKeys.user.progress(period),
    queryFn: async () => {
      const response = await api.user.getProgress(period);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data as ProgressResponse;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - progress doesn't change rapidly
  });
}
