/**
 * HapticTab - Tab bar button with haptic feedback
 * Wraps the default tab button to add haptic feedback on press
 */

import React from 'react';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Pressable, PressableProps } from 'react-native';
import { haptics } from '@/src/utils/haptics';

export function HapticTab({ onPress, ...rest }: BottomTabBarButtonProps) {
  // Extract only Pressable-compatible props
  const pressableProps = rest as Omit<PressableProps, 'onPress'>;

  return (
    <Pressable
      {...pressableProps}
      onPress={(e) => {
        haptics.selection();
        onPress?.(e);
      }}
    />
  );
}

