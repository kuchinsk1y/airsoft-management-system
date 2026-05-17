import { IconProps } from '@/interfaces';
import React from 'react';

export const AutoIndicatorIcon: React.FC<IconProps> = ({ className }) => {
  return (
    <svg
      width="120"
      height="4"
      viewBox="0 0 120 4"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="120" height="4" fill="#FF4D1A" className={className} />
    </svg>
  );
};
