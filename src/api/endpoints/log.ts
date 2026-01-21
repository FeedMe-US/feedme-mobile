/**
 * Log API Endpoints
 * =================
 * Type-safe wrappers for /log/* endpoints
 *
 * Contract source: backend/api/src/contracts/log.py
 */

import { apiClient } from '@/src/services/api';
import type {
  LogRequest,
  LogResponse,
  LogItemRequest,
} from '@/src/types/api';

/**
 * Log a meal
 * POST /log
 * Auth: Yes
 *
 * Creates a new food log entry with one or more items.
 * Returns the log ID and updated day progress.
 */
export async function createLog(request: LogRequest) {
  return apiClient.post<LogResponse>('/log', request);
}

/**
 * Update a logged meal
 * PUT /log/{log_id}
 * Auth: Yes
 *
 * @param logId - The UUID of the log entry to update
 * @param items - The updated list of items
 */
export async function updateLog(logId: string, items: LogItemRequest[]) {
  return apiClient.put<LogResponse>(`/log/${logId}`, { items });
}

/**
 * Delete a logged meal
 * DELETE /log/{log_id}
 * Auth: Yes
 *
 * @param logId - The UUID of the log entry to delete
 *
 * Returns 204 No Content on success
 */
export async function deleteLog(logId: string) {
  return apiClient.delete(`/log/${logId}`);
}
