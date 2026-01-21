/**
 * Dev mode configuration
 *
 * Controlled by EXPO_PUBLIC_DEV_MODE (true/false).
 * When enabled, auth checks are bypassed for easier local development.
 */

export const IS_DEV_MODE = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

