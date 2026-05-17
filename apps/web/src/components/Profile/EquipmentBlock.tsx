import Image from 'next/image';
import type { UserEquipmentItem } from '@/constants/equipment';
import CupIcon from '../icons/CupIcon';

type Props = {
  equipment: UserEquipmentItem[];
};

export default function EquipmentBlock({ equipment }: Props) {
  return (
    <div className="border border-[#262626] uppercase w-full overflow-hidden">
      <div className="min991:grid min991:grid-cols-[35%_65%]">
        <div className="relative h-45 min991:h-60 w-full overflow-hidden">
          <Image
            src="/Equip-Photo.jpg"
            alt="Екіпірування"
            fill
            className="object-cover"
            sizes="(min-width: 991px) 35vw, 100vw"
            priority
          />
        </div>

        <div className="p-3 min991:p-4 flex flex-col">
          <span className="flex items-center gap-2.5 text-base min991:text-lg font-bold">
            <CupIcon /> Екіпірування
          </span>

          <div className="grid grid-cols-1 min991:grid-cols-2 mt-2.5 gap-2">
            {equipment.map((item) => (
              <div
                key={item.slotKey}
                className="border border-[#262626] px-2.5 py-2.5"
              >
                <div className="flex justify-between items-center gap-3">
                  <span className="text-[#999999] text-xs line-clamp-1">
                    {item.label}
                  </span>
                  <span className="text-xs min991:text-sm font-bold shrink-0">
                    {item.value.trim() ? item.value : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
