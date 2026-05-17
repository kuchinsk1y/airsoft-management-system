import { IconProps } from '@/interfaces';
import React from 'react';

export const ArrowRightBannerIcon: React.FC<IconProps> = ({ className }) => {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="64" height="64" rx="32" fill="white" fillOpacity="0.1" />
      <path
        d="M29 26C29 26 35 30.4189 35 32C35 33.5812 29 38 29 38"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
