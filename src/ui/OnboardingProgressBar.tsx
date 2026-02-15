/**
 * Progress bar wrapper for onboarding screens
 * Automatically determines current step based on route
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { usePathname } from 'expo-router';
import { ProgressBar } from './ProgressBar';
import { getStepIndex, TOTAL_STEPS } from '@/src/constants/onboarding';

export function OnboardingProgressBar() {
  const pathname = usePathname();

  // Extract the route name from the pathname (e.g., "/(onboarding)/goal" -> "goal")
  const routeName = pathname.split('/').pop() || '';

  // Don't show progress bar on complete screen
  if (routeName === 'complete') {
    return null;
  }

  const currentStepIndex = getStepIndex(routeName);

  return (
    <View style={styles.container}>
      <ProgressBar currentStep={currentStepIndex} totalSteps={TOTAL_STEPS} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },
});
