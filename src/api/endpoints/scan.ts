/**
 * Scan API Endpoints
 * ==================
 * Type-safe wrappers for /scan/* endpoints
 *
 * Contract source: backend/api/src/contracts/scan.py
 *
 * Note: Rate limited
 * - Photo AI: 10/day
 * - Barcode: 20/day
 */

import { apiClient, API_BASE_URL } from '@/src/services/api';
import type {
  FoodAIResponse,
  BarcodeLookupResponse,
} from '@/src/types/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = '@FeedMe:authToken';

/**
 * Analyze a food photo with AI
 * POST /scan/photo
 * Auth: Yes
 * Rate Limit: 10/day
 *
 * @param imageUri - Local URI of the image to upload
 *
 * Note: This uses FormData for multipart upload, not JSON.
 */
export async function scanPhoto(imageUri: string): Promise<{
  data?: FoodAIResponse;
  error?: string;
  status: number;
}> {
  try {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);

    // Create form data for multipart upload
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as unknown as Blob);

    const response = await fetch(`${API_BASE_URL}/scan/photo`, {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        // Note: Don't set Content-Type for FormData, browser/RN sets it with boundary
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.detail || 'Photo scan failed',
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
}

/**
 * Look up a product by barcode
 * GET /scan/barcode/{barcode}
 * Auth: Yes
 * Rate Limit: 20/day
 *
 * @param barcode - Product barcode (6-13 digits)
 */
export async function lookupBarcode(barcode: string) {
  return apiClient.get<BarcodeLookupResponse>(`/scan/barcode/${barcode}`);
}
