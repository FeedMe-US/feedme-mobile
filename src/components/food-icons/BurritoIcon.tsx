import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface BurritoIconProps {
  size?: number;
  color?: string;
}

export function BurritoIcon({ size = 24, color = '#000000' }: BurritoIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 5L5 16C3.5 17.5 3.5 19.5 5 21C6.5 22.5 8.5 22.5 10 21L21 10"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 5C17 4 19 4 20 5C21 6 21 8 20 9L18 11"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18 7L16 9"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 19L19 8"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
