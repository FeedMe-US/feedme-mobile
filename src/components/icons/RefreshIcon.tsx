import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface RefreshIconProps {
  size?: number;
  color?: string;
}

export function RefreshIcon({ size = 24, color = '#000000' }: RefreshIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 4V10H17"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M1 20V14H7"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.51 9A9 9 0 0 1 18.36 3.64L23 10M1 14L5.64 20.36A9 9 0 0 0 20.49 15"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

