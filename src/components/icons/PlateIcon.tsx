import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface PlateIconProps {
  size?: number;
  color?: string;
}

export function PlateIcon({ size = 24, color = '#000000' }: PlateIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Main sparkle - larger, more prominent */}
      <Path
        d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Smaller sparkle in top right - positioned to not overlap */}
      <Path
        d="M19 2.5L19.4 4.5L21 5L19.4 5.5L19 7.5L18.6 5.5L17 5L18.6 4.5L19 2.5Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
