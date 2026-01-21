import React from 'react';
import Svg, { Path, Ellipse } from 'react-native-svg';

interface SushiIconProps {
  size?: number;
  color?: string;
}

export function SushiIcon({ size = 24, color = '#000000' }: SushiIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 9C14 7.34 16 6 18.5 6C21 6 23 7.34 23 9V14C23 15.66 21 17 18.5 17"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Ellipse
        cx="18.5"
        cy="9"
        rx="4.5"
        ry="3"
        stroke={color}
        strokeWidth="1.5"
      />
      <Path
        d="M20 9H17V9.5H20V9Z"
        stroke={color}
        strokeWidth="1.5"
      />
      <Path
        d="M2 13C2 11.34 4 10 6.5 10C9 10 11 11.34 11 13V18C11 19.66 9 21 6.5 21C4 21 2 19.66 2 18V13Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Ellipse
        cx="6.5"
        cy="13"
        rx="4.5"
        ry="3"
        stroke={color}
        strokeWidth="1.5"
      />
      <Path
        d="M5 12.5H8V13.5H5V12.5Z"
        stroke={color}
        strokeWidth="1.5"
      />
      <Path
        d="M2 16C2 16 4 17.5 6.5 17.5C9 17.5 11 16 11 16"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
