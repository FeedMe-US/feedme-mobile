/**
 * Scan Service - Photo AI and Barcode scanning
 * Connects to the FeedMe backend API for food recognition
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, API_BASE_URL } from './api';

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

// Response shape from the v2 barcode endpoint
interface V2BarcodeResponse {
  success: boolean;
  food?: {
    id: string;
    name: string;
    brand?: string | null;
    serving_size: string;
    calories: number | null;
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
    fiber_g?: number | null;
    sugar_g?: number | null;
    sodium_mg?: number | null;
    source: string;
  };
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
      // Photo upload requires raw fetch for FormData — apiClient doesn't support multipart
      const authToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);

      if (!authToken) {
        console.warn('[scanService] No auth token - user not logged in');
        return {
          success: false,
          items: [],
          error: 'Please log in to use photo analysis',
        };
      }

      const formData = new FormData();
      formData.append('file', {
        uri: photoUri,
        type: 'image/jpeg',
        name: 'food_photo.jpg',
      } as unknown as Blob);

      const response = await fetch(`${API_BASE_URL}/scan/photo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data?.detail || data?.error || `Request failed (HTTP ${response.status})`;
        console.error('[scanService] API error:', response.status, errorMsg);
        isScanApiAvailable = false;
        lastScanError = new Error(errorMsg);
        return { success: false, items: [], error: errorMsg };
      }

      isScanApiAvailable = true;
      lastScanError = null;
      return data as FoodAIResponse;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Network error - check your connection';
      console.error('[scanService] Photo analysis exception:', error);
      isScanApiAvailable = false;
      lastScanError = error instanceof Error ? error : new Error(errorMsg);
      return { success: false, items: [], error: errorMsg };
    }
  },

  /**
   * Lookup product by barcode via the v2 endpoint (Open Food Facts).
   * Uses apiClient for consistent auth headers and error handling.
   * On failure, returns { success: false } — never fake data.
   */
  async lookupBarcode(barcode: string): Promise<BarcodeLookupResponse> {
    try {
      const response = await apiClient.get<V2BarcodeResponse>(
        `/v2/food/barcode/${barcode}`
      );

      if (response.error || !response.data?.success) {
        const errorMsg = response.error || 'Product not found';
        console.warn('[scanService] Barcode lookup failed:', errorMsg);
        isScanApiAvailable = false;
        lastScanError = new Error(errorMsg);
        return { success: false, error: errorMsg };
      }

      isScanApiAvailable = true;
      lastScanError = null;

      const food = response.data.food;
      if (!food) {
        return { success: false, error: 'Product not found' };
      }

      return {
        success: true,
        product: {
          barcode,
          name: food.name,
          brand: food.brand ?? undefined,
          serving_size: food.serving_size,
          calories: food.calories ?? 0,
          protein_g: food.protein_g ?? 0,
          carbs_g: food.carbs_g ?? 0,
          fat_g: food.fat_g ?? 0,
          fiber_g: food.fiber_g ?? undefined,
          sugar_g: food.sugar_g ?? undefined,
          sodium_mg: food.sodium_mg ?? undefined,
        },
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to lookup barcode';
      console.error('[scanService] Barcode lookup error:', error);
      isScanApiAvailable = false;
      lastScanError = error instanceof Error ? error : new Error(errorMsg);
      return { success: false, error: errorMsg };
    }
  },

  /**
   * Mock photo analysis — dev-only helper for testing without backend.
   */
  getMockPhotoAnalysis(): FoodAIResponse {
    return {
      success: true,
      items: [
        { name: 'Grilled Chicken Breast', calories: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6, confidence: 0.92, serving_size: '4 oz' },
        { name: 'Brown Rice', calories: 216, protein_g: 5, carbs_g: 45, fat_g: 1.8, confidence: 0.88, serving_size: '1 cup' },
        { name: 'Steamed Broccoli', calories: 55, protein_g: 3.7, carbs_g: 11, fat_g: 0.6, confidence: 0.85, serving_size: '1 cup' },
      ],
    };
  },

  /**
   * Mock barcode lookup — dev-only helper, gated behind __DEV__.
   * Never called in the production lookup flow.
   */
  getMockBarcodeLookup(barcode: string): BarcodeLookupResponse {
    if (!__DEV__) {
      return { success: false, error: 'Mock data not available in production' };
    }
    return {
      success: true,
      product: {
        barcode,
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
      },
    };
  },
};
