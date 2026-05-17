'use client';

import { SearchIcon } from '@/components/icons/SearchIcon';
import { Input } from '@/components/ui/input';
import { InputProps } from '@/interfaces';
import { cn } from '@/utils/cn';
import React from 'react';

export const GeneralInput: React.FC<InputProps> = ({
  variant = 'default',
  className,
  ...props
}) => {
  const variantClasses: Record<string, string> = {
    form: 'typed-field border border border-white bg-transparent 375:h-[54px] min376:h-auto 1440:h-[68px] min1441:h-auto px-5 1440:px-8 min1441:px-5 min1441:py-3 375:py-4 min376:py-2 1440:py-5 py-2 rounded-none placeholder:text-white  375:placeholder:text-sm min376:placeholder:text-[10px] 1440:placeholder:text-2xl min1441:placeholder:text-[12px] placeholder:font-medium placeholder:leading-[137.5%] placeholder:uppercase placeholder:opacity-40 1440:placeholder:leading-[116.667%] text-white 375:text-sm min376:text-[10px] text-[10px] placeholder:text-[10px] font-medium leading-[137.5%] 1440:text-2xl min1441:text-[12px] 1440:leading-[116.667%] mb-0 [&:not(:placeholder-shown)]:bg-[#E8F0FE] [&:not(:placeholder-shown)]:text-[#5F6368]',
    search:
      'bg-transparent h-[20px] lg:h-[2vw] lg:text-[1.5vw] lg:leading-[100%] 1440:h-[28px] not-italic rounded-none opacity-40 w-full text-sm leading-[143%] lg:w-auto 1440:w-auto 1440:text-2xl min1441:text-[1.5vw] min1441:leading-[100%] 1440:leading-[117%] font-medium placeholder:text-whiteplaceholder:text-left placeholder:text-sm min376:placeholder:text-xs lg:placeholder:text-lg 1440:placeholder:text-2xl min1441:placeholder:text-lg placeholder:font-medium placeholder:leading-[157%] placeholder:uppercase placeholder:opacity-40',
    newsletter:
      'border border-white/40 bg-[#FA4616] 375:pl-5 1440:pl-8 375:py-3 1440:py-3 375:h-14 1440:h-18 box-border',
  };

  if (variant === 'search') {
    return (
      <div className="relative flex items-center border-b border-white lg:border-r pl-5 375:p-5 lg:px-10 lg:pl-[3vw] lg:py-[1.3vw] 1440:px-20 min-376:pl-5 min376:py-2 gap-3 1440:gap-6 min1441:gap-[1.8vw] 1440:py-8 min1441:py-[1.3vw] lg:pr-0 h-full">
        <SearchIcon className="375:w-5 375:h-5 w-3 h-3 min376:w-3 min376:h-3 lg:w-3.75 lg:h-3.75 1440:w-8 1440:h-8 min1441:w-[1.5vw] min1441:h-[1.5vw]" />
        <Input
          {...props}
          className={cn(
            variantClasses[variant],
            '375:p-0 1440:pl-0 border-0 outline-none focus:outline-none focus-visible:ring-0 focus-visible:border-0',
            className,
          )}
        />
      </div>
    );
  }

  return (
    <Input {...props} className={cn(variantClasses[variant], className)} />
  );
};
