/**
 * Auth API Endpoints
 * ==================
 * Type-safe wrappers for /auth/* endpoints
 *
 * Contract source: backend/api/src/contracts/auth.py
 */

import { apiClient } from '@/src/services/api';
import type {
  EmailCheckRequest,
  EmailCheckResponse,
  RegisterRequest,
  AuthUserProfileResponse,
  UniversityInfo,
} from '@/src/types/api';

/**
 * Check if an email is a valid university email
 * POST /auth/check-email
 * Auth: No
 */
export async function checkEmail(request: EmailCheckRequest) {
  return apiClient.post<EmailCheckResponse>('/auth/check-email', request);
}

/**
 * Register a new user after Supabase auth
 * POST /auth/register
 * Auth: Yes
 */
export async function register(request: RegisterRequest) {
  return apiClient.post<AuthUserProfileResponse>('/auth/register', request);
}

/**
 * Get the current authenticated user's profile
 * GET /auth/me
 * Auth: Yes
 */
export async function getMe() {
  return apiClient.get<AuthUserProfileResponse>('/auth/me');
}

/**
 * List all active universities
 * GET /auth/universities
 * Auth: No
 */
export async function getUniversities() {
  return apiClient.get<{ universities: UniversityInfo[] }>('/auth/universities');
}
