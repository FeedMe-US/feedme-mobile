import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface TacoIconProps {
  size?: number;
  color?: string;
}

export function TacoIcon({ size = 24, color = '#000000' }: TacoIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 16C4 16 5 20 9 20C13 20 19 16 20 13C21 10 18 8 18 8"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 16L15 6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 16C5 16 6 13 8 13C10 13 12 11 15 6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 14C7 13 9 14 10 13C11 12 12 10 13 9"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
