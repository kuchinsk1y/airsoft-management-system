import { IconProps } from '@/interfaces';
import React from 'react';

export const ChevronDownIcon: React.FC<IconProps> = ({ className, style }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      style={style}
    >
      <path
        d="M24.7875 10L26 11.2938L16 22L6 11.2938L7.20625 10L16 19.4063L24.7875 10Z"
        fill="white"
      />
    </svg>
  );
};
