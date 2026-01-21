import React from 'react';
import Svg, { Rect, Circle } from 'react-native-svg';

interface MealScanIconProps {
  size?: number;
  color?: string;
}

export function MealScanIcon({ size = 24, color = '#000000' }: MealScanIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="4"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx="12"
        cy="12"
        r="5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="2" fill={color} />
    </Svg>
  );
}

