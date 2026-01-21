/**
 * Scan Service - Photo AI and Barcode scanning
 * Connects to the FeedMe backend API for food recognition
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './api';

const AUTH_TOKEN_KEY = '@FeedMe:authToken';

// Track API status for scanning
let isScanApiAvailable = true;
let lastScanError: Error | null = null;

export const getScanApiStatus = () => ({
  isAvailable: isScanApiAvailable,
  lastError: lastScanError,
  usingFallback: !isScanApiAvailable,
});

// Types for Photo AI
export interface FoodAIItem {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: number;
  serving_size: string;
}

export interface FoodAIResponse {
  success: boolean;
  items: FoodAIItem[];
  photo_url?: string;
  error?: string;
}

// Types for Barcode
export interface BarcodeProduct {
  barcode: string;
  name: string;
  brand?: string;
  serving_size: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
  image_url?: string;
}

export interface BarcodeLookupResponse {
  success: boolean;
  product?: BarcodeProduct;
  error?: string;
}

/**
 * Get authentication token from storage
 */
async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Extract error message from API response
 */
function extractErrorMessage(data: unknown, statusCode: number): string {
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    // Handle nested detail: { detail: { detail: "...", code: "..." } }
    if (d.detail && typeof d.detail === 'object') {
      const inner = d.detail as Record<string, unknown>;
      if (inner.detail) return String(inner.detail);
    }
    // Handle simple detail: { detail: "..." }
    if (d.detail && typeof d.detail === 'string') return d.detail;
    // Handle error field
    if (d.error && typeof d.error === 'string') return d.error;
  }
  return `Request failed (HTTP ${statusCode})`;
}

export const scanService = {
  /**
   * Upload food photo for AI analysis
   *
   * @param photoUri - Local URI of the photo to analyze
   * @returns FoodAIResponse with identified foods and confidence scores
   */
  async analyzePhoto(photoUri: string): Promise<FoodAIResponse> {
    try {
      const authToken = await getAuthToken();

      if (!authToken) {
        console.warn('[scanService] No auth token - user not logged in');
        return {
          success: false,
          items: [],
          error: 'Please log in to use photo analysis',
        };
      }

      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', {
        uri: photoUri,
        type: 'image/jpeg',
        name: 'food_photo.jpg',
      } as unknown as Blob);

      console.log('[scanService] API_BASE_URL:', API_BASE_URL);
      console.log('[scanService] Sending photo to:', `${API_BASE_URL}/scan/photo`);

      // Use fetch directly for multipart upload
      const response = await fetch(`${API_BASE_URL}/scan/photo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          // Don't set Content-Type - fetch will set it with boundary for multipart
        },
        body: formData,
      });

      const data = await response.json();
      console.log('[scanService] Response status:', response.status, 'ok:', response.ok);
      console.log('[scanService] Response data:', JSON.stringify(data));

      if (!response.ok) {
        const errorMsg = extractErrorMessage(data, response.status);
        console.error('[scanService] API error:', response.status, errorMsg);
        isScanApiAvailable = false;
        lastScanError = new Error(errorMsg);
        return {
          success: false,
          items: [],
          error: errorMsg,
        };
      }

      isScanApiAvailable = true;
      lastScanError = null;
      return data as FoodAIResponse;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Network error - check your connection';
      console.error('[scanService] Photo analysis exception:', error);
      isScanApiAvailable = false;
      lastScanError = error instanceof Error ? error : new Error(errorMsg);
      return {
        success: false,
        items: [],
        error: errorMsg,
      };
    }
  },

  /**
   * Lookup product by barcode
   *
   * @param barcode - UPC/EAN barcode string
   * @returns BarcodeLookupResponse with product details
   */
  async lookupBarcode(barcode: string): Promise<BarcodeLookupResponse> {
    try {
      const authToken = await getAuthToken();

      const response = await fetch(`${API_BASE_URL}/scan/barcode/${barcode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        isScanApiAvailable = false;
        lastScanError = new Error(data.detail || 'Failed to lookup barcode');
        console.warn('[scanService] API error, using mock data');
        return this.getMockBarcodeLookup(barcode);
      }

      isScanApiAvailable = true;
      lastScanError = null;
      return data as BarcodeLookupResponse;
    } catch (error) {
      console.error('Barcode lookup error:', error);
      isScanApiAvailable = false;
      lastScanError = error instanceof Error ? error : new Error('Failed to lookup barcode');
      console.warn('[scanService] Network error, using mock data');
      return this.getMockBarcodeLookup(barcode);
    }
  },

  /**
   * Mock photo analysis for development/testing
   * Returns realistic mock data when API is unavailable
   */
  getMockPhotoAnalysis(): FoodAIResponse {
    return {
      success: true,
      items: [
        {
          name: 'Grilled Chicken Breast',
          calories: 165,
          protein_g: 31,
          carbs_g: 0,
          fat_g: 3.6,
          confidence: 0.92,
          serving_size: '4 oz',
        },
        {
          name: 'Brown Rice',
          calories: 216,
          protein_g: 5,
          carbs_g: 45,
          fat_g: 1.8,
          confidence: 0.88,
          serving_size: '1 cup',
        },
        {
          name: 'Steamed Broccoli',
          calories: 55,
          protein_g: 3.7,
          carbs_g: 11,
          fat_g: 0.6,
          confidence: 0.85,
          serving_size: '1 cup',
        },
      ],
      photo_url: undefined,
    };
  },

  /**
   * Mock barcode lookup for development/testing
   */
  getMockBarcodeLookup(barcode: string): BarcodeLookupResponse {
    return {
      success: true,
      product: {
        barcode: barcode,
        name: 'Clif Bar - Chocolate Chip',
        brand: 'Clif Bar',
        serving_size: '1 bar (68g)',
        calories: 250,
        protein_g: 10,
        carbs_g: 45,
        fat_g: 5,
        fiber_g: 5,
        sugar_g: 21,
        sodium_mg: 180,
        image_url: undefined,
      },
    };
  },
};
