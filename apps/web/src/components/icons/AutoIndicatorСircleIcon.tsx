import { IconProps } from '@/interfaces';
import React from 'react';

export const AutoIndicatorCircleIcon: React.FC<IconProps> = ({ className }) => {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 8 8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="4" cy="4" r="4" fill="#FF4D1A" />
    </svg>
  );
};
