'use client';

import type { TeamHeaderProps } from '@/interfaces';
import { Inter } from 'next/font/google';
import React, { useRef } from 'react';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '700'],
});

export function TeamHeader(props: TeamHeaderProps) {
  const {
    logoSrc,
    onLogoPick,
    changeLogoText = 'Змінити логотип',
    name,
    description,
    rightAction,
  } = props;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-6 w-full">
        <img
          src={logoSrc}
          alt="team logo"
          className="w-40 h-40 object-cover"
          onError={(e) => {
            e.currentTarget.src = '/profile-avatar.jpg';
          }}
        />

        {onLogoPick ? (
          <div>
            <button
              type="button"
              className="uppercase font-semibold text-[#FA4616] text-2xl tracking-wide"
              onClick={() => fileInputRef.current?.click()}
            >
              {changeLogoText}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onLogoPick(file);
                e.currentTarget.value = '';
              }}
            />
          </div>
        ) : (
          <>
            <div className="min991:flex items-center gap-6 w-full min-w-0">
              <div className="flex flex-col gap-2 min-w-0 ">
                <p className="uppercase truncate leading-tight font-semibold text-white text-2xl tracking-wide">
                  {name}
                </p>
              </div>

              {rightAction ? (
                <div className="shrink-0 min991:ml-auto">{rightAction}</div>
              ) : null}
            </div>
          </>
        )}
      </div>

      {description ? (
        <p
          className={`min991:hidden text-[#CCCCCC] text-sm w-full ${inter.className}`}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
