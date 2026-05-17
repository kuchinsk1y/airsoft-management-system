import { IconProps } from '@/interfaces';
import React from 'react';

export const UnionIcon: React.FC<IconProps> = ({ className = '', style }) => {
  const fillColor = style?.fill || '#FA4616';

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 119 48" fill="none" className={className} style={style}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M26.0856 0H0L16.0861 23.477L0 47.8235H26.0856L42.6064 23.477L26.0856 0ZM63.3959 0H37.3103L53.3964 23.477L37.3103 47.8235H63.3959L79.9167 23.477L63.3959 0ZM75.6484 0H101.734L118.255 23.477L101.734 47.8235H75.6484L91.7345 23.477L75.6484 0Z"
        fill={fillColor}
      />
    </svg>
  );
};
