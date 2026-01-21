/**
 * Menu API Endpoints
 * ==================
 * Type-safe wrappers for /menu/* endpoints
 *
 * Contract source: backend/api/src/contracts/menu.py
 */

import { apiClient } from '@/src/services/api';
import type { LocationResponse, MenuResponse } from '@/src/types/api';

/**
 * Get all dining locations for the user's university
 * GET /menu/locations
 * Auth: Yes
 */
export async function getLocations() {
  return apiClient.get<{ locations: LocationResponse[] }>('/menu/locations');
}

/**
 * Get menu for a specific location on a specific date
 * GET /menu/{location_id}/{date}
 * Auth: Yes
 *
 * @param locationId - The location ID
 * @param date - Date in YYYY-MM-DD format
 */
export async function getMenu(locationId: number, date: string) {
  return apiClient.get<MenuResponse>(`/menu/${locationId}/${date}`);
}
