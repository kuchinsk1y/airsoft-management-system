import { IconProps } from '@/interfaces';
import React from 'react';

export const SearchIcon: React.FC<IconProps> = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="27"
      height="28"
      viewBox="0 0 27 28"
      fill="none"
      className={className}
    >
      <path
        d="M12.7347 24.7195C19.3537 24.7195 24.7195 19.3537 24.7195 12.7347C24.7195 6.11575 19.3537 0.75 12.7347 0.75C6.11575 0.75 0.75 6.11575 0.75 12.7347C0.75 19.3537 6.11575 24.7195 12.7347 24.7195Z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21.0703 21.6928L25.769 26.3793"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
