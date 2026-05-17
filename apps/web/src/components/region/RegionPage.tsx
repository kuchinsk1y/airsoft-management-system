'use client';

import Card from '@/components/content/events/Card';
import FaqBlock from '@/components/seo/FaqBlock';
import SeoTextBlock from '@/components/seo/SeoTextBlock';
import Pagination from '@/components/generics/pagination/Pagination';
import TitleBlock from '@/components/TitleBlock/TitleBlock';
import type { City, Event, FaqItem } from '@/interfaces';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';

const EVENTS_PER_PAGE = 6;

type RegionPageProps = {
  regionName: string;
  regionSlug: string;
  cities: City[];
  events: Event[];
  seoText?: string | null;
  seoFaq?: FaqItem[] | null;
};

export default function RegionPage({
  regionName,
  regionSlug,
  cities,
  events,
  seoText,
  seoFaq,
}: RegionPageProps) {
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
        title={regionName}
        path={[
          { label: 'Головна', href: '/' },
          { label: 'Контакти', href: '/contacts' },
          { label: regionName },
        ]}
      />

      {cities.length > 0 && (
        <section className="border-t border-white px-5 py-8 1440:px-14">
          <h2 className="mb-4 text-lg font-semibold uppercase tracking-[1px] 375:text-xl text-white">
            Міста регіону
          </h2>
          <div className="flex flex-wrap gap-3">
            {cities.map((city) => (
              <Link
                key={city.id}
                href={`/${city.slug}`}
                className="border border-white px-4 py-2 text-sm text-white hover:bg-white hover:text-black transition-colors"
              >
                {city.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section id="region-events" className="border-t border-white">
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
          <div
            ref={eventsContainerRef}
            className="grid grid-cols-1 min991:grid-cols-2 min1441:grid-cols-3 border-l border-white"
          >
            {paginatedEvents.map((event) => (
              <div key={event.id} className="border-r border-b border-white bg-black">
                <Card event={event} />
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-10 text-center text-gray-400 uppercase min991:px-20">
            У цьому регіоні наразі немає майбутніх подій
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

      <SeoTextBlock text={seoText ?? undefined} title={`Страйкбол у регіоні ${regionName}`} />
      <FaqBlock items={seoFaq} />
    </div>
  );
}
