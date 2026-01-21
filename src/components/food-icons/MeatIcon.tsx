import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface MeatIconProps {
  size?: number;
  color?: string;
}

export function MeatIcon({ size = 24, color = '#000000' }: MeatIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 13C3 16.5 6 19 10 20C14 21 19 19 20 15C21 11 19 6 14 5C9 4 3 8 3 13Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 13C3 17 6.5 20.5 10 21C14 21.5 18 20 20 15"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M11 10C10 9 9 9 8 10C7 11 8 13 9 13C11 13 13 10 16 9"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
