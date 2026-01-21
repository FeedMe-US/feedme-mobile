/**
 * Chip component for selectable tags
 */

import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius, typography } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { haptics } from '@/src/utils/haptics';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Chip({ label, selected = false, onPress, style }: ChipProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light']; // Default to light for Neumorphism

  const handlePress = () => {
    if (onPress) {
      haptics.selection();
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: selected
            ? themeColors.primary + '20' // Light background with primary tint
            : themeColors.cardBackgroundSecondary || themeColors.surface || themeColors.backgroundSecondary,
          borderColor: selected ? themeColors.primary : themeColors.border,
          borderWidth: selected ? 1.5 : 1, // Thicker border when selected
        },
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={!onPress}>
      <Text
        variant="bodySmall"
        weight={selected ? 'semibold' : 'medium'}
        style={{
          color: selected ? themeColors.primary : themeColors.text,
        }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

