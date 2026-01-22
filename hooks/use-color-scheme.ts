/**
 * useColorScheme - Hook to get current color scheme
 * Uses Zustand themeStore
 */

import { useResolvedTheme } from '@/src/store/themeStore';

export function useColorScheme(): 'light' | 'dark' {
  return useResolvedTheme();
}
