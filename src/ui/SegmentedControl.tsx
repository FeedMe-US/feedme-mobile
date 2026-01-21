/**
 * SegmentedControl component for option selection
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius, typography } from '@/src/theme';
import { Text } from './Text';
import { haptics } from '@/src/utils/haptics';

export interface SegmentedControlProps {
  options: string[];
  selectedIndex: number;
  onSelectionChange: (index: number) => void;
  style?: ViewStyle;
}

export function SegmentedControl({
  options,
  selectedIndex,
  onSelectionChange,
  style,
}: SegmentedControlProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];

  return (
    <View style={[styles.container, { backgroundColor: themeColors.backgroundSecondary }, style]}>
      {options.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.segment,
            index === selectedIndex && {
              backgroundColor: themeColors.primary,
            },
          ]}
          onPress={() => {
            haptics.selection();
            onSelectionChange(index);
          }}
          activeOpacity={0.7}>
          <Text
            variant="bodySmall"
            weight={index === selectedIndex ? 'semibold' : 'medium'}
            style={{
              color: index === selectedIndex ? themeColors.textInverse : themeColors.text,
              fontSize: typography.fontSize.sm,
            }}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radius.md,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

