import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface HotDogIconProps {
  size?: number;
  color?: string;
}

export function HotDogIcon({ size = 24, color = '#000000' }: HotDogIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 14C4 12 4 10 5 9L15 4C17 3 19 4 20 6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 18L19 7C20 6.5 21 7 21 8C21 9 20 10 19 11L6 20C5 20.5 4 20 3.5 19C3 18 3.5 17 5 18Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 17C3 18 4 20 6 21L17 15C19 14 20 12 19 11"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 15C8 14 9 14 10 15C11 16 12 14 13 13C14 12 15 12 16 13"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
