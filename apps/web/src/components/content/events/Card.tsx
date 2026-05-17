'use client';

import { GeneralButton } from '@/components/generics/button/Button';
import LocationIcon from '@/components/icons/LocationIcon';
import OrganizerIcon from '@/components/icons/OrganizerIcon';
import ParticipantsIcon from '@/components/icons/ParticipantsIcon';
import { useTimeUntilEvent } from '@/hooks/useTimeUntilEvent';
import { EventCardProps } from '@/interfaces';
import { formatDate } from '@/utils/formatDate';
import { formatPrice } from '@/utils/formatPrice';
import { translateCompetitionType } from '@/utils/i18n';
import { getEventPath } from '@/utils/event-url';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

const Card = ({ event, hideBorderOn1440, regionSlug }: EventCardProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameStartDate = event.gameStartDate ?? event.startDate;
  const location = [event.city.name, event.address?.trim()]
    .filter(Boolean)
    .join(', ');
  const timeUntilEvent = useTimeUntilEvent(gameStartDate, event.isActive, event.endDate);

  const handleCardClick = () => {
    const eventPath = getEventPath(event);
    const effectiveRegionSlug = regionSlug ?? searchParams?.get('region') ?? undefined;
    router.push(
      effectiveRegionSlug
        ? `${eventPath}?region=${effectiveRegionSlug}`
        : eventPath,
    );
  };

  return (
    <div
      className={`flex flex-col border-b justify-between border-white ${hideBorderOn1440 ? '1440:border-b-0' : ''} bg-black overflow-hidden`}
    >
      <div className="flex flex-col gap-5">
        <div className="relative w-full 375:h-60 1440:h-60 h-60 border-b border-white">
          <Image
            src={event.image}
            alt={event.name}
            fill
            className="object-cover"
            sizes="(max-width: 767px) 100vw, (max-width: 1439px) 50vw, 33vw"
          />
          <div className="absolute top-2.5 left-2.5 1440:top-3 1440:left-3 bg-[#FA4616] text-white px-2 py-1 1440:px-2.5 1440:py-1.5">
            <p className="text-xs min376:text-xs 375:text-base 1440:text-base font-medium leading-[125%]">
              {formatDate(gameStartDate)}
            </p>
            {timeUntilEvent && (
              <p className="text-xs uppercase">
                <span className="font-medium leading-[166.667%]">
                  {timeUntilEvent.label}{' '}
                </span>
                <span className="font-extrabold">{timeUntilEvent.time}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col ml-5 md:ml-8">
          <h3
            className="text-white text-base 375:text-2xl min376:text-base 1440:text-[32px] min1441:text-[28px] font-semibold uppercase 1440:leading-[125%] leading-[133.333%] tracking-[1.92px] 1440:tracking-[2.56x] cursor-pointer hover:underline transition-colors"
            onClick={handleCardClick}
          >
            {event.name}
          </h3>
          <p className="text-xs min376:text-xs 375:text-base 1440:text-[20px] min1441:text-[16px] uppercase font-light leading-[150%] 1440:leading-[140%]">
            {translateCompetitionType(event.competitionType)}
          </p>
        </div>
      </div>

      <div className="flex flex-col p-5 pt-2 1440:pt-12 1440:pb-16 min1441:pb-10 min1441:pt-10 1440:px-16 375:gap-5 min376:gap-3 gap-3 1440:gap-5 md:px-8 min1441:px-11">
        <div className="flex flex-col text-white text-xs min376:text-xs 375:text-base 1440:text-[20px] min1441:text-[16px] leading-[150%] 1440:leading-[140%] font-light uppercase min1441:gap-0.5">
          <div className="flex items-center gap-2">
            <OrganizerIcon className="shrink-0 375:w-5 375:h-5 w-3 h-3 min376:w-3 min376:h-3 1440:w-6 1440:h-6 min1441:w-5 min1441:h-5" />
            <p className="overflow-hidden">{event.application.name}</p>
          </div>

          <div className="flex items-center gap-2">
            <LocationIcon className="shrink-0 375:w-5 375:h-5 w-3 h-3 min376:w-3 min376:h-3 1440:w-6 1440:h-6 min1441:w-5 min1441:h-5" />
            <p className="overflow-hidden">
              {location || event.city.name}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ParticipantsIcon className="shrink-0 375:w-5 375:h-5 w-3 h-3 min376:w-3 min376:h-3 1440:w-6 1440:h-6 min1441:w-5 min1441:h-5" />
            <span>
              {event.registeredParticipants}/{event.maxParticipants}
            </span>
          </div>

          <div className="pt-1 text-[10px] min376:text-[10px] 375:text-xs 1440:text-sm min1441:text-xs leading-[140%] uppercase text-white/85">
            <p>Реєстрація до: {formatDate(event.startDate)}</p>
            <p>Початок гри: {formatDate(gameStartDate)}</p>
            <p>
              Завершення гри: {event.endDate ? formatDate(event.endDate) : 'Уточнюється'}
            </p>
          </div>

          {event.winnerTeamName ? (
            <div className="flex items-center gap-2 pt-2">
              <span className='font-semibold tracking-wider'>ПЕРЕМОЖЕЦЬ:</span>
              <span className="font-semibold text-[#FA4616]">
                {event.winnerTeamName}
              </span>
            </div>
          ) : (
            <p className="text-white text-base min376:text-base 375:text-2xl 1440:text-2xl min1441:text-xl font-semibold leading-[133.333%] tracking-[1.92px]">
              {formatPrice(event.price)} ГРН
            </p>
          )}
        </div>

        <GeneralButton
          text="ДЕТАЛЬНІШЕ"
          variant="white-border"
          className="text-xs min376:text-xs 375:text-base 1440:text-base 375:px-8 375:py-4 min376:py-2 min376:px-4 1440:px-8 1440:py-4 min1441:py-2 w-full leading-[100%] 375:h-12 min376:h-8.75 h-8.75 1440:h-12 min1441:h-10 font-bold"
          onClick={handleCardClick}
        />
      </div>
    </div>
  );
};

export default Card;
