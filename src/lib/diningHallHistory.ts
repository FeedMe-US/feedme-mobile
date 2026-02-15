/**
 * Dining Hall MRU (Most Recently Used) History Manager
 * Persists user's dining hall selection history for the Home screen
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@feedme:dining_hall_history';
const LAST_SELECTED_KEY = '@feedme:last_selected_hall';

export interface DiningHallHistory {
  /** MRU-ordered array of dining hall slugs (most recent first) */
  mruOrder: string[];
  /** Timestamp of last update */
  lastUpdated: number;
}

/**
 * Get the current MRU order
 */
export async function getMRUOrder(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const history: DiningHallHistory = JSON.parse(data);
    return history.mruOrder || [];
  } catch (error) {
    console.warn('[DiningHallHistory] Error loading MRU order:', error);
    return [];
  }
}

/**
 * Get the last selected dining hall slug
 */
export async function getLastSelectedHall(): Promise<string | null> {
  try {
    const slug = await AsyncStorage.getItem(LAST_SELECTED_KEY);
    return slug;
  } catch (error) {
    console.warn('[DiningHallHistory] Error loading last selected hall:', error);
    return null;
  }
}

/**
 * Update MRU order when a dining hall is selected
 * Moves the selected hall to the front of the list
 */
export async function selectDiningHall(slug: string): Promise<void> {
  try {
    // Get current MRU order
    const currentOrder = await getMRUOrder();

    // Remove slug if it exists, then add to front
    const newOrder = [slug, ...currentOrder.filter(s => s !== slug)];

    // Save updated order
    const history: DiningHallHistory = {
      mruOrder: newOrder,
      lastUpdated: Date.now(),
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history));

    // Also save as last selected
    await AsyncStorage.setItem(LAST_SELECTED_KEY, slug);

    console.log('[DiningHallHistory] Updated MRU order:', newOrder);
  } catch (error) {
    console.error('[DiningHallHistory] Error updating MRU order:', error);
  }
}

/**
 * Clear all dining hall history
 */
export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem(LAST_SELECTED_KEY);
    console.log('[DiningHallHistory] Cleared all history');
  } catch (error) {
    console.error('[DiningHallHistory] Error clearing history:', error);
  }
}

/**
 * Sort a list of dining hall slugs by MRU order
 * Halls in the MRU list appear first (in MRU order), followed by other halls
 */
export function sortByMRU(slugs: string[], mruOrder: string[]): string[] {
  // Create a map of slug to MRU index for efficient lookup
  const mruIndexMap = new Map<string, number>();
  mruOrder.forEach((slug, index) => {
    mruIndexMap.set(slug, index);
  });

  // Separate halls into MRU and non-MRU
  const mruHalls: string[] = [];
  const otherHalls: string[] = [];

  slugs.forEach(slug => {
    if (mruIndexMap.has(slug)) {
      mruHalls.push(slug);
    } else {
      otherHalls.push(slug);
    }
  });

  // Sort MRU halls by their position in the MRU order
  mruHalls.sort((a, b) => {
    const indexA = mruIndexMap.get(a) ?? Infinity;
    const indexB = mruIndexMap.get(b) ?? Infinity;
    return indexA - indexB;
  });

  // Return MRU halls first, then other halls
  return [...mruHalls, ...otherHalls];
}
