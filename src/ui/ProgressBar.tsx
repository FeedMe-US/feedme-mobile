/**
 * Linear progress bar component for onboarding flow
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors } from '@/src/theme';

export interface ProgressBarProps {
  /**
   * Current step (0-indexed)
   */
  currentStep: number;
  /**
   * Total number of steps
   */
  totalSteps: number;
  /**
   * Height of the progress bar in pixels
   * @default 6
   */
  height?: number;
  /**
   * Custom color for the filled portion
   * If not provided, uses theme primary color
   */
  color?: string;
}

export function ProgressBar({
  currentStep,
  totalSteps,
  height = 6,
  color,
}: ProgressBarProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];

  // Calculate progress percentage (0 to 1)
  // currentStep is 0-indexed, so we add 1 to show progress for the current step
  const progress = Math.min(Math.max((currentStep + 1) / totalSteps, 0), 1);

  const fillColor = color || themeColors.primary;
  const trackColor = themeColors.border;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.track,
          {
            height,
            backgroundColor: trackColor,
            borderRadius: height / 2,
          },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${progress * 100}%`,
              height,
              backgroundColor: fillColor,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 0,
  },
  track: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
