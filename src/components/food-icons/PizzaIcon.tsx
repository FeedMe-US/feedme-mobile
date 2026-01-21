import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface PizzaIconProps {
  size?: number;
  color?: string;
}

export function PizzaIcon({ size = 24, color = '#000000' }: PizzaIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6C18 6 16 4 12 4C8 4 6 6 6 6L11 19C11.5 20 12.5 20 13 19L18 6Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 6C6 6 9 8 12 8C15 8 18 6 18 6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="11" r="1.5" stroke={color} strokeWidth="1.5" />
      <Circle cx="10" cy="15" r="1" fill={color} />
    </Svg>
  );
}
