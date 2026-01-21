import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface DairyIconProps {
  size?: number;
  color?: string;
}

export function DairyIcon({ size = 24, color = '#000000' }: DairyIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8V19C4 20.1 4.9 21 6 21H11V8H4Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <Path
        d="M4 8L6 4H12L14 8H4Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <Path
        d="M11 21H12C13.1 21 14 20.1 14 19V8"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <Path
        d="M13 16L21 14V17C21 18.5 19 21 15 21L13 19V16Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="16.5" cy="17.5" r="1" fill={color} />
      <Circle cx="19" cy="19" r="0.5" fill={color} />
    </Svg>
  );
}
