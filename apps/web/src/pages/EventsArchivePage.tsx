'use client';

import { getEvents } from '@/actions/events';
import TitleBlock from '@/components/TitleBlock/TitleBlock';
import Calendar from '@/components/content/events/Calendar';
import Card from '@/components/content/events/Card';
import CurrentTime from '@/components/content/events/CurrentTime';
import { MonthDropdown } from '@/components/content/events/MonthDropdown';
import { SearchAndFilters } from '@/components/content/events/SearchAndFilters';
import Pagination from '@/components/generics/pagination/Pagination';
import SeoTextBlock from '@/components/seo/SeoTextBlock';
import { CompetitionType, Event, EventsCalendarPageProps } from '@/interfaces';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const EVENTS_PER_PAGE = 6;

const EventsArchivePage = ({
  initialEvents,
  template,
}: EventsCalendarPageProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const regionSlug = searchParams?.get('region') || undefined;
  const [events, setEvents] = useState<Event[]>(initialEvents || []);
  const [searchQuery, setSearchQuery] = useState(
    searchParams?.get('searchQuery') || '',
  );
  const [selectedCompetitionType, setSelectedCompetitionType] =
    useState<CompetitionType | null>(
      (searchParams?.get('competitionType') as CompetitionType) || null,
    );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    const dateParam = searchParams?.get('date');
    if (!dateParam) return undefined;
    const [year, month, day] = dateParam.split('-').map(Number);
    return new Date(year, month - 1, day);
  });
  const [selectedMonth, setSelectedMonth] = useState<string | null>(
    searchParams?.get('month') || null,
  );
  const [currentPage, setCurrentPage] = useState(0);
  const eventsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const urlSearchQuery = searchParams?.get('searchQuery') || '';
    const urlCompetitionType =
      (searchParams?.get('competitionType') as CompetitionType) || null;
    const urlDate = searchParams?.get('date');
    const urlMonth = searchParams?.get('month') || null;

    setSearchQuery(urlSearchQuery);
    setSelectedCompetitionType(urlCompetitionType);
    setSelectedMonth(urlMonth);

    if (urlDate) {
      const [year, month, day] = urlDate.split('-').map(Number);
      setSelectedDate(new Date(year, month - 1, day));
    } else {
      setSelectedDate(undefined);
    }
  }, [searchParams?.toString()]);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const filters: {
          isActive?: boolean;
          regionSlug?: string;
          competitionType?: string;
          searchQuery?: string;
          date?: string;
          month?: string;
        } = {
          isActive: false,
          regionSlug,
        };

        if (selectedCompetitionType)
          filters.competitionType = selectedCompetitionType;

        if (searchQuery.trim()) filters.searchQuery = searchQuery.trim();

        if (selectedMonth) {
          filters.month = selectedMonth;
        } else if (selectedDate) {
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
    searchParams?.toString(),
    searchQuery,
    selectedCompetitionType,
    selectedDate,
    selectedMonth,
  ]);

  useEffect(() => {
    if (eventsContainerRef.current) {
      eventsContainerRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [currentPage]);

  const updateUrl = (
    keyOrUpdates: string | Record<string, string | null>,
    value?: string | null,
  ) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    
    if (typeof keyOrUpdates === 'object') {
      // Атомарное обновление нескольких параметров
      Object.entries(keyOrUpdates).forEach(([key, val]) => {
        if (val) {
          params.set(key, val);
        } else {
          params.delete(key);
        }
      });
    } else {
      // Одиночное обновление (обратная совместимость)
      if (value) {
        params.set(keyOrUpdates, value);
      } else {
        params.delete(keyOrUpdates);
      }
    }
    
    params.set('isActive', 'false');
    const currentCity = searchParams?.get('city');
    if (currentCity && !params.has('city')) {
      params.set('city', currentCity);
    }
    router.push(`/events/archive?${params.toString()}`);
  };

  const totalPages = Math.ceil(events.length / EVENTS_PER_PAGE);
  const startIndex = currentPage * EVENTS_PER_PAGE;
  const endIndex = startIndex + EVENTS_PER_PAGE;
  const paginatedEvents = events.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  };

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
        onCompetitionTypeChange={(value) => {
          setSelectedCompetitionType(value);
          updateUrl('competitionType', value || null);
        }}
        archiveButtonText="КАЛЕНДАР МАЙБУТНІХ ПОДІЙ"
        archiveButtonUrl="/events"
      />

      <div className="flex flex-col border-white">
        <MonthDropdown
          selectedMonth={selectedMonth}
          onMonthSelect={(month) => {
            setSelectedMonth(month);
            setSelectedDate(undefined);
            updateUrl({ month, date: null });
          }}
        />
        <Calendar
          selectedDate={selectedDate}
          onDateSelect={(date) => {
            setSelectedDate(date);
            setSelectedMonth(null);
            if (date) {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              updateUrl({ date: `${year}-${month}-${day}`, month: null });
            } else {
              updateUrl({ date: null });
            }
          }}
          reverse={true}
        />
      </div>

      {totalPages > 1 && (
        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          onNextPage={handleNextPage}
          onPrevPage={handlePrevPage}
          title="АРХІВ ПОДІЙ"
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
        <SeoTextBlock text={template?.seoText} className="min991:px-20" />
      )}
    </div>
  );
};

export default EventsArchivePage;
