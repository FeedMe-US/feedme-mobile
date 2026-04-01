/**
 * Auth Store (Zustand)
 * Manages authentication state across the app
 */

import { create } from 'zustand';
import { authService, UserProfile, University } from '@/src/services/authService';
import { apiClient } from '@/src/services/api';
import { setOnboardingComplete } from '@/src/lib/onboarding';
import { getOnboardingData, onboardingDataToProfile, clearOnboardingData } from '@/src/lib/onboardingData';
import { IS_DEV_MODE } from '@/src/config/devMode';
import { IS_DEV } from '@/src/config/environment';
import { supabase } from '@/src/lib/supabase';

const DEV_EMAIL = 'dev@test.ucla.edu';
const DEV_PASSWORD = 'testpass123';

// Types
export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  // State
  status: AuthStatus;
  user: UserProfile | null;
  university: University | null;
  _initialized: boolean;
  _unsubscribe: (() => void) | null;
}

interface AuthActions {
  // Actions
  initialize: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithMagicLink: (email: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  checkEmail: (email: string) => Promise<{
    isSupported: boolean;
    university: University | null;
    message: string;
  }>;
  refreshUser: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  status: 'idle',
  user: null,
  university: null,
  _initialized: false,
  _unsubscribe: null,

  // Initialize auth - call once on app start
  initialize: async () => {
    const state = get();

    // Prevent multiple initializations
    if (state._initialized) return;

    // In dev environment, auto-sign in to get a real JWT so apiClient has a token
    if (IS_DEV_MODE || IS_DEV) {
      console.log('[AuthStore] Dev environment - auto-signing in with test credentials');
      if (supabase) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: DEV_EMAIL,
            password: DEV_PASSWORD,
          });
          if (!error && data.session) {
            await apiClient.setAuthToken(data.session.access_token);
            console.log('[AuthStore] Dev auto-login successful');
          } else {
            console.warn('[AuthStore] Dev auto-login failed:', error?.message);
          }
        } catch (e) {
          console.warn('[AuthStore] Dev auto-login error:', e);
        }
      }
      set({
        status: 'authenticated',
        user: null,
        university: null,
        _initialized: true,
      });
      return;
    }

    console.log('[AuthStore] Initializing...');
    set({ status: 'loading', _initialized: true });

    try {
      // Check for existing session
      console.log('[AuthStore] Checking for existing session...');
      const session = await authService.getSession();

      if (session) {
        console.log('[AuthStore] Found existing session, syncing token...');
        // Sync auth token to API client BEFORE making any authenticated requests
        await apiClient.setAuthToken(session.access_token);

        // Fetch user profile from backend
        console.log('[AuthStore] Fetching user profile...');
        const profile = await authService.getCurrentUser();
        console.log('[AuthStore] Profile result:', profile ? 'found' : 'not found');

        if (profile) {
          let userUniversity: University | null = null;

          // Fetch university details if user has one
          if (profile.university_id) {
            const universities = await authService.getUniversities();
            userUniversity = universities.find(u => u.id === profile.university_id) || null;
          }

          // IMPORTANT: Sync any locally stored onboarding data BEFORE changing status
          // This handles the case where onboarding completed but backend sync failed
          // Must happen before auth gate checks backend for onboarding_complete
          try {
            const localOnboardingData = await getOnboardingData();
            const hasData = Object.keys(localOnboardingData).length > 0;

            if (hasData) {
              console.log('[AuthStore] Found local onboarding data, attempting to sync...');
              const profileData = onboardingDataToProfile(localOnboardingData);
              const syncResponse = await apiClient.put('/user/profile', profileData);

              if (!syncResponse.error) {
                console.log('[AuthStore] Local onboarding data synced successfully on init');
                await clearOnboardingData();
              } else {
                console.warn('[AuthStore] Failed to sync onboarding data on init:', syncResponse.error);
              }
            }
          } catch (syncError) {
            console.error('[AuthStore] Error syncing onboarding data on init:', syncError);
          }

          // Now set authenticated status - auth gate will run after this
          console.log('[AuthStore] Setting status to authenticated');
          set({
            status: 'authenticated',
            user: profile,
            university: userUniversity,
          });
        } else {
          console.log('[AuthStore] No profile found, setting status to unauthenticated');
          set({ status: 'unauthenticated' });
        }
      } else {
        console.log('[AuthStore] No existing session, setting status to unauthenticated');
        set({ status: 'unauthenticated' });
      }

      // Setup auth state listener
      const { data: { subscription } } = authService.onAuthStateChange(
        async (event, session) => {
          console.log('[AuthStore] Auth state changed:', event);

          if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
            await apiClient.setAuthToken(session.access_token);
            await get().refreshUser();
          } else if (event === 'SIGNED_OUT') {
            set({
              status: 'unauthenticated',
              user: null,
              university: null,
            });
            // Clear local onboarding flag so next user goes through onboarding
            await setOnboardingComplete(false);
          } else if (event === 'TOKEN_REFRESHED' && session) {
            await apiClient.setAuthToken(session.access_token);
          }
        }
      );

      // Store unsubscribe function for cleanup
      set({ _unsubscribe: () => subscription.unsubscribe() });

    } catch (error) {
      console.error('[AuthStore] Error initializing auth:', error);
      set({ status: 'unauthenticated' });
    }
  },

  // Refresh user profile from backend
  refreshUser: async () => {
    try {
      const profile = await authService.getCurrentUser();

      if (profile) {
        let userUniversity: University | null = null;

        if (profile.university_id) {
          const universities = await authService.getUniversities();
          userUniversity = universities.find(u => u.id === profile.university_id) || null;
        }

        set({
          status: 'authenticated',
          user: profile,
          university: userUniversity,
        });
      }
    } catch (error) {
      console.error('[AuthStore] Error refreshing user:', error);
    }
  },

  // Sign up with email and password
  signUp: async (email: string, password: string) => {
    const result = await authService.signUp(email, password);
    // User may need to verify email first
    // The auth state listener will handle the rest
    return result;
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    const result = await authService.signIn(email, password);

    if (result.success) {
      await get().refreshUser();

      // Sync any locally stored onboarding data to backend
      try {
        const localOnboardingData = await getOnboardingData();
        const hasData = Object.keys(localOnboardingData).length > 0;

        if (hasData) {
          const profileData = onboardingDataToProfile(localOnboardingData);
          const syncResponse = await apiClient.put('/user/profile', profileData);

          if (!syncResponse.error) {
            console.log('[AuthStore] Local onboarding data synced to backend on login');
            await clearOnboardingData();
          } else {
            console.warn('[AuthStore] Failed to sync onboarding data on login:', syncResponse.error);
          }
        }
      } catch (syncError) {
        console.error('[AuthStore] Error syncing onboarding data on login:', syncError);
        // Don't fail login if sync fails
      }
    }

    return result;
  },

  // Sign in with Google OAuth
  signInWithGoogle: async () => {
    const result = await authService.signInWithGoogle();

    // If successful, refresh user profile to update auth state
    // This is needed because the auth listener's refreshUser() runs before
    // completeRegistration() creates the user in our DB
    if (result.success) {
      await get().refreshUser();
    }

    return result;
  },

  // Sign in with magic link
  signInWithMagicLink: async (email: string) => {
    return authService.signInWithMagicLink(email);
  },

  // Sign out
  signOut: async () => {
    await authService.signOut();
    set({
      status: 'unauthenticated',
      user: null,
      university: null,
    });
    // Clear local onboarding flag so next user goes through onboarding
    await setOnboardingComplete(false);
  },

  // Delete account and all data
  deleteAccount: async () => {
    const result = await authService.deleteAccount();

    if (result.success) {
      set({
        status: 'unauthenticated',
        user: null,
        university: null,
      });
      await setOnboardingComplete(false);
    }

    return result;
  },

  // Check if email is from supported university
  checkEmail: async (email: string) => {
    const result = await authService.checkEmail(email);

    return {
      isSupported: result.is_university_email && result.university !== null,
      university: result.university,
      message: result.message,
    };
  },
}));

// Selector hooks for common use cases
export const useIsAuthenticated = () => useAuthStore((s) => s.status === 'authenticated');
export const useUser = () => useAuthStore((s) => s.user);
export const useUniversity = () => useAuthStore((s) => s.university);
export const useAuthStatus = () => useAuthStore((s) => s.status);
export const useAuthLoading = () => useAuthStore((s) => s.status === 'loading' || s.status === 'idle');
