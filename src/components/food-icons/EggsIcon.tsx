import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface EggsIconProps {
  size?: number;
  color?: string;
}

export function EggsIcon({ size = 24, color = '#000000' }: EggsIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5.5 14C4.1 14 3 12.5 3 10.5C3 8 4.5 6 6.5 6C8.5 6 10 8 10 10.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 11C14 8 15.5 6 17.5 6C19.5 6 21 8 21 10.5C21 12.5 19.9 14 18.5 14"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 15C8 12.79 9.79 11 12 11C14.21 11 16 12.79 16 15C16 17.21 14.21 19 12 19C9.79 19 8 17.21 8 15Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 13.5C10 13.5 10.5 12.5 11.5 12.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
