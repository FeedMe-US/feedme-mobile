/**
 * Type-Safe API Client
 * ====================
 * Re-exports the existing apiClient with typed wrappers.
 *
 * Contract source: backend/api/src/contracts/
 * Types: src/types/api.ts
 */

// Re-export the existing client
export { apiClient, API_BASE_URL } from '@/src/services/api';

// Re-export error types
export {
  NetworkError,
  ApiError,
  AuthError,
  RateLimitError,
  ServerError,
} from '@/src/types/errors';
