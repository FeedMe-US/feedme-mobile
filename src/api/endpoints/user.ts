/**
 * User API Endpoints
 * ==================
 * Type-safe wrappers for /user/* endpoints
 *
 * Contract source: backend/api/src/contracts/user.py
 */

import { apiClient } from '@/src/services/api';
import type {
  UserProfileResponse,
  UserProfileUpdateRequest,
  TargetsResponse,
  ProgressResponse,
} from '@/src/types/api';

/**
 * Get the current user's profile
 * GET /user/profile
 * Auth: Yes
 */
export async function getProfile() {
  return apiClient.get<UserProfileResponse>('/user/profile');
}

/**
 * Update the current user's profile
 * PUT /user/profile
 * Auth: Yes
 */
export async function updateProfile(request: UserProfileUpdateRequest) {
  return apiClient.put<UserProfileResponse>('/user/profile', request);
}

/**
 * Get the user's adjusted daily targets
 * GET /user/targets
 * Auth: Yes
 *
 * Returns adjusted targets based on weekly progress,
 * including base targets, adjustment info, and today's progress.
 */
export async function getTargets() {
  return apiClient.get<TargetsResponse>('/user/targets');
}

/**
 * Get user progress over a time period
 * GET /user/progress
 * Auth: Yes
 *
 * @param period - "week" or "month" (default: "week")
 */
export async function getProgress(period: 'week' | 'month' = 'week') {
  return apiClient.get<ProgressResponse>(`/user/progress?period=${period}`);
}

// Note: Day plan endpoint is in dayplan.ts
