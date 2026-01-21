import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface FruitsIconProps {
  size?: number;
  color?: string;
}

export function FruitsIcon({ size = 24, color = '#000000' }: FruitsIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.5 11C5 11 4 12 4 14C4 16 5 18 7 19C8 19.5 9 19 10 18C11 19 12 19.5 13 19C15 18 16 16 16 14C16 12 15 11 13.5 11C12 11 11 12 10 13C9 12 8 11 6.5 11Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 11V9C10 9 11 8 12 8"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 14C17 12 19 9 20 8C21 7 21 8 21 9C21 13 20 17 15 20"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19 8L20 9"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}
