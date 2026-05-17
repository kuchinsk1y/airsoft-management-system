'use client';

import { getEvents } from '@/actions/events';
import TitleBlock from '@/components/TitleBlock/TitleBlock';
import Calendar from '@/components/content/events/Calendar';
import Card from '@/components/content/events/Card';
import CurrentTime from '@/components/content/events/CurrentTime';
import { SearchAndFilters } from '@/components/content/events/SearchAndFilters';
import Pagination from '@/components/generics/pagination/Pagination';
import SeoTextBlock from '@/components/seo/SeoTextBlock';
import FaqBlock from '@/components/seo/FaqBlock';
import { CompetitionType, Event, EventsCalendarPageProps } from '@/interfaces';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const EVENTS_PER_PAGE = 6;

const toDateKey = (date?: Date) =>
  date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    : '';

const buildRequestKey = ({
  isActive,
  regionSlug,
  competitionType,
  searchQuery,
  date,
}: {
  isActive: boolean;
  regionSlug?: string;
  competitionType?: CompetitionType | null;
  searchQuery?: string;
  date?: Date;
}) =>
  JSON.stringify({
    isActive,
    regionSlug: regionSlug || '',
    competitionType: competitionType || '',
    searchQuery: (searchQuery || '').trim(),
    date: toDateKey(date),
  });

const EventsCalendarPage = ({
  initialEvents,
  template,
}: EventsCalendarPageProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams?.toString() ?? '';
  const regionSlug = searchParams?.get('region') || undefined;
  const [events, setEvents] = useState<Event[]>(initialEvents || []);
  const [searchQuery, setSearchQuery] = useState(
    searchParams?.get('searchQuery') || '',
  );
  const [selectedCompetitionType, setSelectedCompetitionType] =
    useState<CompetitionType | null>(() => {
      const typeFromUrl = searchParams?.get('competitionType');
      if (!typeFromUrl) return null;
      const validTypes: CompetitionType[] = ['TEAM', 'INDIVIDUAL', 'TRAINING'];
      return validTypes.includes(typeFromUrl as CompetitionType)
        ? (typeFromUrl as CompetitionType)
        : null;
    });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    const dateParam = searchParams?.get('date');
    if (!dateParam) return undefined;
    const [year, month, day] = dateParam.split('-').map(Number);
    return new Date(year, month - 1, day);
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const eventsContainerRef = useRef<HTMLDivElement>(null);
  const initialRequestKey = useMemo(
    () =>
      buildRequestKey({
        isActive: (searchParams?.get('isActive') ?? 'true') !== 'false',
        regionSlug,
        competitionType: selectedCompetitionType,
        searchQuery,
        date: selectedDate,
      }),
    [regionSlug, searchParams, selectedCompetitionType, selectedDate, searchQuery],
  );
  const lastRequestKeyRef = useRef<string | null>(initialRequestKey);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    const isActive = searchParams?.get('isActive') === 'false' ? false : true;
    const requestKey = buildRequestKey({
      isActive,
      regionSlug,
      competitionType: selectedCompetitionType,
      searchQuery: debouncedSearchQuery,
      date: selectedDate,
    });

    if (lastRequestKeyRef.current === requestKey) {
      return;
    }
    lastRequestKeyRef.current = requestKey;

    const loadEvents = async () => {
      try {
        const filters: {
          isActive?: boolean;
          regionSlug?: string;
          competitionType?: string;
          searchQuery?: string;
          date?: string;
        } = { isActive, regionSlug };

        if (selectedCompetitionType)
          filters.competitionType = selectedCompetitionType;

        if (debouncedSearchQuery.trim()) {
          filters.searchQuery = debouncedSearchQuery.trim();
        }

        if (selectedDate) {
          const year = selectedDate.getFullYear();
          const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
          const day = String(selectedDate.getDate()).padStart(2, '0');
          filters.date = `${year}-${month}-${day}`;
        }

        const fetchedEvents = await getEvents(filters);
        setEvents(fetchedEvents);
        setCurrentPage(0);
      } catch (error) {
        console.error('Failed to fetch events:', error);
        setEvents([]);
      }
    };

    loadEvents();
  }, [
    regionSlug,
    searchParamsString,
    debouncedSearchQuery,
    selectedCompetitionType,
    selectedDate,
  ]);

  useEffect(() => {
    if (eventsContainerRef.current) {
      eventsContainerRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [currentPage]);

  const updateUrl = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParamsString);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const currentRegion = regionSlug;
    if (currentRegion && !params.has('region')) {
      params.set('region', currentRegion);
    }

    const nextUrl = `/events?${params.toString()}`;
    const currentUrl = `/events?${searchParamsString}`;
    if (nextUrl !== currentUrl) {
      router.push(nextUrl);
    }
  }, [regionSlug, router, searchParamsString]);

  const totalPages = Math.ceil(events.length / EVENTS_PER_PAGE);
  const startIndex = currentPage * EVENTS_PER_PAGE;
  const endIndex = startIndex + EVENTS_PER_PAGE;
  const paginatedEvents = events.slice(startIndex, endIndex);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, totalPages]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  const handleCompetitionTypeChange = useCallback((value: CompetitionType | null) => {
    setSelectedCompetitionType(value);
    updateUrl('competitionType', value || null);
  }, [updateUrl]);

  const handleDateSelect = useCallback((date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      updateUrl('date', `${year}-${month}-${day}`);
      return;
    }

    updateUrl('date', null);
  }, [updateUrl]);

  return (
    <div>
      {template && template.title && template.breadcrumbs && (
        <TitleBlock
          title={template.title}
          path={template.breadcrumbs}
          className="min320:pr-5 min320:pl-5 min320:py-5 lg:p-[3vw] 1440:py-14 1440:pl-20 1440:px-20 flex-col gap-3 1440:gap-10 min1441:p-[2vw] min1441:gap-5 1440:border-r 1440:border-white"
          titleClassName="text-white text-[5vw] 375:text-[40px] 375:leading-[120%] min376:text-[5vw] md:text-[5.21vw] lg:text-[3.91vw] 1440:text-[80px] 1440:leading-[100%] min1441:text-[3.5vw] min-[320px]:mb-0"
          breadcrumbClassName="min-[320px]:mb-0 min-[320px]:text-[8px] 375:text-[12px] min376:text-[8px] md:text-[10px] lg:text-[12px]"
        >
          <CurrentTime />
        </TitleBlock>
      )}

      <SearchAndFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCompetitionType={selectedCompetitionType}
        onCompetitionTypeChange={handleCompetitionTypeChange}
      />

      <Calendar
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
      />

      {totalPages > 1 && (
        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          onNextPage={handleNextPage}
          onPrevPage={handlePrevPage}
          title="НАЙБЛИЖЧІ ПОДІЇ"
        />
      )}

      <div className="border-t border-white">
        <div
          ref={eventsContainerRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-white md:[&>*:nth-child(odd)]:border-r lg:[&>*:nth-child(3n+1)]:border-r lg:[&>*:nth-child(3n+2)]:border-r"
        >
          {events.length > 0 ? (
            paginatedEvents.map((event) => (
              <Card key={event.id} event={event} regionSlug={regionSlug} />
            ))
          ) : (
            <div className="col-span-full text-center text-gray-400 py-10">
              <p>Події не знайдено</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <Pagination
            totalPages={totalPages}
            currentPage={currentPage}
            onNextPage={handleNextPage}
            onPrevPage={handlePrevPage}
          />
        )}
      </div>

      {currentPage === 0 && (
        <>
          <SeoTextBlock text={template?.seoText} className="min991:px-20" />
          <FaqBlock items={template?.seoFaq} className="min991:px-20" />
        </>
      )}
    </div>
  );
};

export default EventsCalendarPage;
