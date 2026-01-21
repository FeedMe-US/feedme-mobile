/**
 * Screen wrapper component with safe area handling
 */

import React from 'react';
import { View, ViewProps, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors } from '@/src/theme';

export interface ScreenProps extends ViewProps {
  safe?: boolean;
  safeTop?: boolean;
  safeBottom?: boolean;
  children: React.ReactNode;
}

export function Screen({
  safe = true,
  safeTop = true,
  safeBottom = true,
  style,
  children,
  ...props
}: ScreenProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const screenStyles: ViewStyle[] = [
    styles.base,
    {
      backgroundColor: (themeColors as any).background || '#FAF9F6', // Neumorphism background color
      flex: 1,
    },
    safe && safeTop ? { paddingTop: insets.top } : undefined,
    safe && safeBottom ? { paddingBottom: insets.bottom } : undefined,
    style,
  ].filter((s): s is ViewStyle => Boolean(s));

  return (
    <View style={screenStyles} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
});

