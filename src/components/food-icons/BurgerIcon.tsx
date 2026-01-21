import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

interface BurgerIconProps {
  size?: number;
  color?: string;
}

export function BurgerIcon({ size = 24, color = '#000000' }: BurgerIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 9C5 6 7 4 12 4C17 4 19 6 19 9V11H5V9Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 6.5H10.01M14 6.5H14.01M12 8H12.01"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M5 11L7 12.5L9 11L12 12.5L15 11L17 12.5L19 11"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect
        x="5"
        y="13.5"
        width="14"
        height="3"
        rx="1.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 17.5H19V18C19 19.6 17.6 21 16 21H8C6.4 21 5 19.6 5 18V17.5Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
