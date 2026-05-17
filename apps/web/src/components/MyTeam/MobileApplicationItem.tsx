import React from 'react';
import type { MobileApplicationItemProps } from '@/interfaces';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '700'],
});

export default function MobileApplicationItem({
  team,
  onAccept,
  onReject,
  isProcessing = false,
}: MobileApplicationItemProps) {
  return (
    <div className="flex flex-col border border-[#4D4D4D] p-4 gap-3">
      <div className="flex gap-3 items-center">
        <img
          src={team.logoUrl}
          alt="team logo"
          className="w-12 h-12 rounded-full object-cover"
        />
        <span className="font-semibold text-sm text-white">{team.userName}</span>
      </div>

      <div className="flex justify-between font-semibold text-xs text-[#808080]">
        <div className="flex flex-col gap-1">
          <span className="text-[#808080]">ІГОР</span>
          <span className="text-sm text-[#FFFFFF]">{team.gamesPlayed}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[#808080]">ОЧОК</span>
          <span className="text-sm text-[#FFFFFF]">{team.points}</span>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className={`text-[#808080] text-xs ${inter.className}`}>
          Дата заявки:
        </span>
        <span className={`text-[#FFFFFF] text-sm ${inter.className} font-medium`}>
          {team.applicationDate}
        </span>
      </div>

      <div className="flex gap-2 w-full">
        <button
          onClick={onAccept}
          disabled={isProcessing}
          className="w-full border-none bg-[#FA4616] text-white uppercase py-2 text-xs font-semibold hover:bg-[#E03D0F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ПІДТВЕРДИТИ
        </button>
        <button
          onClick={onReject}
          disabled={isProcessing}
          className="w-full border border-[#4D4D4D] text-[#999999] uppercase py-2 text-xs font-semibold hover:bg-[#1A1A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ВІДХИЛИТИ
        </button>
      </div>
    </div>
  );
}
