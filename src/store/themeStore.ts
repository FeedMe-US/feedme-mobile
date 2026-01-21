/**
 * Theme Store (Zustand)
 * Global theme management (light/dark/auto)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export type ThemeMode = 'light' | 'dark' | 'auto';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeState {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  _listenerAttached: boolean;
}

interface ThemeActions {
  setTheme: (theme: ThemeMode) => void;
  _updateResolvedTheme: () => void;
  _attachSystemListener: () => void;
}

type ThemeStore = ThemeState & ThemeActions;

// Get current system color scheme
const getSystemTheme = (): ResolvedTheme => {
  const systemScheme = Appearance.getColorScheme();
  return systemScheme === 'dark' ? 'dark' : 'light';
};

// Resolve theme based on mode and system preference
const resolveTheme = (theme: ThemeMode): ResolvedTheme => {
  if (theme === 'auto') {
    return getSystemTheme();
  }
  return theme;
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'auto',
      resolvedTheme: getSystemTheme(),
      _listenerAttached: false,

      // Set theme preference
      setTheme: (theme: ThemeMode) => {
        set({
          theme,
          resolvedTheme: resolveTheme(theme),
        });
      },

      // Update resolved theme (called when system preference changes)
      _updateResolvedTheme: () => {
        const { theme } = get();
        if (theme === 'auto') {
          set({ resolvedTheme: getSystemTheme() });
        }
      },

      // Attach system appearance listener
      _attachSystemListener: () => {
        const state = get();
        if (state._listenerAttached) return;

        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
          const { theme } = get();
          if (theme === 'auto') {
            set({ resolvedTheme: colorScheme === 'dark' ? 'dark' : 'light' });
          }
        });

        set({ _listenerAttached: true });

        // Note: In React Native, cleanup is typically handled by the app lifecycle
        // The listener persists for the app's lifetime which is the expected behavior
      },
    }),
    {
      name: '@FeedMe:theme',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ theme: state.theme }), // Only persist theme preference
      onRehydrateStorage: () => (state) => {
        // After rehydrating from storage, resolve the theme and attach listener
        if (state) {
          // Migration: Convert old 'system' to 'auto' (legacy storage may have 'system')
          const storedTheme = state.theme as string;
          if (storedTheme === 'system') {
            state.theme = 'auto';
          }
          state.resolvedTheme = resolveTheme(state.theme);
          state._attachSystemListener();
        }
      },
    }
  )
);

// Initialize system listener on store creation
// This ensures the listener is attached even if rehydration hasn't happened yet
// Only run on client-side (window exists), not during SSR (Node.js)
const isClient = typeof window !== 'undefined' && typeof document !== 'undefined';
if (isClient) {
  // Delay to ensure store is fully created
  setTimeout(() => {
    useThemeStore.getState()._attachSystemListener();
  }, 0);
}

// Selector hooks for common use cases
export const useTheme = () => useThemeStore((s) => s.theme);
export const useResolvedTheme = () => useThemeStore((s) => s.resolvedTheme);
export const useColorScheme = () => useThemeStore((s) => s.resolvedTheme);
export const useSetTheme = () => useThemeStore((s) => s.setTheme);
