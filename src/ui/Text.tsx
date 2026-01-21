/**
 * Text component integrated with typography system
 */

import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet, TextStyle } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, typography, textStyles } from '@/src/theme';

export type TextVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'bodyLarge' | 'bodySmall' | 'label' | 'labelLarge' | 'caption';
export type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  weight?: TextWeight;
  color?: 'default' | 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'error' | 'protein' | 'carbs' | 'fats' | 'calories';
  children: React.ReactNode;
}

export function Text({
  variant = 'body',
  weight,
  color = 'default',
  style,
  children,
  ...props
}: TextProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light']; // Default to light for Neumorphism palette

  const variantStyle = textStyles[variant];
  const weightValue = weight || variantStyle.fontWeight;

  const colorMap: Record<string, string> = {
    default: themeColors.text,
    primary: themeColors.primary,
    secondary: themeColors.textSecondary,
    tertiary: themeColors.textTertiary,
    success: themeColors.success,
    warning: themeColors.warning,
    error: themeColors.error,
    protein: themeColors.protein,
    carbs: themeColors.carbs,
    fats: themeColors.fats,
    calories: themeColors.calories,
  };

  const textColor = colorMap[color] || themeColors.text;

  return (
    <RNText
      style={[
        variantStyle,
        {
          fontWeight: weightValue,
          color: textColor,
        },
        style,
      ]}
      {...props}>
      {children}
    </RNText>
  );
}

