'use client';

import { Target } from 'lucide-react';
import progress from '@/mocks/ProgressData.json';
import TrophyIcon from '../icons/TrophyIcon';
import TargetIcon from '../icons/TargetIcon';
import ShieldIcon from '../icons/ShieldIcon';
import CommanderIcon from '../icons/CommanderIcon';
import VeteranIcon from '../icons/VeteranIcon';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Снайпер: TargetIcon,
  Ветеран: VeteranIcon,
  Командир: CommanderIcon,
  Непереможний: ShieldIcon,
  Default: Target,
};

export default function ProgressBlock() {
  return (
    <div className="hidden border border-[#262626] p-6 uppercase min991:block min991:w-[50%] h-fit">
      <span className="flex items-center gap-3 text-lg font-bold">
        <TrophyIcon /> Досягнення
      </span>

      <div className="grid grid-cols-2 gap-4 mt-6">
        {progress.map((item, index) => {
          const IconComponent = ICON_MAP[item.title] || ICON_MAP.Default;
          return (
            <div
              key={index}
              className="border border-[#262626] py-6 flex flex-col items-center justify-center text-center gap-2"
            >
              <IconComponent className="w-4 h-4 text-orange-500" />
              <span className="font-bold text-xs">{item.title}</span>
              <span className="text-[10px] text-[#808080]">{item.description}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
