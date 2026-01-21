/**
 * Button component with consistent styling and haptic feedback
 */

import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius, typography, shadows } from '@/src/theme';
import { haptics } from '@/src/utils/haptics';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  onPress,
  children,
  style,
  ...props
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];

  const handlePress = (e: any) => {
    if (!disabled && !loading && onPress) {
      haptics.medium();
      onPress(e);
    }
  };

  const buttonStyles: ViewStyle[] = [
    styles.base,
    styles[size],
    variant === 'primary' ? {
      backgroundColor: themeColors.primary,
    } : undefined,
    variant === 'secondary' ? {
      backgroundColor: themeColors.backgroundSecondary,
    } : undefined,
    variant === 'outline' ? {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: themeColors.primary,
    } : undefined,
    variant === 'ghost' ? {
      backgroundColor: 'transparent',
    } : undefined,
    variant === 'danger' ? {
      backgroundColor: themeColors.error,
    } : undefined,
    (disabled || loading) ? {
      opacity: 0.5,
    } : undefined,
    fullWidth ? styles.fullWidth : undefined,
    variant !== 'ghost' && variant !== 'outline' ? shadows.sm : undefined,
    style,
  ].filter((s): s is ViewStyle => Boolean(s));

  const textColor =
    variant === 'primary' || variant === 'danger'
      ? themeColors.textInverse
      : variant === 'secondary'
        ? themeColors.text
        : themeColors.primary;

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={textColor}
          style={styles.loader}
        />
      ) : (
        <Text
          style={[
            styles.text,
            size === 'sm' && styles.textSm,
            size === 'lg' && styles.textLg,
            { color: textColor },
          ]}
          weight={size === 'lg' ? 'semibold' : 'medium'}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.75}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  sm: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 32,
  },
  md: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 44,
  },
  lg: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    minHeight: 52,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    flexShrink: 1,
    textAlign: 'center',
  },
  textSm: {
    fontSize: typography.fontSize.sm,
  },
  textLg: {
    fontSize: typography.fontSize.lg,
  },
  loader: {
    marginRight: spacing.xs,
  },
});

