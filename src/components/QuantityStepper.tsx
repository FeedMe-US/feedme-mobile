/**
 * QuantityStepper - Reusable quantity adjustment component with +/- buttons
 * Supports fractional servings down to eighths (0.125) like MyFitnessPal
 */

import React, { useRef, useCallback } from 'react';
import { View, TouchableOpacity, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { haptics } from '@/src/utils/haptics';

export interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

/**
 * Format a decimal as a fraction string for display (e.g., 0.125 -> "⅛", 0.25 -> "¼")
 */
function formatServings(value: number): string {
  const whole = Math.floor(value);
  const decimal = value - whole;

  // Map common fractions to Unicode fraction characters
  const fractionMap: Record<number, string> = {
    0: '',
    0.125: '⅛',
    0.25: '¼',
    0.375: '⅜',
    0.5: '½',
    0.625: '⅝',
    0.75: '¾',
    0.875: '⅞',
  };

  // Round to nearest eighth to handle floating point errors
  const roundedDecimal = Math.round(decimal * 8) / 8;
  const fraction = fractionMap[roundedDecimal];

  if (fraction !== undefined) {
    if (whole === 0 && fraction) {
      return fraction;
    } else if (fraction) {
      return `${whole}${fraction}`;
    } else {
      return `${whole}`;
    }
  }

  // Fallback to decimal display
  return value.toFixed(2);
}

export function QuantityStepper({
  value,
  min = 0.25,
  max = 10,
  step = 1, // Default to whole numbers for button taps
  onChange,
  size = 'md',
  style,
}: QuantityStepperProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];
  const longPressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const valueRef = useRef(value);

  // Keep ref in sync with prop
  valueRef.current = value;

  const canDecrement = value > min;
  const canIncrement = value < max;

  // Regular tap = whole number increment
  const handleDecrement = () => {
    if (canDecrement) {
      haptics.light();
      const newValue = Math.max(min, value - step);
      onChange(Math.round(newValue * 1000) / 1000);
    }
  };

  const handleIncrement = () => {
    if (canIncrement) {
      haptics.light();
      const newValue = Math.min(max, value + step);
      onChange(Math.round(newValue * 1000) / 1000);
    }
  };

  // Long press = fine adjustment (0.25 increments)
  const startFineDecrement = useCallback(() => {
    haptics.medium();
    // First fine decrement immediately
    const firstValue = Math.max(min, valueRef.current - 0.25);
    onChange(Math.round(firstValue * 1000) / 1000);

    longPressInterval.current = setInterval(() => {
      const newValue = Math.max(min, valueRef.current - 0.25);
      haptics.light();
      onChange(Math.round(newValue * 1000) / 1000);
    }, 150);
  }, [min, onChange]);

  const startFineIncrement = useCallback(() => {
    haptics.medium();
    // First fine increment immediately
    const firstValue = Math.min(max, valueRef.current + 0.25);
    onChange(Math.round(firstValue * 1000) / 1000);

    longPressInterval.current = setInterval(() => {
      const newValue = Math.min(max, valueRef.current + 0.25);
      haptics.light();
      onChange(Math.round(newValue * 1000) / 1000);
    }, 150);
  }, [max, onChange]);

  const stopFineAdjust = useCallback(() => {
    if (longPressInterval.current) {
      clearInterval(longPressInterval.current);
      longPressInterval.current = null;
    }
  }, []);

  const buttonSize = size === 'sm' ? 28 : 36;
  const fontSize = size === 'sm' ? 14 : 16;

  return (
    <View style={[styles.container, style]}>
      <Pressable
        style={[
          styles.button,
          {
            width: buttonSize,
            height: buttonSize,
            backgroundColor: themeColors.backgroundTertiary,
            opacity: canDecrement ? 1 : 0.4,
          },
        ]}
        onPress={handleDecrement}
        onLongPress={startFineDecrement}
        onPressOut={stopFineAdjust}
        disabled={!canDecrement}>
        <Text
          style={[styles.buttonText, { fontSize, color: themeColors.text }]}
          weight="semibold">
          −
        </Text>
      </Pressable>

      <View style={[styles.valueContainer, { minWidth: size === 'sm' ? 44 : 54 }]}>
        <Text
          variant={size === 'sm' ? 'bodySmall' : 'body'}
          weight="semibold"
          style={{ textAlign: 'center' }}>
          {formatServings(value)}
        </Text>
      </View>

      <Pressable
        style={[
          styles.button,
          {
            width: buttonSize,
            height: buttonSize,
            backgroundColor: themeColors.primary,
            opacity: canIncrement ? 1 : 0.4,
          },
        ]}
        onPress={handleIncrement}
        onLongPress={startFineIncrement}
        onPressOut={stopFineAdjust}
        disabled={!canIncrement}>
        <Text
          style={[styles.buttonText, { fontSize, color: themeColors.textInverse }]}
          weight="semibold">
          +
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  button: {
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    lineHeight: 20,
  },
  valueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
