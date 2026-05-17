'use client';

import { getMyTeamRole } from '@/actions/teams';
import TitleBlock from '@/components/TitleBlock/TitleBlock';
import EventCommentsSection from '@/components/content/events/EventCommentsSection';
import { EventDetailsSection } from '@/components/content/events/EventDetailsSection';
import { EventGallerySection } from '@/components/content/events/EventGallerySection';
import EventResultsSection from '@/components/content/events/EventResultsSection';
import BackdropModal from '@/components/generics/banners/BackdropModal';
import { GeneralButton } from '@/components/generics/button/Button';
import { CloseIcon } from '@/components/icons/CloseIcon';
import { UnionIcon } from '@/components/icons/UnionIcon';
import WarningIcon from '@/components/icons/WarningIcon';
import { useUser } from '@/contexts/UserContext';
import { EventPageProps } from '@/interfaces';
import { useCartStore } from '@/stores/cartStore';
import { useUserStore } from '@/stores/userStore';
import { translateCompetitionType } from '@/utils/i18n';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const EventPage = ({
  event,
  template,
  gallery = [],
  isAlreadyRegistered = false,
}: EventPageProps) => {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const addEvent = useCartStore((state) => state.addEvent);
  const openCart = useCartStore((state) => state.openCart);
  const [showSideModal, setShowSideModal] = useState(false);
  const currentTeamId = useUserStore((state) => state.currentUser?.teamId);
  const fetchUser = useUserStore((state) => state.fetchUser);
  const [showNotOwnerModal, setShowNotOwnerModal] = useState(false);
  const [isTeamOwner, setIsTeamOwner] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);

  useEffect(() => {
    if (!event || !user || event.competitionType !== 'TEAM' || currentTeamId) {
      return;
    }

    void fetchUser();
  }, [currentTeamId, event, fetchUser, user]);

  useEffect(() => {
    if (!event || event.competitionType !== 'TEAM') {
      setIsTeamOwner(false);
      return;
    }

    const checkTeamOwnerStatus = async () => {
      if (user && currentTeamId) {
        setIsTeamOwner((await getMyTeamRole(currentTeamId)) === 'owner');
        return;
      }

      setIsTeamOwner(false);
    };

    void checkTeamOwnerStatus();
  }, [currentTeamId, event, user]);

  const hasMultipleSides = useMemo(
    () => Boolean(event?.sides && event.sides.length > 1),
    [event],
  );

  if (!event) {
    return null;
  }

  const now = new Date();
  const registrationEndDate = new Date(event.startDate);
  const gameStartDate = new Date(event.gameStartDate ?? event.startDate);
  const eventEndDate = event.endDate ? new Date(event.endDate) : null;

  const isRegistrationOpen = now.getTime() < registrationEndDate.getTime();
  const hasGameStarted = gameStartDate.getTime() <= now.getTime();
  const isEventFinished = eventEndDate
    ? eventEndDate.getTime() <= now.getTime()
    : event.isActive === false && hasGameStarted;
  const isEventInProgress = hasGameStarted && !isEventFinished;
  const isRegistrationClosed =
    !isRegistrationOpen && !isEventInProgress && !isEventFinished;
  const isEventFull = event.registeredParticipants >= event.maxParticipants;

  const handleRegisterClick = () => {
    if (
      isAlreadyRegistered ||
      isEventFinished ||
      isEventInProgress ||
      isRegistrationClosed ||
      isEventFull
    ) {
      return;
    }

    if (!user) {
      const regionParam = searchParams?.get('region');
      const url = regionParam ? `/login?region=${regionParam}` : '/login';
      router.push(url);
      return;
    }
    if (event.competitionType === 'TEAM' && !isTeamOwner) {
      setShowNotOwnerModal(true);
      return;
    }

    if (hasMultipleSides) {
      setShowSideModal(true);
      return;
    }

    addEvent(event);
    openCart();
  };

  const handleSelectSide = (eventSideId: number) => {
    addEvent(event, eventSideId);
    setShowSideModal(false);
    openCart();
  };

  const getBreadcrumbs = () => {
    if (!template?.breadcrumbs) return [];
    return [...template.breadcrumbs, event.name.toUpperCase()];
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1fr] 1440:grid-cols-[auto_565px] 1440:grid-rows-[1fr_auto] min1441:grid-rows-[1fr_auto] lg:grid-rows-[1fr_auto] min1441:grid-cols-2 border-b border-white">
        <div className="relative p-5 375:pt-10 min376:pt-5 1440:py-14 1440:px-20 md:col-start-1 md:row-start-1 lg:px-10 md:border-r md:border-white">
          <TitleBlock
            title={event.name}
            path={getBreadcrumbs()}
            className="min320:p-0 min991:pl-[0!important] min991:pt-[0!important] min991:pb-[28px!important] min1441:pb-[52px!important] min376:pb-5 pb-5 min991:pr-[0!important] 1440:p-0 flex-col 375:gap-2.5 375:pb-2.5 min320:pb-5 min376:gap-5 gap-5 1440:gap-5 min320:mb-0 min320:border-0"
            titleClassName="text-white text-[5vw] 375:text-[40px] leading-[100%] min376:text-[5vw] sm:text-[5vw] md:text-[4vw] lg:text-[3vw] 1440:text-[80px] 1440:leading-[100%] min1441:text-[2.5vw] min-[320px]:mb-0 font-semibold"
            breadcrumbClassName="min-[320px]:mb-0 min-[320px]:text-[8px] md:text-[10px] 375:text-xs lg:text-[12px] font-normal 375:!block [&_h3]:375:contents"
          >
            <UnionIcon className="hidden h-10 sm:block min991:h-12" />
          </TitleBlock>
          <div className="flex flex-col gap-2.5 1440:gap-5 text-white uppercase overflow-hidden flex-1 min-h-0">
            <p className=" text-sm 375:text-[20px] min376:text-[14px] lg:text-[20px] 1440:text-[32px] leading-[120%] min1441:text-[25px] 1440:leading-[125%] font-semibold">
              {translateCompetitionType(event.competitionType)}
            </p>
            {event.description && (
              <div>
                <p
                  onClick={() => setShowDescriptionModal(true)}
                  className=" overflow-hidden text-xs 375:text-sm min376:text-xs lg:text-base leading-[142.857%] 1440:leading-[137.5%] font-light whitespace-pre-wrap wrap-break-word cursor-pointer"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {event.description}
                </p>
                <span
                  onClick={() => setShowDescriptionModal(true)}
                  className="text-[#FA4616] cursor-pointer text-sm hover:underline whitespace-nowrap"
                >
                  Читати далі →
                </span>
              </div>
            )}
          </div>

          <div className=" flex flex-col gap-5 1440:gap-0 md:flex-row md:justify-between md:items-center text-white uppercase pt-5 lg:pt-10 1440:pt-14">
            <div className="flex flex-col gap-1">
              <p className="font-semibold uppercase text-[20px] 375:text-[32px] min376:text-[20px] lg:text-[28px] text-left leading-[125%] 1440:text-[56px] min1441:text-[30px] 1440:leading-[100%]">
                {event.price} ГРН
              </p>
              {event.paymentMethods?.length ? (
                <p className="text-gray-400 text-xs font-normal normal-case">
                  Оплата:{' '}
                  {event.paymentMethods.includes('BANK') &&
                  event.paymentMethods.includes('CASH')
                    ? 'картою або готівкою'
                    : event.paymentMethods.includes('CASH')
                      ? 'тільки готівкою'
                      : 'тільки картою'}
                </p>
              ) : null}
            </div>
            <GeneralButton
              text={
                isEventFinished
                  ? 'ПОДІЯ ЗАВЕРШИЛАСЬ'
                  : isEventInProgress
                    ? 'ПОДІЯ В ПРОЦЕСІ'
                    : isAlreadyRegistered
                      ? 'ВИ ВЖЕ ЗАРЕЄСТРОВАНІ'
                      : isRegistrationClosed
                        ? 'РЕЄСТРАЦІЮ ЗАВЕРШЕНО'
                        : isEventFull
                          ? 'МІСЦЬ НЕМАЄ'
                          : 'ВЗЯТИ УЧАСТЬ'
              }
              variant="orange-bg"
              className="1440:text-[20px] min1441:text-[16px] min376:py-2 min376:px-4 1440:py-6 min1441:py-2 leading-[100%] 1440:px-12 375:h-12 min376:h-8.75 h-8.75 1440:h-16 min1441:h-12 font-bold 1440:leading-[80%] disabled:opacity-50 disabled:cursor-not-allowed border-none"
              onClick={handleRegisterClick}
              disabled={
                isAlreadyRegistered ||
                isEventFinished ||
                isEventInProgress ||
                isRegistrationClosed ||
                isEventFull
              }
            />
            {showNotOwnerModal && (
              <BackdropModal
                text="Це командна гра. Для участі необхідно мати власну команду!"
                icon={WarningIcon}
              >
                <GeneralButton
                  text="Зрозуміло"
                  variant="orange-bg"
                  className="mt-4 w-full py-2 text-sm uppercase"
                  onClick={() => setShowNotOwnerModal(false)}
                />
              </BackdropModal>
            )}
            {showSideModal && (
              <BackdropModal text="Це подія з декількома сторонами, будь ласка виберіть сторону для реєстрації!"></BackdropModal>
            )}
          </div>
        </div>

        <div
          className=" 
        h-full 
        flex flex-col 
        overflow-hidden 
        relative 
        w-full 
        375:h-88.75 
        min376:h-[70vw] 
        h-[70vw] 
        md:h-[40vw] 
        lg:h-[35vw] 
        1440:h-145.5 
        min1441:h-125 
        md:col-start-2 md:row-start-1 min1441:col-start-2 min1441:row-start-1 min1441:row-span-2 lg:col-start-2 lg:row-start-1 lg:row-span-2 1440:row-start-1 1440:row-span-2 
        border-t border-b border-white md:border-b-0 md:border-t-0"
        >
          <Image
            src={event.image}
            alt={event.name}
            fill
            className="object-cover"
            sizes="(max-width: 320px) 100vw, (max-width: 1439px) 100vw, 620px"
            priority
          />
          <UnionIcon className="absolute bottom-2 right-2 min376:bottom-2 min376:right-2 375:right-[9.75px] 375:bottom-[9.18px] 375:w-[118.255px] 375:h-[47.824px] min376:w-17.5 min376:h-7.5 h-7.5 w-17.5 min-[890px]:hidden z-10" />
        </div>
      </div>
      <EventDetailsSection event={event} />
      {isEventFinished && (
        <EventResultsSection
          eventId={event.id}
          competitionType={event.competitionType}
        />
      )}

      {/* Gallery section - only show for finished events with photos */}
      {gallery.length > 0 && (
        <EventGallerySection eventId={event.id} gallery={gallery} />
      )}

      {isEventFinished && <EventCommentsSection eventId={event.id} />}

      {showSideModal && event.sides && event.sides.length > 1 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setShowSideModal(false)}
        >
          <div
            className="bg-background border-2 border-white/20 rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Вибір сторони"
          >
            <h3 className="text-white text-xl font-semibold uppercase mb-2">
              Оберіть сторону
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Виберіть, на яку сторону події ви реєструєтесь
            </p>
            <div className="flex flex-col gap-2">
              {event.sides.map((side) => {
                const isFull =
                  side.sideCapacity > 0 &&
                  side.playersCount !== undefined &&
                  side.playersCount >= side.sideCapacity;

                return (
                  <div key={side.id}>
                    {isFull && (
                      <div className="flex items-center gap-2 text-sm text-red-500">
                        <WarningIcon className="w-4 h-4" />
                        <span>Сторона заповнена</span>
                      </div>
                    )}
                    <button
                      type="button"
                      disabled={isFull}
                      onClick={() => handleSelectSide(side.id)}
                      className={`w-full py-3 px-4 text-left text-white uppercase font-semibold border border-white/30 rounded-lg hover:bg-[#FA4616] hover:border-[#FA4616] transition-colors ${isFull ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {side.name}
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setShowSideModal(false)}
              className="mt-4 w-full py-2 text-gray-400 hover:text-white text-sm uppercase"
            >
              Скасувати
            </button>
          </div>
        </div>
      )}

      {showDescriptionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setShowDescriptionModal(false)}
        >
          <div
            className=" relative bg-background border-2 border-white/20 rounded-xl shadow-xl max-w-4xl w-full p-6 max-h-[80vh] overflow-y-auto "
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Опис події"
          >
            <h3 className="text-2xl font-semibold uppercase mb-4 ">
              {event.name}
            </h3>

            <p className="text-sm mb-4 whitespace-pre-wrap uppercase">
              {event.description}
            </p>
            <button
              type="button"
              onClick={() => setShowDescriptionModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
              aria-label="Закрити опис події"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default EventPage;
