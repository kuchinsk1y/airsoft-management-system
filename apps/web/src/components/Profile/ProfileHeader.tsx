'use client';

import type { UserEquipmentItem } from '@/constants/equipment';
import Image from 'next/image';
import {
  Award,
  Calendar,
  Mail,
  MapPin,
  Target,
  Trophy,
  Users,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import EquipmentModal from './EquipmentModal';
import { useUserStore } from '@/stores/userStore';
import { GeneralButton } from '../generics/button/Button';

const iconMap = {
  Award,
  Calendar,
  Mail,
  MapPin,
  Target,
  Trophy,
  Users,
};

export default function ProfileHeader({
  onEdit,
  equipment,
  onEquipmentSaved,
}: {
  onEdit: () => void;
  equipment: UserEquipmentItem[];
  onEquipmentSaved?: () => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentUser = useUserStore((state) => state.currentUser);
  const isLoading = useUserStore((state) => state.isLoading);
  const fetchUser = useUserStore((state) => state.fetchUser);
  const avatar = useUserStore((state) => state.currentUser?.avatarUrl || null);
  const didRequestProfileRef = useRef(false);

  useEffect(() => {
    if (didRequestProfileRef.current) {
      return;
    }
    didRequestProfileRef.current = true;
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isModalOpen]);

  const editEquipment = () => {
    setIsModalOpen((prev) => !prev);
  };

  if (isLoading)
    return (
      <p className="text-center text-gray-400 py-6 text-sm">Завантаження...</p>
    );
  if (currentUser)
    return (
      <>
        {isModalOpen && (
          <EquipmentModal
            equipment={equipment}
            onClose={editEquipment}
            onSaved={onEquipmentSaved}
          />
        )}
        <div className="flex flex-col p-2.5 min991:p-0 min991:grid min991:grid-cols-[minmax(0,1fr)_auto] min991:gap-2 min1441:gap-4 min991:items-start min-w-0">
          <div className="flex gap-4 min1441:gap-8 items-center relative min-w-0 w-full">
            <div className="relative border border-[#FF4A00] h-17.5 w-17.5 min991:h-40 min991:w-40 ">
              <Image
                src={avatar ?? '/profile-avatar.jpg'}
                alt="Avatar"
                priority
                fill
                sizes="(max-width: 990px) 70px, 160px"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col gap-4 min-w-0 flex-1 ">
              <h2 className="w-full min-w-0 line-clamp-1 break-all leading-tight text-2xl font-bold text-white min991:text-4xl min1127:text-5xl min991:font-semibold">
                {currentUser?.nickName}
              </h2>
              {currentUser?.team && (
                <span className="hidden min991:block text-base min991:text-sm min1127:text-base text-[#999999]  min-w-0 ">
                  Гравець команди «{currentUser.team}»
                </span>
              )}
              <div className="hidden min991:flex gap-2">
                <span className="text-xs border border-[#262626] px-3 py-2.5">
                  В грі з {new Date(currentUser.joined).getFullYear()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 py-2.5 min991:hidden ">
            <span className="text-xs border border-[#262626] px-3 py-2.5">
              В грі з {new Date(currentUser.joined).getFullYear()}
            </span>
          </div>
          <div className="flex flex-col justify-center h-full gap-3 shrink-0 w-full min991:w-50 min991:justify-self-end">
            <GeneralButton
              variant="orange-bg"
              text={currentUser.hasCreatedGames ? 'КЕРУВАТИ ІГРАМИ' : 'СТВОРИТИ ГРУ'}
              className="text-xs!"
              onClick={() => {
                window.open(
                  '/auth/go-to-admin-event',
                  '_blank',
                  'noopener,noreferrer',
                );
              }}
            />
            <GeneralButton
              variant="orange-bg"
              text="РЕДАГУВАТИ ПРОФІЛЬ"
              className="text-xs!"
              onClick={onEdit}
            />
            <GeneralButton
              variant="white-border"
              text="РЕДАГУВАТИ ЕКІПІРУВАННЯ"
              className="text-xs!"
              onClick={editEquipment}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 min991:gap-7 mt-2.5 p-2.5 min991:p-0 border-t border-t-[#FFFFFF] min991:mt-5 min991:border-0">
          {currentUser.stats.map((stat: any, i: number) => {
            const Icon = iconMap[stat.icon as keyof typeof iconMap];
            return (
              <div
                key={i}
                className="flex items-center justify-between border border-[#262626] w-full p-4 gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className="w-5 h-4 text-orange-500 shrink-0" />
                  <p className="text-[#A6A6A6] text-xs min991:text-sm truncate">
                    {stat.label}
                  </p>
                </div>
                <p className="text-2xl font-bold text-white shrink-0">{stat.value}</p>
              </div>
            );
          })}
        </div>
      </>
    );
}
