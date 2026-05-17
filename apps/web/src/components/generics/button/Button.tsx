'use client';

import { Button } from '@/components/ui/button';
import { ButtonProps } from '@/interfaces';
import { cn } from '@/utils/cn';
import React from 'react';

export const GeneralButton: React.FC<ButtonProps> = ({
  text,
  variant = 'white-border',
  className,
  icon: Icon,
  ...props
}) => {
  const variantClasses: Record<string, string> = {
    'white-border':
      'bg-transparent text-white border border-white hover:bg-gray-800 rounded-none px-3 py-2 text-sm',
    'white-bg': 'bg-white text-black rounded-none px-3 py-2 text-sm',
    'orange-bg':
      'border border-white bg-[#FA4616] text-white uppercase font-bold 375:text-base min376:text-sm text-sm 375:leading-[28px] h-[40px] 375:px-8 min376:h-[40px] 375:py-4 rounded-none 375:h-[60px] flex justify-center items-center gap-2.5',
    'gray-bg':
      'bg-[#717171] text-white rounded-none px-5 1440:px-8 375:py-2 min376:py-4 py-2 1440:py-5 375:text-sm min376:text-xs text-xs 1440:text-2xl min1441:text-[1vw] font-bold uppercase flex justify-center items-center gap-2.5 w-full 375:h-11 min376:h-auto h-auto 1440:h-[68px] min1441:h-[40px] 1440:leading-[116.667%] transition-none hover:bg-[#717171] hover:text-white 375:leading-[233.333%] min376:leading-0',
    google:
      'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-none px-5 1440:px-8 375:py-2 min376:py-2 py-2 1440:py-5 375:text-sm min376:text-xs text-xs 1440:text-2xl min1441:text-[1vw] font-bold uppercase flex justify-center items-center gap-2.5 w-full 375:h-11 min376:h-auto h-auto 1440:h-[68px] min1441:h-[40px] 1440:leading-[116.667%] 375:leading-[233.333%] min376:leading-0 transition-none hover:bg-gray-50',
    facebook:
      'bg-[#1877F2] text-white border-2 border-[#1877F2] hover:bg-[#166FE5] rounded-none px-5 1440:px-8 375:py-2 min376:py-2 py-2 1440:py-5 375:text-sm min376:text-xs text-xs 1440:text-2xl min1441:text-[1vw] font-bold uppercase flex justify-center items-center gap-2.5 w-full 375:h-11 min376:h-auto h-auto 1440:h-[68px] min1441:h-[40px] 1440:leading-[116.667%] 375:leading-[233.333%] min376:leading-0 transition-none hover:bg-[#166FE5]',
  };

  return (
    <Button
      {...props}
      className={cn(
        'font-medium transition-all duration-200 cursor-pointer',
        variantClasses[variant],
        className,
      )}
    >
      {Icon && <Icon className="w-4 h-4 1440:w-6 1440:h-6" />}
      {text}
    </Button>
  );
};
