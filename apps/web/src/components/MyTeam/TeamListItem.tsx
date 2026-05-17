'use client';
import { ItemTeamProps, TeamListItemProps } from '@/interfaces';
import Image from 'next/image';
import joinToTeam from '@/actions/join-to-team';
import { useState } from 'react';

export default function TeamListItem({
  item,
  onOpenModal,
  onJoinError,
}: TeamListItemProps) {

  const [isLoading, setIsLoading] = useState(false);
  const handleJoinTeam = async ({ id }: { id: ItemTeamProps['id'] }) => {
    try {
      setIsLoading(true);
      onJoinError?.(null);
     const res = await joinToTeam({ id });
     if (res.success) {
      onOpenModal();
      return;
    }
    } catch (error) {
      onJoinError?.(error instanceof Error ? error.message : 'Помилка при вступі в команду');
    } finally {
      setIsLoading(false);
    } 
  };

  return (
    <>
      <div className="block min991:hidden">
        <TeamListItemMobile
          item={item}
          onClick={() => handleJoinTeam({ id: item.id })}
          isLoading={isLoading}
        />
      </div>
      <div className="hidden min991:block">
        <TeamListItemDesktop
          item={item}
          onClick={() => handleJoinTeam({ id: item.id })}
          isLoading={isLoading}
        />
      </div>
    </>
  );
}

function TeamListItemMobile({
  item,
  onClick,
  isLoading,
}: {
  item: ItemTeamProps;
  onClick?: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 px-3 border-x border border-[#999999]">
      <div className="flex gap-3 items-center">
        <Image
          src={item.logoUrl}
          alt={`${item.name} logo`}
          width={48}
          height={48}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex flex-col gap-1 items-start">
          <span className="text-base text-[#FFFFFF] font-semibold">
            {item.name}
          </span>
          <span className="text-xs text-[#999999]">
            Рейтинг: #{item.rating}
          </span>
          <span className="text-xs text-[#999999]">
            Учасників: {item.teamMember}
          </span>
        </div>
      </div>
      <button
        className={`bg-[#FF4500] py-2 px-4 text-sm font-semibold text-white uppercase border-none ${isLoading ? 'opacity-50' : ''}`}
        onClick={onClick}
        disabled={isLoading}
      >
        ВСТУПИТИ
      </button>
    </div>
  );
}

function TeamListItemDesktop({
  item,
  onClick,
  isLoading,
}: {
  item: ItemTeamProps;
  onClick?: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 px-5 border-b border-x border-[#999999]">
      <div className="flex justify-between items-center gap-4">
        <span className="text-[#CCCCCC] mr-7"> {item.rating}</span>
        <Image
          src={item.logoUrl}
          alt={`${item.name} logo`}
          width={48}
          height={48}
          className="w-12 h-12 rounded-full object-cover"
        />
        <span className="text-[#FFFFFF] font-semibold text-sm ">
          {item.name}
        </span>
      </div>
      <div className="flex items-center justify-between gap-[110px]">
        <span className="text-[#999999] mr-7">{item.teamMember}</span>
        <button
         className={`bg-[#FF4500] py-2 px-4 text-sm font-semibold text-white uppercase border-none ${isLoading ? 'opacity-50' : ''}`}
          onClick={onClick}
          disabled={isLoading}
          >
          ВСТУПИТИ
        </button>
      </div>
    </div>
  );
}
