import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface LockIconProps {
  size?: number;
  color?: string;
}

export function LockIcon({ size = 24, color = '#000000' }: LockIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7.5 11V7C7.5 4.79086 9.29086 3 11.5 3H12.5C14.7091 3 16.5 4.79086 16.5 7V11M7.5 11H5.5C4.39543 11 3.5 11.8954 3.5 13V19C3.5 20.1046 4.39543 21 5.5 21H18.5C19.6046 21 20.5 20.1046 20.5 19V13C20.5 11.8954 19.6046 11 18.5 11H16.5M7.5 11H16.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
