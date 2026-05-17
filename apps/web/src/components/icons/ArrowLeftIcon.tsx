import { IconProps } from '@/interfaces';
import React from 'react';

export const ArrowLeftIcon: React.FC<IconProps> = ({ className }) => {
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
        d="M26.7856 9.01563L25.1685 7.5L11.7856 20L25.1685 32.5L26.7856 30.9922L15.0278 20L26.7856 9.01563Z"
        fill="white"
      />
    </svg>
  );
};
