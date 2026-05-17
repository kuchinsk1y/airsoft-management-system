import { IconProps } from '@/interfaces';
import React from 'react';

export const SliderHandle: React.FC<IconProps> = ({ className, style }) => {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={className} style={style}>
      <circle cx="10" cy="10" r="10" fill="#FA4616" />
    </svg>
  );
};
