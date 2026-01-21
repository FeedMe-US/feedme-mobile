/**
 * Onboarding state management using AsyncStorage
 * Handles persistence of onboarding completion status
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETE_KEY = '@onboarding_complete';

/**
 * Check if onboarding has been completed
 */
export async function getOnboardingComplete(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error reading onboarding status:', error);
    return false;
  }
}

/**
 * Mark onboarding as complete or incomplete
 */
export async function setOnboardingComplete(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, value ? 'true' : 'false');
  } catch (error) {
    console.error('Error setting onboarding status:', error);
  }
}

/**
 * Reset onboarding status (set flag to false)
 */
export async function resetOnboarding(): Promise<void> {
  try {
    // Explicitly set to false rather than removing, for clarity
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'false');
    console.log('[Onboarding] Reset onboarding flag to false');
  } catch (error) {
    console.error('Error resetting onboarding status:', error);
  }
}

