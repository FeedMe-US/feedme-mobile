/**
 * Toggle (Switch) component with haptic feedback
 */

import React from 'react';
import { Switch, SwitchProps, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors } from '@/src/theme';
import { haptics } from '@/src/utils/haptics';

export interface ToggleProps extends Omit<SwitchProps, 'onValueChange'> {
  value: boolean;
  onValueChange?: (value: boolean) => void;
}

export function Toggle({ value, onValueChange, ...props }: ToggleProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];

  const handleValueChange = (newValue: boolean) => {
    haptics.selection();
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  return (
    <Switch
      value={value}
      onValueChange={handleValueChange}
      trackColor={{
        false: themeColors.border,
        true: themeColors.primary + '80',
      }}
      thumbColor={value ? themeColors.primary : themeColors.textSecondary}
      {...props}
    />
  );
}

