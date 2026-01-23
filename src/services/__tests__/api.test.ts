/**
 * API Client Tests
 *
 * Tests the automatic token refresh and retry behavior.
 */

// Mock fetch globally before imports
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve('test-token')),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock token refresh module
const mockIsTokenExpiredError = jest.fn();
const mockRefreshAuthToken = jest.fn();
const mockHandleAuthFailure = jest.fn();

jest.mock('../tokenRefresh', () => ({
  isTokenExpiredError: (status: number, code?: string) => mockIsTokenExpiredError(status, code),
  refreshAuthToken: () => mockRefreshAuthToken(),
  handleAuthFailure: () => mockHandleAuthFailure(),
}));

// Import after mocks are set up
import { apiClient } from '../api';

describe('ApiClient with token refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockIsTokenExpiredError.mockReturnValue(false);
  });

  // Helper to create mock response
  const createMockResponse = (options: {
    ok: boolean;
    status: number;
    data?: any;
    isJson?: boolean;
  }) => ({
    ok: options.ok,
    status: options.status,
    headers: {
      get: () => options.isJson !== false ? 'application/json' : 'text/plain',
    },
    json: async () => options.data,
    text: async () => JSON.stringify(options.data),
  });

  describe('GET requests', () => {
    it('returns data on successful request', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          ok: true,
          status: 200,
          data: { name: 'test' },
        })
      );

      const result = await apiClient.get('/test');

      expect(result.status).toBe(200);
      expect(result.data).toEqual({ name: 'test' });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('returns error on failed request', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          ok: false,
          status: 404,
          data: { detail: 'Not found' },
        })
      );

      const result = await apiClient.get('/test');

      expect(result.status).toBe(404);
      expect(result.error).toBe('Not found');
      expect(mockRefreshAuthToken).not.toHaveBeenCalled();
    });
  });

  describe('automatic retry on token expiration', () => {
    it('retries GET request after successful token refresh', async () => {
      // First call returns 401 with AUTH_TOKEN_EXPIRED
      mockFetch
        .mockResolvedValueOnce(
          createMockResponse({
            ok: false,
            status: 401,
            data: { detail: { detail: 'Token expired', code: 'AUTH_TOKEN_EXPIRED' } },
          })
        )
        // Second call (retry) succeeds
        .mockResolvedValueOnce(
          createMockResponse({
            ok: true,
            status: 200,
            data: { success: true },
          })
        );

      // First call triggers token expired check
      mockIsTokenExpiredError.mockReturnValueOnce(true);
      // Mock successful token refresh
      mockRefreshAuthToken.mockResolvedValue('new-token-123');

      const result = await apiClient.get('/test');

      expect(result.status).toBe(200);
      expect(result.data).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockRefreshAuthToken).toHaveBeenCalledTimes(1);
      expect(mockHandleAuthFailure).not.toHaveBeenCalled();
    });

    it('retries POST request with same body after token refresh', async () => {
      const requestBody = { data: 'test-payload' };

      mockFetch
        .mockResolvedValueOnce(
          createMockResponse({
            ok: false,
            status: 401,
            data: { detail: { detail: 'Token expired', code: 'AUTH_TOKEN_EXPIRED' } },
          })
        )
        .mockResolvedValueOnce(
          createMockResponse({
            ok: true,
            status: 200,
            data: { result: 'created' },
          })
        );

      mockIsTokenExpiredError.mockReturnValueOnce(true);
      mockRefreshAuthToken.mockResolvedValue('new-token');

      const result = await apiClient.post('/test', requestBody);

      expect(result.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Verify both calls included the body
      const firstCall = mockFetch.mock.calls[0];
      const secondCall = mockFetch.mock.calls[1];
      expect(JSON.parse(firstCall[1].body)).toEqual(requestBody);
      expect(JSON.parse(secondCall[1].body)).toEqual(requestBody);
    });

    it('retries PUT request after token refresh', async () => {
      mockFetch
        .mockResolvedValueOnce(
          createMockResponse({
            ok: false,
            status: 401,
            data: { detail: { detail: 'Token expired', code: 'AUTH_TOKEN_EXPIRED' } },
          })
        )
        .mockResolvedValueOnce(
          createMockResponse({
            ok: true,
            status: 200,
            data: { updated: true },
          })
        );

      mockIsTokenExpiredError.mockReturnValueOnce(true);
      mockRefreshAuthToken.mockResolvedValue('new-token');

      const result = await apiClient.put('/test', { field: 'value' });

      expect(result.status).toBe(200);
      expect(result.data).toEqual({ updated: true });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('retries DELETE request after token refresh', async () => {
      mockFetch
        .mockResolvedValueOnce(
          createMockResponse({
            ok: false,
            status: 401,
            data: { detail: { detail: 'Token expired', code: 'AUTH_TOKEN_EXPIRED' } },
          })
        )
        .mockResolvedValueOnce(
          createMockResponse({
            ok: true,
            status: 200,
            data: { deleted: true },
          })
        );

      mockIsTokenExpiredError.mockReturnValueOnce(true);
      mockRefreshAuthToken.mockResolvedValue('new-token');

      const result = await apiClient.delete('/test/123');

      expect(result.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('returns error and signs out when token refresh fails', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          ok: false,
          status: 401,
          data: { detail: { detail: 'Token expired', code: 'AUTH_TOKEN_EXPIRED' } },
        })
      );

      mockIsTokenExpiredError.mockReturnValue(true);
      mockRefreshAuthToken.mockResolvedValue(null); // Refresh failed

      const result = await apiClient.get('/test');

      expect(result.status).toBe(401);
      expect(result.errorCode).toBe('AUTH_TOKEN_EXPIRED');
      expect(mockHandleAuthFailure).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retry when refresh fails
    });

    it('does not retry for non-token-expired 401 errors', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          ok: false,
          status: 401,
          data: { detail: { detail: 'Invalid token', code: 'AUTH_TOKEN_INVALID' } },
        })
      );

      mockIsTokenExpiredError.mockReturnValue(false); // Not a token expired error

      const result = await apiClient.get('/test');

      expect(result.status).toBe(401);
      expect(result.errorCode).toBe('AUTH_TOKEN_INVALID');
      expect(mockRefreshAuthToken).not.toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('does not retry for other error codes (404)', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          ok: false,
          status: 404,
          data: { detail: 'Resource not found' },
        })
      );

      const result = await apiClient.get('/test');

      expect(result.status).toBe(404);
      expect(mockRefreshAuthToken).not.toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('does not retry for server errors (500)', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          ok: false,
          status: 500,
          data: { detail: 'Internal server error' },
        })
      );

      const result = await apiClient.get('/test');

      expect(result.status).toBe(500);
      expect(mockRefreshAuthToken).not.toHaveBeenCalled();
    });
  });

  describe('network error handling', () => {
    it('returns network error without attempting refresh', async () => {
      mockFetch.mockRejectedValue(new Error('Network request failed'));

      const result = await apiClient.get('/test');

      expect(result.status).toBe(0);
      expect(result.error).toBe('Network request failed');
      expect(mockRefreshAuthToken).not.toHaveBeenCalled();
    });
  });

  describe('204 No Content responses', () => {
    it('handles 204 response correctly for GET', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
        headers: { get: () => null },
      });

      const result = await apiClient.get('/test');

      expect(result.status).toBe(204);
      expect(result.data).toBeUndefined();
    });

    it('handles 204 response correctly for DELETE', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
        headers: { get: () => null },
      });

      const result = await apiClient.delete('/test/123');

      expect(result.status).toBe(204);
    });
  });

  describe('error extraction', () => {
    it('extracts nested error format', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          ok: false,
          status: 400,
          data: {
            detail: {
              detail: 'Validation failed',
              code: 'VALIDATION_ERROR',
            },
          },
        })
      );

      const result = await apiClient.post('/test', {});

      expect(result.error).toBe('Validation failed');
      expect(result.errorCode).toBe('VALIDATION_ERROR');
    });

    it('extracts simple error format', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          ok: false,
          status: 400,
          data: { detail: 'Simple error message' },
        })
      );

      const result = await apiClient.post('/test', {});

      expect(result.error).toBe('Simple error message');
    });
  });
});
