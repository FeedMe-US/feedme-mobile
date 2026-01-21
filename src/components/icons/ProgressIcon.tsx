import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface ProgressIconProps {
  size?: number;
  color?: string;
}

export function ProgressIcon({ size = 24, color = '#000000' }: ProgressIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 14L8 10L13 13L19 6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 6H19.5V9.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="4" cy="14" r="1.5" fill={color} />
      <Circle cx="8" cy="10" r="1.5" fill={color} />
      <Circle cx="13" cy="13" r="1.5" fill={color} />
      <Circle cx="19" cy="6" r="1.5" fill={color} />
    </Svg>
  );
}

