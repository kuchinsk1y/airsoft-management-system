import { IconProps } from '@/interfaces';
import React from 'react';

export const HeartIcon: React.FC<IconProps> = ({ className, filled = false }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.7413 2.80925C12.9946 2.24508 11.4021 2.71508 10.2071 4.12842C9.01128 2.71342 7.41877 2.24592 5.67377 2.80925C3.46794 3.51925 2.0921 5.51175 2.0821 8.00842C2.0621 12.2867 6.1796 15.6384 10.0388 17.3484L10.2079 17.4234L10.3771 17.3484C14.2371 15.6384 18.3529 12.2867 18.3321 8.00842C18.3221 5.51175 16.9463 3.51925 14.7413 2.80925Z"
        fill={filled ? 'white' : 'none'}
        stroke="white"
        strokeWidth="1.5"
      />
    </svg>
  );
};
