import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface SaladIconProps {
  size?: number;
  color?: string;
}

export function SaladIcon({ size = 24, color = '#000000' }: SaladIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 12H20C20 12 20 15 18 17C16 19 13.5 20 12 20C10.5 20 8 19 6 17C4 15 4 12 4 12Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 12C5 12 5 9 7 8C9 7 9 9 10 9C11 9 11 6 14 6C17 6 17 9 18 9C19 9 20 10 20 12"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 9C10 9 11 11 14 10"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 8C7 8 8 10 10 9"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
