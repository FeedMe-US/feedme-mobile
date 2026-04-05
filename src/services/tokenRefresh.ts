/**
 * Token Refresh Manager
 *
 * Handles automatic JWT token refresh when requests fail with AUTH_TOKEN_EXPIRED.
 * Uses a mutex pattern to prevent concurrent refresh attempts.
 */

import { supabase } from '@/src/lib/supabase';
import { apiClient } from './api';

// State for managing concurrent refresh attempts
// Only refreshPromise is needed - it serves as both the lock and the shared result
let refreshPromise: Promise<string | null> | null = null;

/**
 * Error codes that indicate the token is expired and should trigger refresh
 */
export const TOKEN_EXPIRED_CODES = ['AUTH_TOKEN_EXPIRED'] as const;

/**
 * Check if an error response indicates an auth failure that should trigger refresh.
 * Any 401 means the token is missing, expired, or invalid — always try refreshing.
 */
export function isTokenExpiredError(status: number, _errorCode?: string): boolean {
  return status === 401;
}

/**
 * Attempt to refresh the auth token using Supabase.
 * Uses mutex pattern to prevent concurrent refresh attempts.
 *
 * @returns New access token, or null if refresh failed
 */
export async function refreshAuthToken(): Promise<string | null> {
  // If already refreshing, wait for that attempt (mutex pattern)
  // Only check refreshPromise - it serves as both lock and shared result
  if (refreshPromise) {
    return refreshPromise;
  }

  // Check if Supabase is available
  if (!supabase) {
    console.warn('[TokenRefresh] Supabase not configured');
    return null;
  }

  // Create the refresh promise IMMEDIATELY (synchronously) before any await
  // This prevents race conditions between concurrent callers
  refreshPromise = (async () => {
    try {
      console.log('[TokenRefresh] Attempting to refresh session...');

      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('[TokenRefresh] Refresh failed:', error.message);
        return null;
      }

      if (!data.session?.access_token) {
        console.warn('[TokenRefresh] No session returned after refresh');
        return null;
      }

      const newToken = data.session.access_token;
      console.log('[TokenRefresh] Session refreshed successfully');

      // Update the API client with new token
      // Handle storage failure gracefully - token is still valid in memory
      try {
        await apiClient.setAuthToken(newToken);
      } catch (storageErr) {
        console.error('[TokenRefresh] Failed to persist token:', storageErr);
        // Continue - token refresh succeeded, just storage failed
      }

      return newToken;
    } catch (err) {
      console.error('[TokenRefresh] Unexpected error:', err);
      return null;
    }
  })();

  // Clear the promise after it settles so future refresh attempts can proceed
  refreshPromise.finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

/**
 * Handle sign out when refresh fails.
 * This should be called when token refresh fails and user needs to re-authenticate.
 * Attempts both operations independently to ensure cleanup even if one fails.
 */
export async function handleAuthFailure(): Promise<void> {
  console.log('[TokenRefresh] Auth failure - signing out');

  // Clear the API client token - wrap in try-catch to ensure signOut is attempted
  try {
    await apiClient.clearAuthToken();
  } catch (err) {
    console.error('[TokenRefresh] Failed to clear API token:', err);
  }

  // Sign out from Supabase (this will trigger authStore to update)
  try {
    if (supabase) {
      await supabase.auth.signOut();
    }
  } catch (err) {
    console.error('[TokenRefresh] Failed to sign out from Supabase:', err);
  }
}

/**
 * Reset refresh state (useful for testing)
 */
export function resetRefreshState(): void {
  refreshPromise = null;
}
