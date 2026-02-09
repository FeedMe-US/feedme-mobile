/**
 * Auth Service
 * Handles authentication with Supabase and backend registration
 */

import { supabase } from '@/src/lib/supabase';
import { apiClient } from './api';
import * as WebBrowser from 'expo-web-browser';

// Types
export interface University {
  id: number;
  slug: string;
  name: string;
  logo_url?: string;
  primary_color: string;
}

export interface EmailCheckResult {
  is_university_email: boolean;
  university: University | null;
  message: string;
}

export interface UserProfile {
  user_id: string;
  email: string;
  university_id: number | null;
  university_slug: string | null;
  university_name: string | null;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  session: { access_token: string } | null;
}

class AuthService {
  /**
   * Check if an email is from a supported university
   */
  async checkEmail(email: string): Promise<EmailCheckResult> {
    const response = await apiClient.post<EmailCheckResult>('/auth/check-email', { email });

    if (response.error) {
      return {
        is_university_email: false,
        university: null,
        message: response.error,
      };
    }

    return response.data!;
  }

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'ucnutrition://auth/callback',
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Note: Registration completion happens after email verification
    // The backend will reject non-university emails at that point

    return { success: true };
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.session) {
      // Set token for API client
      await apiClient.setAuthToken(data.session.access_token);

      // Complete registration (in case user exists in Supabase but not our DB)
      // This will reject non-university emails
      const registration = await this.completeRegistration(email);

      if (registration.error) {
        // Sign out if registration fails (non-university email)
        await this.signOut();
        return { success: false, error: registration.error };
      }
    }

    return { success: true };
  }

  /**
   * Sign in with magic link (passwordless)
   */
  async signInWithMagicLink(email: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Sign in with Google OAuth
   * Uses expo-web-browser to open the OAuth flow on mobile
   */
  async signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      // Generate OAuth URL - skipBrowserRedirect is essential for React Native
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'ucnutrition://auth/callback',
          skipBrowserRedirect: true, // Required for mobile - we handle browser ourselves
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.url) {
        // Open OAuth flow in browser - this will redirect back via deep link
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          'ucnutrition://auth/callback'
        );

        // If user dismissed the browser, it's not an error - they may try again
        if (result.type === 'cancel' || result.type === 'dismiss') {
          return { success: false, error: 'Sign in was cancelled' };
        }

        // Extract tokens from the callback URL
        // Supabase returns tokens in the URL fragment: #access_token=xxx&refresh_token=yyy
        if (result.type === 'success' && result.url) {
          const url = result.url;
          let accessToken: string | null = null;
          let refreshToken: string | null = null;

          // Parse tokens from URL fragment (hash)
          if (url.includes('#')) {
            const fragment = url.split('#')[1];
            if (fragment) {
              const params = new URLSearchParams(fragment);
              accessToken = params.get('access_token');
              refreshToken = params.get('refresh_token');
            }
          }

          // If we got tokens, set the session
          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              console.error('[AuthService] Failed to set session:', sessionError);
              return { success: false, error: sessionError.message };
            }

            // Complete registration with backend (creates user record)
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
              const registration = await this.completeRegistration(user.email);
              if (registration.error) {
                // Don't fail OAuth - user can still be authenticated
                // Registration error likely means non-university email
                console.warn('[AuthService] Registration warning:', registration.error);
                return { success: false, error: registration.error };
              }
            }

            return { success: true };
          }
        }

        // Fallback: if no tokens in URL, callback.tsx might handle it
        return { success: true };
      }

      return { success: false, error: 'No OAuth URL returned' };
    } catch (error) {
      console.error('[AuthService] Google OAuth error:', error);
      return { success: false, error: 'Failed to start Google sign in' };
    }
  }

  /**
   * Complete registration with backend (creates user record, sets university)
   * Throws error if email domain is not from a supported university
   */
  async completeRegistration(email: string): Promise<{ profile: UserProfile | null; error?: string }> {
    const response = await apiClient.post<UserProfile>('/auth/register', { email });

    if (response.error) {
      // Check if it's a university email rejection
      if (response.status === 403) {
        return {
          profile: null,
          error: 'Only university emails from supported institutions are allowed',
        };
      }
      console.error('Failed to complete registration:', response.error);
      return { profile: null, error: response.error };
    }

    return { profile: response.data!, error: undefined };
  }

  /**
   * Get current user profile from backend
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    const response = await apiClient.get<UserProfile>('/auth/me');

    if (response.error) {
      return null;
    }

    return response.data!;
  }

  /**
   * Get current Supabase session
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      return null;
    }

    // Update API client token
    await apiClient.setAuthToken(data.session.access_token);

    return data.session;
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    await supabase.auth.signOut();
    await apiClient.clearAuthToken();
  }

  /**
   * Listen for auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Get list of supported universities
   */
  async getUniversities(): Promise<University[]> {
    const response = await apiClient.get<{ universities: University[] }>('/auth/universities');

    if (response.error) {
      return [];
    }

    return response.data?.universities || [];
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'ucnutrition://auth/reset-password',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }
}

export const authService = new AuthService();
