/**
 * Card component for content containers
 */

import React from 'react';
import { View, ViewProps, StyleSheet, ViewStyle } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius, shadows } from '@/src/theme';

export interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Card({
  variant = 'default',
  padding = 'md',
  style,
  children,
  ...props
}: CardProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light']; // Default to light for Neumorphism palette

  const paddingMap = {
    none: 0,
    sm: spacing.sm,
    md: spacing.md,
    lg: spacing.lg,
  };

  const cardStyles: ViewStyle[] = [
    styles.base,
    {
      backgroundColor: (themeColors as any).surface || (themeColors as any).cardBackground || themeColors.background,
      borderRadius: radius.xxl, // Large corner radius ~24 for Neumorphism 2.0
      padding: paddingMap[padding],
    },
    variant === 'elevated' ? shadows.neumorphism : undefined, // Use Neumorphism shadow for elevated cards (handles iOS & Android)
    variant === 'outlined' ? {
      borderWidth: 1,
      borderColor: themeColors.border,
    } : undefined,
    style,
  ].filter((s): s is ViewStyle => Boolean(s));

  return (
    <View style={cardStyles} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    // Removed overflow: 'hidden' to allow shadows to render properly on iOS
    // Border radius will still clip children content naturally in React Native
  },
});

