'use client';

import { GeneralButton } from '@/components/generics/button/Button';
import CalendarIcon from '@/components/icons/CalendarIcon';
import LocationIcon from '@/components/icons/LocationIcon';
import OrganizerIcon from '@/components/icons/OrganizerIcon';
import ParticipantsIcon from '@/components/icons/ParticipantsIcon';
import { useTimeUntilEvent } from '@/hooks/useTimeUntilEvent';
import { EventDetailsSectionProps } from '@/interfaces';
import { addEventToCalendar } from '@/utils/calendar';
import { formatDateFull } from '@/utils/formatDate';
import { translateCompetitionType } from '@/utils/i18n';
import { ShareSection } from './ShareSection';

const hasSocialLinks = (links?: Record<string, string> | null): boolean =>
  !!links &&
  Object.values(links).some((v) => typeof v === 'string' && v.trim().length > 0)

export const EventDetailsSection = ({ event }: EventDetailsSectionProps) => {
  const gameStartAt = event.gameStartDate ?? event.startDate;
  const location = [event.city.name, event.address?.trim()]
    .filter(Boolean)
    .join(', ');
  const timeUntilEvent = useTimeUntilEvent(
    gameStartAt,
    event.isActive,
    event.endDate,
  );

  const now = new Date();
  const gameStartDate = new Date(gameStartAt);
  const hasGameStarted = gameStartDate.getTime() <= now.getTime();
  const isEventFinished = event.endDate
    ? new Date(event.endDate).getTime() <= now.getTime()
    : event.isActive === false && hasGameStarted;

  const handleAddToCalendar = () => {
    addEventToCalendar(event);
  };

  const showSocialLinks = hasSocialLinks(event.socialLinks)
  const organizerPhone = event.application.phoneNumber?.trim()
  const organizerPhoneHref = organizerPhone?.replace(/\s+/g, '')

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 border-b border-white ${showSocialLinks ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}
    >
      <div className="flex flex-col p-5 lg:pt-8 1440:px-10 1440:pb-10 min1441:px-5 min1441:pb-5 border-b border-white relative gap-5 md:border-r lg:border-b-0">
        {timeUntilEvent && (
          <div className="bg-[#FA4616] text-white px-2 h-4 375:h-5 min376:h-4 flex items-center gap-1 absolute top-3 right-3 text-[10px] leading-[160%] uppercase">
            <p className="font-medium">{timeUntilEvent.label} </p>
            <p className="font-extrabold">{timeUntilEvent.time}</p>
          </div>
        )}
        <div className="flex items-center 375:gap-3 min376:gap-2 gap-2 lg:gap-3">
          <CalendarIcon className="w-4 h-4 375:w-5 375:h-5 min376:w-4 min376:h-4 lg:w-5 lg:h-5 1440:w-6 1440:h-6 min1441:w-5 min1441:h-5" />
          <h3 className="text-white uppercase 375:text-[20px] leading-[120%] min376:text-[16px] text-[16px] 1440:text-[24px] 1440:leading-[116.667%] font-medium min1441:text-[16px]">
            ДАТА І ЧАС
          </h3>
        </div>
        <div className="flex flex-col flex-1 justify-between 375:gap-5 min376:justify-between">
          <div className="flex flex-col gap-3 375:gap-5 min376:gap-3 text-white font-medium uppercase">
            <div className="flex flex-col 375:gap-1 min376:gap-0 gap-0 lg:gap-1">
              <p className="text-xs leading-[133.333%]">РЕЄСТРАЦІЯ ДО:</p>
              <p className="375:text-[16px] min376:text-[14px] text-[16px] 1440:text-[16px] min1441:text-[14px] leading-[137.5%]">
                {formatDateFull(event.startDate)}
              </p>
            </div>
            <div className="flex flex-col 375:gap-1 min376:gap-0 gap-0 lg:gap-1">
              <p className="text-xs leading-[133.333%]">ПОЧАТОК ГРИ:</p>
              <p className="375:text-[16px] min376:text-[14px] text-[16px] 1440:text-[16px] min1441:text-[14px] leading-[137.5%]">
                {formatDateFull(gameStartAt)}
              </p>
            </div>
            <div className="flex flex-col 375:gap-1 min376:gap-0 gap-0 lg:gap-1">
              <p className="text-xs leading-[133.333%]">ЗАВЕРШЕННЯ ГРИ:</p>
              <p className="375:text-[16px] min376:text-[14px] text-[16px] 1440:text-[16px] min1441:text-[14px] leading-[137.5%]">
                {event.endDate ? formatDateFull(event.endDate) : 'Уточнюється'}
              </p>
            </div>
          </div>
          {!isEventFinished && (
            <GeneralButton
              text="ДОДАТИ В КАЛЕНДАР"
              variant="white-border"
              className="375:text-base min376:text-[14px] text-[14px] 375:py-4 min376:py-2.5 px-8 font-bold leading-[100%] 375:h-12 min376:h-auto h-auto"
              onClick={handleAddToCalendar}
            />
          )}
        </div>
      </div>

      <div className="flex flex-col p-5 lg:pt-8 1440:px-10 1440:pb-10 min1441:px-5 min1441:pb-5 border-r border-white border-b gap-3 375:gap-5 min376:gap-3 md:justify-between lg:border-b-0">
        <div className="flex flex-col gap-5">
          <div className="flex items-center 375:gap-3 lg:gap-2 min376:gap-2 gap-2">
            <LocationIcon className="w-4 h-4 375:w-5 375:h-5 min376:w-4 min376:h-4 lg:w-5 lg:h-5 1440:w-6 1440:h-6 min1441:w-5 min1441:h-5" />
            <h3 className="text-white uppercase 375:text-[20px] leading-[120%] min376:text-[16px] text-[16px] 1440:text-[24px] 1440:leading-[116.667%] font-medium min1441:text-[16px]">
              МІСЦЕ
            </h3>
          </div>
          <p className="text-white text-xs 375:text-[16px] leading-[137.5%] min376:text-[14px] text-[16px] 1440:text-[16px] min1441:text-[14px] uppercase">
            {location || event.city.name}
          </p>
        </div>
      </div>

      <div className="md:flex md:flex-col md:border-r md:border-white md:gap-5 md:p-5 lg:pt-8 1440:px-10 1440:pb-10 min1441:px-5 min1441:pb-5">
        <div className="flex flex-col p-5 md:p-0 border-r border-b border-white gap-5 md:border-b-0 md:border-r-0">
          <div className="flex items-center gap-2 375:gap-3 lg:gap-2 min376:gap-2">
            <OrganizerIcon className="w-4 h-4 375:w-5 375:h-5 min376:w-4 min376:h-4 lg:w-5 lg:h-5 1440:w-6 1440:h-6 min1441:w-5 min1441:h-5" />
            <h3 className="text-white uppercase 375:text-[20px] leading-[120%] min376:text-[16px] text-[16px] 1440:text-[24px] 1440:leading-[116.667%] font-medium min1441:text-[16px]">
              ОРГАНІЗАТОР
            </h3>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-white 375:text-[16px] min376:text-[14px] text-[16px] 1440:text-[16px] min1441:text-[14px] leading-[137.5%] uppercase">
              {event.application.name}
            </p>
            {organizerPhone && (
              <a
                href={`tel:${organizerPhoneHref}`}
                className="375:text-[16px] min376:text-[14px] text-[16px] 1440:text-[16px] min1441:text-[14px] leading-[137.5%] font-semibold"
              >
                {organizerPhone}
              </a>
            )}
          </div>
        </div>
        <div className="flex flex-col p-5 md:p-0 border-r border-b border-white gap-5 md:border-b-0 md:border-r-0">
          <div className="flex items-center gap-2 375:gap-3 lg:gap-2 min376:gap-2">
            <ParticipantsIcon className="w-4 h-4 375:w-5 375:h-5 min376:w-4 min376:h-4 lg:w-5 lg:h-5 1440:w-6 1440:h-6 min1441:w-5 min1441:h-5" />
            <h3 className="text-white uppercase 375:text-[20px] leading-[120%] min376:text-[16px] text-[16px] 1440:text-[24px] 1440:leading-[116.667%] font-medium min1441:text-[16px]">
              УЧАСНИКИ
            </h3>
          </div>
          <div className="flex flex-col gap-3 375:gap-5 min376:gap-3 lg:gap-3 1440:gap-5 min1441:gap-3">
            <div className="flex flex-col gap-2 md:gap-1 1440:gap-2 min1441:gap-1 text-white font-medium uppercase">
              <p className="375:text-base text-sm min376:text-sm 1440:text-base min1441:text-[14px] leading-[137.5%]">
                ЗАГАЛЬНА КІЛЬКІСТЬ УЧАСНИКІВ
              </p>
              <p className="375:text-[32px] min376:text-[16px] text-[16px] leading-[100%] 1440:text-[32px] min1441:text-[16px]">
                {event.maxParticipants}
              </p>
            </div>
            <div className="flex flex-col gap-2 md:gap-1 1440:gap-2 min1441:gap-1 text-white font-medium uppercase">
              <p className="375:text-base text-sm min376:text-sm 1440:text-base min1441:text-[14px] leading-[137.5%]">
                ТИП ГРИ
              </p>
              <p className="375:text-[20px] min376:text-[16px] text-[16px] leading-[100%] 1440:text-[24px] min1441:text-[16px]">
                {event.gameType?.name ?? translateCompetitionType(event.competitionType)}
              </p>
            </div>
            <div className="flex flex-col gap-2 md:gap-1 1440:gap-2 min1441:gap-1 text-white font-medium uppercase">
              <p className="375:text-base text-sm min376:text-sm 1440:text-base min1441:text-[14px] leading-[137.5%]">
                КІЛЬКІСТЬ ЗАРЕЄСТРОВАНИХ
              </p>
              <p className="375:text-[32px] min376:text-[16px] text-[16px] leading-[100%] 1440:text-[32px] min1441:text-[16px]">
                {event.registeredParticipants}
              </p>
            </div>
          </div>
        </div>
      </div>
      {showSocialLinks && (
        <div className="flex flex-col p-5 lg:pt-8 1440:px-10 1440:pb-10 min1441:px-5 min1441:pb-5">
          <ShareSection socialLinks={event.socialLinks} />
        </div>
      )}
    </div>
  );
};
