import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface VegetablesIconProps {
  size?: number;
  color?: string;
}

export function VegetablesIcon({ size = 24, color = '#000000' }: VegetablesIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 5L4 7L10 21L13 17L6 5Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 5L6 3M8 5L9 2"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M6 9L9 10M7 13L10 14"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M16 14C16 14 14 13 14 11C14 9 16 8 16 8C16 6 18 5 19 6C20 5 22 6 22 8C22 8 23 9 22 11C21 13 19 14 19 14"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 14L17 19H19L19.5 14"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
