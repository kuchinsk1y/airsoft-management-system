import { IconProps } from '@/interfaces';
import React from 'react';

export const MinusIcon: React.FC<IconProps> = ({ className = '' }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="19"
      height="2"
      viewBox="0 0 19 2"
      fill="none"
      className={className}
    >
      <path d="M1 1H17.6667" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};
