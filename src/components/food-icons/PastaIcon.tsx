import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface PastaIconProps {
  size?: number;
  color?: string;
}

export function PastaIcon({ size = 24, color = '#000000' }: PastaIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 16H20L19 18C18 19.5 16 20 12 20C8 20 6 19.5 5 18L4 16Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 16C6 14 8 13 12 13C16 13 18 14 18 16"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 16C9 15 11 15 12 16"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M11 13V9C11 9 10 8 10 6M12 13V9C12 9 12 8 12 6M13 13V9C13 9 14 8 14 6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 6H14L16 6.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
