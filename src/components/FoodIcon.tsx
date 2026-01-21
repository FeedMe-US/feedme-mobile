/**
 * FoodIcon - Displays appropriate icon for food items using custom SVG icons
 */

import React from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors } from '@/src/theme';
import { getFoodIcon } from '@/src/utils/foodIconMapper';

export interface FoodIconProps {
  foodName: string;
  size?: number;
  color?: string;
}

export function FoodIcon({ foodName, size = 18, color }: FoodIconProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];
  const IconComponent = getFoodIcon(foodName);
  const iconColor = color || themeColors.text;

  return <IconComponent size={size} color={iconColor} />;
}
