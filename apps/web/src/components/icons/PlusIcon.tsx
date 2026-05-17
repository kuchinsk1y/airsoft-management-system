import { IconProps } from '@/interfaces';
import React from 'react';

export const PlusIcon: React.FC<IconProps> = ({ className = '' }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="19"
      height="19"
      viewBox="0 0 19 19"
      fill="none"
      className={className}
    >
      <path d="M1 9.33331H17.6667" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M9.33203 1L9.33203 17.6667" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};
