/**
 * Token Refresh Module Tests
 */

import {
  refreshAuthToken,
  isTokenExpiredError,
  handleAuthFailure,
  resetRefreshState,
} from '../tokenRefresh';

// Mock Supabase
const mockRefreshSession = jest.fn();
const mockSignOut = jest.fn();

jest.mock('@/src/lib/supabase', () => ({
  supabase: {
    auth: {
      refreshSession: () => mockRefreshSession(),
      signOut: () => mockSignOut(),
    },
  },
}));

// Mock API client
const mockSetAuthToken = jest.fn();
const mockClearAuthToken = jest.fn();

jest.mock('../api', () => ({
  apiClient: {
    setAuthToken: (token: string) => mockSetAuthToken(token),
    clearAuthToken: () => mockClearAuthToken(),
  },
}));

describe('tokenRefresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetRefreshState();
  });

  describe('isTokenExpiredError', () => {
    it('returns true for 401 with AUTH_TOKEN_EXPIRED code', () => {
      expect(isTokenExpiredError(401, 'AUTH_TOKEN_EXPIRED')).toBe(true);
    });

    it('returns false for 401 with different error code', () => {
      expect(isTokenExpiredError(401, 'AUTH_TOKEN_INVALID')).toBe(false);
    });

    it('returns false for non-401 status', () => {
      expect(isTokenExpiredError(403, 'AUTH_TOKEN_EXPIRED')).toBe(false);
    });

    it('returns false for 401 with no error code', () => {
      expect(isTokenExpiredError(401, undefined)).toBe(false);
    });

    it('returns false for 200 status', () => {
      expect(isTokenExpiredError(200, 'AUTH_TOKEN_EXPIRED')).toBe(false);
    });
  });

  describe('refreshAuthToken', () => {
    it('refreshes token successfully and updates API client', async () => {
      const mockToken = 'new-access-token-12345';
      mockRefreshSession.mockResolvedValue({
        data: { session: { access_token: mockToken } },
        error: null,
      });

      const result = await refreshAuthToken();

      expect(result).toBe(mockToken);
      expect(mockSetAuthToken).toHaveBeenCalledWith(mockToken);
      expect(mockSetAuthToken).toHaveBeenCalledTimes(1);
    });

    it('returns null when refresh fails with error', async () => {
      mockRefreshSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Refresh token expired' },
      });

      const result = await refreshAuthToken();

      expect(result).toBeNull();
      expect(mockSetAuthToken).not.toHaveBeenCalled();
    });

    it('returns null when no session returned', async () => {
      mockRefreshSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await refreshAuthToken();

      expect(result).toBeNull();
      expect(mockSetAuthToken).not.toHaveBeenCalled();
    });

    it('returns null when session has no access_token', async () => {
      mockRefreshSession.mockResolvedValue({
        data: { session: {} },
        error: null,
      });

      const result = await refreshAuthToken();

      expect(result).toBeNull();
      expect(mockSetAuthToken).not.toHaveBeenCalled();
    });

    it('prevents concurrent refresh attempts (mutex pattern)', async () => {
      const mockToken = 'concurrent-test-token';
      let resolveRefresh: () => void;
      const refreshPromise = new Promise<void>((resolve) => {
        resolveRefresh = resolve;
      });

      mockRefreshSession.mockImplementation(async () => {
        await refreshPromise;
        return {
          data: { session: { access_token: mockToken } },
          error: null,
        };
      });

      // Start two concurrent refresh attempts
      const promise1 = refreshAuthToken();
      const promise2 = refreshAuthToken();

      // Resolve the refresh
      resolveRefresh!();

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Both should get the same token
      expect(result1).toBe(mockToken);
      expect(result2).toBe(mockToken);

      // refreshSession should only be called once due to mutex
      expect(mockRefreshSession).toHaveBeenCalledTimes(1);

      // setAuthToken should only be called once
      expect(mockSetAuthToken).toHaveBeenCalledTimes(1);
    });

    it('handles exception during refresh gracefully', async () => {
      mockRefreshSession.mockRejectedValue(new Error('Network error'));

      const result = await refreshAuthToken();

      expect(result).toBeNull();
      expect(mockSetAuthToken).not.toHaveBeenCalled();
    });

    it('resets state after successful refresh for subsequent calls', async () => {
      const mockToken1 = 'token-1';
      const mockToken2 = 'token-2';

      mockRefreshSession
        .mockResolvedValueOnce({
          data: { session: { access_token: mockToken1 } },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { session: { access_token: mockToken2 } },
          error: null,
        });

      const result1 = await refreshAuthToken();
      const result2 = await refreshAuthToken();

      expect(result1).toBe(mockToken1);
      expect(result2).toBe(mockToken2);
      expect(mockRefreshSession).toHaveBeenCalledTimes(2);
    });
  });

  describe('handleAuthFailure', () => {
    it('clears API token and signs out from Supabase', async () => {
      mockSignOut.mockResolvedValue({ error: null });

      await handleAuthFailure();

      expect(mockClearAuthToken).toHaveBeenCalled();
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('clears token even if signOut fails', async () => {
      mockSignOut.mockRejectedValue(new Error('Sign out failed'));

      // Should NOT throw - errors are caught internally
      await handleAuthFailure();
      expect(mockClearAuthToken).toHaveBeenCalled();
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('signs out even if clearAuthToken fails', async () => {
      mockClearAuthToken.mockRejectedValue(new Error('Storage error'));
      mockSignOut.mockResolvedValue({ error: null });

      // Should NOT throw - errors are caught internally
      await handleAuthFailure();
      expect(mockClearAuthToken).toHaveBeenCalled();
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  describe('resetRefreshState', () => {
    it('allows new refresh after reset', async () => {
      const mockToken = 'reset-test-token';

      // First refresh - start but don't await
      let resolveFirst: () => void;
      const firstPromise = new Promise<void>((resolve) => {
        resolveFirst = resolve;
      });

      mockRefreshSession.mockImplementation(async () => {
        await firstPromise;
        return {
          data: { session: { access_token: mockToken } },
          error: null,
        };
      });

      const refreshPromise = refreshAuthToken();

      // Reset state while refresh is "in progress"
      resetRefreshState();

      // Now a new refresh should start fresh
      mockRefreshSession.mockResolvedValue({
        data: { session: { access_token: 'new-token-after-reset' } },
        error: null,
      });

      const result = await refreshAuthToken();

      expect(result).toBe('new-token-after-reset');
      // Original promise will resolve but we've moved on
      resolveFirst!();
    });
  });
});
