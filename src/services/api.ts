/**
 * API Client Configuration
 * Base configuration for connecting to the FeedMe backend API
 *
 * Includes automatic token refresh on 401 AUTH_TOKEN_EXPIRED errors.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetworkError, ApiError, AuthError, RateLimitError, ServerError } from '@/src/types/errors';
import {
  isTokenExpiredError,
  refreshAuthToken,
  handleAuthFailure,
} from './tokenRefresh';

// API Configuration
// Uses EXPO_PUBLIC_API_URL environment variable if set, otherwise falls back to defaults
// For local development on physical device, set EXPO_PUBLIC_API_URL=http://YOUR_IP:8000
// For production, EXPO_PUBLIC_API_URL should be set via EAS build secrets
const getApiBaseUrl = (): string => {
  // Check for environment variable first (works in both dev and production)
  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  if (envUrl) {
    console.log('[API] Using EXPO_PUBLIC_API_URL:', envUrl);
    return envUrl;
  }

  // In development mode, use Railway URL instead of localhost
  // This ensures the app works on physical devices without needing local server
  const defaultUrl = 'https://build01-production.up.railway.app';

  if (__DEV__) {
    console.warn(
      '[API] EXPO_PUBLIC_API_URL not set. Using Railway URL:', defaultUrl
    );
  }

  return defaultUrl;
};

const API_BASE_URL = getApiBaseUrl();

const AUTH_TOKEN_KEY = '@FeedMe:authToken';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  errorCode?: string;  // Backend error code (e.g., 'LOCATION_NOT_FOUND', 'RATE_LIMIT_EXCEEDED')
  status: number;
}

class ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;
  private _isHealthy: boolean = false;
  private _lastHealthCheck: number = 0;
  private static HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private _initialized: Promise<void>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Store the initialization promise so consumers can await it
    this._initialized = this.loadToken();
  }

  /**
   * Wait for the client to finish loading the auth token from storage.
   * Call this before making authenticated requests on app startup.
   */
  async waitForInit(): Promise<void> {
    return this._initialized;
  }

  get isHealthy(): boolean {
    return this._isHealthy;
  }

  /**
   * Check if the API is reachable
   */
  async checkHealth(): Promise<boolean> {
    const now = Date.now();
    // Use cached result if recent
    if (now - this._lastHealthCheck < ApiClient.HEALTH_CHECK_INTERVAL) {
      return this._isHealthy;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      this._isHealthy = response.ok;
      this._lastHealthCheck = now;
      return this._isHealthy;
    } catch {
      this._isHealthy = false;
      this._lastHealthCheck = now;
      return false;
    }
  }

  private async loadToken(): Promise<void> {
    try {
      this.authToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      this.authToken = null;
    }
  }

  async setAuthToken(token: string): Promise<void> {
    this.authToken = token;
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  }

  async clearAuthToken(): Promise<void> {
    this.authToken = null;
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Check if the client has a valid auth token loaded.
   * Use this before making authenticated requests.
   */
  hasAuthToken(): boolean {
    return this.authToken !== null;
  }

  /**
   * Ensure the client is initialized before making authenticated requests.
   * Throws if no auth token is available after initialization.
   */
  async ensureAuthenticated(): Promise<void> {
    await this._initialized;
    if (!this.authToken) {
      throw new Error('No authentication token available. Please log in.');
    }
  }

  /**
   * Extract error details from backend response.
   * Backend may return: { detail: string } or { detail: { detail: string, code: string } }
   */
  private extractError(data: any): { message: string; code?: string } {
    if (!data) return { message: 'Request failed' };

    // Handle nested error format: { detail: { detail: "...", code: "..." } }
    if (typeof data.detail === 'object' && data.detail !== null) {
      return {
        message: data.detail.detail || 'Request failed',
        code: data.detail.code,
      };
    }

    // Handle simple format: { detail: "..." }
    if (typeof data.detail === 'string') {
      return { message: data.detail };
    }

    return { message: 'Request failed' };
  }

  /**
   * Execute a fetch request with automatic token refresh and retry.
   * If the request fails with AUTH_TOKEN_EXPIRED, attempts to refresh
   * the token and retry once.
   *
   * @param fetchFn - Function that performs the fetch request
   * @param endpoint - Endpoint name for logging
   * @returns API response (success or error)
   */
  private async executeWithRetry<T>(
    fetchFn: () => Promise<ApiResponse<T>>,
    endpoint: string,
  ): Promise<ApiResponse<T>> {
    // First attempt
    const result = await fetchFn();

    // Check if this is a token expired error
    if (isTokenExpiredError(result.status, result.errorCode)) {
      console.log(`[API] Token expired for ${endpoint}, attempting refresh...`);

      // Try to refresh the token
      const newToken = await refreshAuthToken();

      if (newToken) {
        // Retry the request with the new token
        console.log(`[API] Retrying ${endpoint} with refreshed token`);
        const retryResult = await fetchFn();

        // If retry also fails with token expired, sign out (prevents infinite loops)
        if (isTokenExpiredError(retryResult.status, retryResult.errorCode)) {
          console.log(`[API] Retry also failed with expired token for ${endpoint}, signing out`);
          try {
            await handleAuthFailure();
          } catch (err) {
            console.error(`[API] Failed to handle auth failure:`, err);
          }
        }

        return retryResult;
      } else {
        // Refresh failed - sign out the user
        console.log(`[API] Token refresh failed for ${endpoint}, signing out`);
        try {
          await handleAuthFailure();
        } catch (err) {
          console.error(`[API] Failed to handle auth failure:`, err);
        }
        return result; // Return original error
      }
    }

    return result;
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const fetchFn = async (): Promise<ApiResponse<T>> => {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'GET',
          headers: this.getHeaders(),
        });

        if (response.status === 204) {
          return { status: 204 };
        }

        // Try to parse as JSON, but handle text responses gracefully
        const contentType = response.headers.get('content-type');
        let data: any;

        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          // Non-JSON response - read as text for debugging
          const text = await response.text();
          console.warn(`[API] Non-JSON response from ${endpoint}:`, text.substring(0, 200));
          if (!response.ok) {
            return {
              error: text || 'Request failed',
              status: response.status,
            };
          }
          // If response.ok but not JSON, try parsing anyway
          try {
            data = JSON.parse(text);
          } catch {
            return {
              error: `Unexpected response format: ${text.substring(0, 100)}`,
              status: response.status,
            };
          }
        }

        if (!response.ok) {
          const errorInfo = this.extractError(data);
          return {
            error: errorInfo.message,
            errorCode: errorInfo.code,
            status: response.status,
          };
        }

        return { data, status: response.status };
      } catch (error) {
        console.error(`[API] Fetch error for ${endpoint}:`, error);
        return {
          error: error instanceof Error ? error.message : 'Network error',
          status: 0,
        };
      }
    };

    return this.executeWithRetry(fetchFn, endpoint);
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    const fetchFn = async (): Promise<ApiResponse<T>> => {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: body ? JSON.stringify(body) : undefined,
        });

        if (response.status === 204) {
          return { status: 204 };
        }

        // Try to parse as JSON, but handle text responses gracefully
        const contentType = response.headers.get('content-type');
        let data: any;

        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          console.warn(`[API] Non-JSON response from ${endpoint}:`, text.substring(0, 200));
          if (!response.ok) {
            return {
              error: text || 'Request failed',
              status: response.status,
            };
          }
          try {
            data = JSON.parse(text);
          } catch {
            return {
              error: `Unexpected response format: ${text.substring(0, 100)}`,
              status: response.status,
            };
          }
        }

        if (!response.ok) {
          const errorInfo = this.extractError(data);
          return {
            error: errorInfo.message,
            errorCode: errorInfo.code,
            status: response.status,
          };
        }

        return { data, status: response.status };
      } catch (error) {
        console.error(`[API] Fetch error for ${endpoint}:`, error);
        return {
          error: error instanceof Error ? error.message : 'Network error',
          status: 0,
        };
      }
    };

    return this.executeWithRetry(fetchFn, endpoint);
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    const fetchFn = async (): Promise<ApiResponse<T>> => {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: body ? JSON.stringify(body) : undefined,
        });

        const data = await response.json();

        if (!response.ok) {
          const errorInfo = this.extractError(data);
          return {
            error: errorInfo.message,
            errorCode: errorInfo.code,
            status: response.status,
          };
        }

        return { data, status: response.status };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Network error',
          status: 0,
        };
      }
    };

    return this.executeWithRetry(fetchFn, endpoint);
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const fetchFn = async (): Promise<ApiResponse<T>> => {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        });

        if (response.status === 204) {
          return { status: 204 };
        }

        const data = await response.json();

        if (!response.ok) {
          const errorInfo = this.extractError(data);
          return {
            error: errorInfo.message,
            errorCode: errorInfo.code,
            status: response.status,
          };
        }

        return { data, status: response.status };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Network error',
          status: 0,
        };
      }
    };

    return this.executeWithRetry(fetchFn, endpoint);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export { API_BASE_URL };
