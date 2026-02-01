/**
 * AppIcon - Standard app icons (refresh, heart, camera, barcode, etc.)
 */

import React, { ComponentProps } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors } from '@/src/theme';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

export type AppIconType =
  | 'refresh'
  | 'heart'
  | 'heart-filled'
  | 'camera'
  | 'barcode'
  | 'check'
  | 'plus'
  | 'profile'
  | 'close'
  | 'chevron-up-down'
  | 'flip-camera'
  | 'menu'
  | 'diary'
  | 'home'
  | 'progress'
  | 'warning'
  | 'back'
  | 'location';

export interface AppIconProps {
  type: AppIconType;
  size?: number;
  color?: string;
  filled?: boolean;
}

const ICON_MAP: Record<AppIconType, MaterialIconName> = {
  'refresh': 'refresh',
  'heart': 'favorite-border',
  'heart-filled': 'favorite',
  'camera': 'camera-alt',
  'barcode': 'qr-code-scanner',
  'check': 'check',
  'plus': 'add',
  'profile': 'account-circle', // Updated to account-circle
  'close': 'close',
  'chevron-up-down': 'unfold-more',
  'flip-camera': 'flip-camera-android',
  'menu': 'restaurant-menu', // Updated to restaurant-menu
  'diary': 'book', // Updated to book icon
  'home': 'home', // House icon
  'progress': 'trending-up', // Updated to trending-up
  'warning': 'warning', // Warning/alert icon
  'back': 'arrow-back', // Back arrow icon
  'location': 'place', // Location pin icon
};

export function AppIcon({ type, size = 20, color, filled }: AppIconProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];
  const iconName = ICON_MAP[type];
  const iconColor = color || themeColors.text;

  return <MaterialIcons name={iconName} size={size} color={iconColor} />;
}

