/**
 * Environment Configuration
 *
 * Determines which environment the app is running in based on EXPO_PUBLIC_ENV.
 * This is set via eas.json build profiles or .env files.
 */

export type Environment = 'development' | 'preview' | 'production';

export const ENV: Environment =
  (process.env.EXPO_PUBLIC_ENV as Environment) || 'development';

export const IS_DEV = ENV === 'development';
export const IS_PREVIEW = ENV === 'preview';
export const IS_PROD = ENV === 'production';

// Allow any email (bypasses university check) - for dev/preview builds
export const ALLOW_ANY_EMAIL =
  process.env.EXPO_PUBLIC_ALLOW_ANY_EMAIL === 'true';

// API and Supabase URLs (from environment)
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Log environment info at startup (only in dev)
 */
export function logEnvironment(): void {
  if (__DEV__) {
    console.log('='.repeat(50));
    console.log(`[Environment] ${ENV.toUpperCase()}`);
    console.log(`[Environment] API: ${API_URL}`);
    console.log(`[Environment] Supabase: ${SUPABASE_URL}`);
    console.log(`[Environment] Allow Any Email: ${ALLOW_ANY_EMAIL}`);
    console.log('='.repeat(50));
  }
}
