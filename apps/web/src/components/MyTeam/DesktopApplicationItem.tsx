import type { DesktopApplicationItemProps } from '@/interfaces';

export default function DesktopApplicationItem({
  team,
  gridLayout,
  onAccept,
  onReject,
  isProcessing = false,
}: DesktopApplicationItemProps) {
  return (
    <div className={`${gridLayout} px-3 py-4 border border-[#262626] text-white text-sm`}>

      <div className="flex justify-start">
        <img
          src={team.logoUrl}
          alt={team.userName}
          className="w-10 h-10 rounded-full object-cover bg-[#262626]"
        />
      </div>

      <span className="font-semibold text-sm text-white truncate">
        {team.userName}
      </span>
      <span className="text-sm text-white text-center">{team.gamesPlayed}</span>
      <span className="text-sm text-white text-center">{team.points}</span>
      <span className="text-sm text-[#999999] text-center">{team.applicationDate}</span>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onAccept}
          disabled={isProcessing}
          className="px-4 bg-[#FA4616] text-white uppercase py-2 text-[10px] font-bold whitespace-nowrap hover:bg-[#E03D0F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ПІДТВЕРДИТИ
        </button>
        <button
          onClick={onReject}
          disabled={isProcessing}
          className="px-4 border border-[#4D4D4D] text-[#999999] uppercase py-2 text-[10px] font-bold whitespace-nowrap hover:bg-[#1A1A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ВІДХИЛИТИ
        </button>
      </div>
    </div>
  );
}
