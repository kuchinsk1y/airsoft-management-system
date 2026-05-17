import { IconProps } from '@/interfaces';
import React from 'react';

export const ArrowRightIcon: React.FC<IconProps> = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      className={className}
    >
      <path
        d="M12.5 9.01563L14.1172 7.5L27.5 20L14.1172 32.5L12.5 30.9922L24.2578 20L12.5 9.01563Z"
        fill="white"
      />
    </svg>
  );
};
