'use client';

import Card from '@/components/content/events/Card';
import FaqBlock from '@/components/seo/FaqBlock';
import SeoTextBlock from '@/components/seo/SeoTextBlock';
import Pagination from '@/components/generics/pagination/Pagination';
import TitleBlock from '@/components/TitleBlock/TitleBlock';
import type { Event, FaqItem } from '@/interfaces';
import { getCityPageTitle } from '@/utils/city-landing';
import type { ContactWithCityLink } from '@/utils/contacts-page-data';
import { toSeoSafeHref } from '@/utils/seo-hide';
import Image from 'next/image';
import { useMemo, useRef, useState } from 'react';

const EVENTS_PER_PAGE = 6;

type CityPageProps = {
  contact: ContactWithCityLink;
  events: Event[];
  seoText?: string | null;
  seoFaq?: FaqItem[] | null;
};

export default function CityPage({ contact, events, seoText, seoFaq }: CityPageProps) {
  const pageTitle = getCityPageTitle(contact.city);
  const mapHref = toSeoSafeHref(contact.mapUrl);
  const [currentPage, setCurrentPage] = useState(0);
  const eventsContainerRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.ceil(events.length / EVENTS_PER_PAGE);
  const paginatedEvents = useMemo(() => {
    const startIndex = currentPage * EVENTS_PER_PAGE;
    return events.slice(startIndex, startIndex + EVENTS_PER_PAGE);
  }, [currentPage, events]);

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
      eventsContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
      eventsContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="h-full border-b border-white">
      <TitleBlock
        title={pageTitle}
        path={[
          { label: 'Головна', href: '/' },
          { label: 'Контакти', href: '/contacts' },
          { label: contact.city },
        ]}
      />

      <section className="border-t border-white">
        <div className="grid grid-cols-1 min991:grid-cols-2 min991:items-stretch">
          <div className="border-b min991:border-b-0 min991:border-r border-white px-5 py-8 min991:px-20 min991:py-14 uppercase">
            <p className="text-xs tracking-widest text-gray-400 mb-5">Контакти по місту</p>
            <h2 className="text-xl min991:text-[32px] leading-[1.1] font-semibold mb-4 text-white/90">
              Локальна підтримка
            </h2>
            <p className="text-sm min991:text-base text-gray-300 max-w-120 leading-[1.6] mb-2">
              Актуальні телефони та адреса майданчика. Якщо потрібна консультація щодо участі в подіях або прокату спорядження,
              зв&apos;яжіться з локальною командою.
            </p>
            <p className="text-xs min991:text-sm text-gray-400 tracking-wide">Місто: {contact.city}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#city-events"
                className="inline-flex items-center border border-white px-4 py-2 text-xs min991:text-sm font-semibold hover:bg-white hover:text-black transition-colors"
              >
                Дивитись події міста
              </a>
            </div>
          </div>

          <div className="px-5 py-8 min991:p-14">
            <div className="border border-white/60 p-6 min991:p-8 uppercase bg-black h-full flex flex-col gap-6">
              <p className="text-sm tracking-widest text-gray-400">Контактна інформація</p>

              <p className="text-xl min991:text-2xl font-normal flex items-center gap-2">
                <Image
                  src="/Location.svg"
                  alt="Location"
                  width={24}
                  height={24}
                  className="inline-block"
                />
                {contact.city}
              </p>

              <div>
                <p className="font-normal text-xs text-gray-300 mb-2">Телефон:</p>
                <div className="flex flex-col gap-1">
                  {contact.phones.map((phone, index) => (
                    <p key={index} className="font-normal text-xl min991:text-2xl">
                      {phone}
                    </p>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-normal text-xs text-gray-300 mb-2">Адреса:</p>
                <p className="font-normal text-base min991:text-lg">{contact.address}</p>
              </div>

              {mapHref ? (
                <a
                  href={mapHref}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="mt-auto border border-gray-500 px-3 py-3 text-sm font-semibold hover:bg-white hover:text-black transition text-center"
                >
                  Відкрити в Google Maps
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section id="city-events" className="border-t border-white">
        {totalPages > 1 ? (
          <Pagination
            totalPages={totalPages}
            currentPage={currentPage}
            onNextPage={handleNextPage}
            onPrevPage={handlePrevPage}
            title="Найближчі події"
          />
        ) : (
          <div className="flex items-center px-5 py-6 min991:px-20 min991:py-14 uppercase text-[32px] tracking-[8%] font-semibold border-b border-white">
            Найближчі події
          </div>
        )}

        {events.length > 0 ? (
          <div ref={eventsContainerRef} className="grid grid-cols-1 min991:grid-cols-2 min1441:grid-cols-3 border-l border-white">
            {paginatedEvents.map(event => (
              <div key={event.id} className="border-r border-b border-white bg-black">
                <Card event={event} />
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-10 text-center text-gray-400 uppercase min991:px-20">
            У цьому місті наразі немає майбутніх подій
          </div>
        )}

        {totalPages > 1 && (
          <Pagination
            totalPages={totalPages}
            currentPage={currentPage}
            onNextPage={handleNextPage}
            onPrevPage={handlePrevPage}
          />
        )}
      </section>

      <SeoTextBlock text={seoText ?? undefined} title={`Страйкбол у місті ${contact.city}`} />
      <FaqBlock items={seoFaq} />
    </div>
  );
}