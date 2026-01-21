/**
 * FeedMe API
 * ==========
 * Centralized, type-safe API access layer.
 *
 * Usage:
 *   import { api } from '@/src/api';
 *
 *   // Check email
 *   const result = await api.auth.checkEmail({ email: 'user@university.edu' });
 *
 *   // Get menu
 *   const menu = await api.menu.getMenu(1, '2024-01-15');
 *
 *   // Log a meal
 *   const log = await api.log.createLog({
 *     meal_date: '2024-01-15',
 *     meal_type: 'lunch',
 *     items: [...],
 *     source: 'manual'
 *   });
 *
 * Contract source: backend/api/src/contracts/
 * Types: src/types/api.ts
 */

// Export the base client for direct access if needed
export { apiClient, API_BASE_URL } from '@/src/services/api';

// Export error types
export {
  NetworkError,
  ApiError,
  AuthError,
  RateLimitError,
  ServerError,
} from '@/src/types/errors';

// Export all API types
export * from '@/src/types/api';

// Export endpoint modules
export * as auth from './endpoints/auth';
export * as menu from './endpoints/menu';
export * as user from './endpoints/user';
export * as dayplan from './endpoints/dayplan';
export * as recommend from './endpoints/recommend';
export * as log from './endpoints/log';
export * as preference from './endpoints/preference';
export * as scan from './endpoints/scan';

// Convenience re-export as namespaced api object
import * as auth from './endpoints/auth';
import * as menu from './endpoints/menu';
import * as user from './endpoints/user';
import * as dayplan from './endpoints/dayplan';
import * as recommend from './endpoints/recommend';
import * as log from './endpoints/log';
import * as preference from './endpoints/preference';
import * as scan from './endpoints/scan';

export const api = {
  auth,
  menu,
  user,
  dayplan,
  recommend,
  log,
  preference,
  scan,
};
