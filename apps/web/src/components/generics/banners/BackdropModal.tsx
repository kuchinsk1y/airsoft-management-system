'use client';
import { useEffect, useLayoutEffect } from 'react';
import { Inter } from 'next/font/google';
import { BackdropModalProps } from '@/interfaces';
import { cn } from '@/utils/cn';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['400'],
  display: 'swap',
});

export default function BackdropModal({
  icon: Icon,
  text,
  textStyle,
  children,
}: BackdropModalProps) {
  useLayoutEffect(() => {
    const scrollBarWidth =
    window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollBarWidth}px`;

    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/80 h-screen overflow-y-auto p-4">
      <div className="flex flex-col gap-4 min991:gap-6 p-6 min991:p-10 w-full max-w-[360px] min991:max-w-100 border border-[#FFFFFF] items-center text-center bg-black">
        {Icon && <Icon />}
        <p
          className={cn(
            'text-sm min991:text-base text-[#FFFFFF] whitespace-pre-line',
            inter.className,
            textStyle,
          )}
        >
          {text}
        </p>
        {children}
      </div>
    </div>
  );
}
