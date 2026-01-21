/**
 * MacroRing - Specialized ProgressRing for macro display
 */

import React from 'react';
import { ProgressRing, ProgressRingProps } from './ProgressRing';

export interface MacroRingProps extends Omit<ProgressRingProps, 'showLabel'> {
  unit?: string;
}

export function MacroRing(props: MacroRingProps) {
  return <ProgressRing {...props} showLabel={true} />;
}

