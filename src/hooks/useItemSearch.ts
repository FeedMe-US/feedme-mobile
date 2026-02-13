/**
 * useItemSearch - Hook for searching foods via backend /food/search
 *
 * Used for disliked-foods search (NOT allergens — those are local-only).
 * Debounces user input and queries /food/search for suggestions.
 * Merges backend results with a default set and deduplicates.
 *
 * IMPORTANT: No silent fallback to local filtering when the API fails.
 * On error, we surface the error and only show defaults when query is empty.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { apiClient } from '@/src/services/api';

export interface SearchItem {
  id: string;
  name: string;
}

interface USDAFoodSearchResponse {
  success: boolean;
  foods: Array<{
    id: string;
    name: string;
    brand?: string;
    serving_size: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  }>;
  error?: string;
}

interface UseItemSearchOptions {
  /** Default items to always show when search is empty */
  defaults: SearchItem[];
  /** Debounce delay in ms (default 300) */
  debounceMs?: number;
  /** Minimum query length to trigger API search (default 2) */
  minQueryLength?: number;
}

interface UseItemSearchResult {
  /** Current search query */
  query: string;
  /** Update the search query */
  setQuery: (q: string) => void;
  /** Filtered/searched results */
  results: SearchItem[];
  /** Whether a backend search is in flight */
  isLoading: boolean;
  /** Whether the search returned no results */
  hasNoResults: boolean;
  /** Error message if search failed */
  error: string | null;
}

/**
 * Normalize a food name for deduplication:
 * lowercase, trim, collapse whitespace
 */
function normalizeKey(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Deduplicate search items by normalized name, keeping first occurrence.
 */
function deduplicateItems(items: SearchItem[]): SearchItem[] {
  const seen = new Set<string>();
  const result: SearchItem[] = [];
  for (const item of items) {
    const key = normalizeKey(item.name);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

/**
 * Clean up USDA food names: strip brand parenthetical, trailing commas, etc.
 */
function cleanFoodName(name: string): string {
  let cleaned = name.replace(/\s*\([^)]*\)\s*$/, '').trim();
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return cleaned;
}

export function useItemSearch({
  defaults,
  debounceMs = 300,
  minQueryLength = 2,
}: UseItemSearchOptions): UseItemSearchResult {
  // Stabilize defaults reference to prevent infinite re-render loops
  // when consumers pass a new array reference with the same content each render
  const defaultsKey = JSON.stringify(defaults);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableDefaults = useMemo(() => defaults, [defaultsKey]);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>(stableDefaults);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Return defaults when query is empty
  useEffect(() => {
    if (!query.trim()) {
      setResults(stableDefaults);
      setIsLoading(false);
      setError(null);
      return;
    }

    const trimmed = query.trim();

    // For very short queries, filter defaults locally (not worth an API call)
    if (trimmed.length < minQueryLength) {
      const lowerQ = trimmed.toLowerCase();
      const filtered = stableDefaults.filter(
        (item) =>
          item.name.toLowerCase().includes(lowerQ) ||
          item.id.toLowerCase().includes(lowerQ)
      );
      setResults(filtered);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Debounce API call
    setIsLoading(true);
    setError(null);

    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) abortRef.current.abort();

    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await apiClient.get<USDAFoodSearchResponse>(
          `/food/search?q=${encodeURIComponent(trimmed)}&limit=20`
        );

        if (controller.signal.aborted) return;

        // apiClient.get doesn't throw on HTTP errors — check response.error
        if (response.error) {
          console.log('[useItemSearch] API error:', response.error, 'status:', response.status);
          setResults([]);
          setIsLoading(false);
          setError('Search unavailable. Please try again.');
          return;
        }

        const lowerQ = trimmed.toLowerCase();

        // Start with defaults that match the query
        const matchingDefaults = stableDefaults.filter(
          (item) =>
            item.name.toLowerCase().includes(lowerQ) ||
            item.id.toLowerCase().includes(lowerQ)
        );

        // Add backend results
        let backendItems: SearchItem[] = [];
        if (response.data?.success && response.data.foods.length > 0) {
          backendItems = response.data.foods.map((food) => ({
            id: food.id,
            name: cleanFoodName(food.name),
          }));
        }

        // Merge: defaults first, then backend results, deduplicated
        const merged = deduplicateItems([...matchingDefaults, ...backendItems]);
        setResults(merged);
        setIsLoading(false);
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.log('[useItemSearch] Search failed:', err);

        // Surface the error — do NOT silently fall back to local filtering
        setResults([]);
        setIsLoading(false);
        setError('Search unavailable. Please try again.');
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [query, stableDefaults, debounceMs, minQueryLength]);

  const hasNoResults = query.trim().length > 0 && !isLoading && !error && results.length === 0;

  return {
    query,
    setQuery,
    results,
    isLoading,
    hasNoResults,
    error,
  };
}
