/**
 * Progress bar wrapper for onboarding screens
 * Automatically determines current step based on route
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSegments } from 'expo-router';
import { ProgressBar } from './ProgressBar';
import { getStepIndex, TOTAL_STEPS } from '@/src/constants/onboarding';

export function OnboardingProgressBar() {
  const segments = useSegments();

  // Extract the route name from segments (e.g., ['(onboarding)', 'goal'] -> 'goal')
  const routeName = segments.length >= 2 ? segments[1] : '';

  // Don't show progress bar on complete screen or if no route
  if (!routeName || routeName === 'complete') {
    return null;
  }

  const currentStepIndex = getStepIndex(routeName);

  // Debug logging
  if (__DEV__) {
    console.log('[OnboardingProgressBar] segments:', segments, 'routeName:', routeName, 'stepIndex:', currentStepIndex);
  }

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
