'use client';

import Card from '@/components/content/events/Card';
import Calendar from '@/components/content/events/Calendar';
import {
  ArchiveFilterDropdown,
  type ArchiveFilterOption,
} from '@/components/Profile/ArchiveFilterDropdown';
import type { ArchiveLabeledOption } from '@/interfaces';
import { SearchIcon } from '@/components/icons/SearchIcon';
import { Input } from '@/components/ui/input';
import type { CompetitionType, Event } from '@/interfaces';
import { getCompetitionTypeOptions, translateCompetitionType } from '@/utils/i18n';
import { useMemo, useState } from 'react';

const getGameStartDate = (event: Event): Date =>
  new Date(event.gameStartDate ?? event.startDate);

export function ArchiveClient({ events }: { events: Event[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompetitionType, setSelectedCompetitionType] =
    useState<CompetitionType | null>(null);
  const [selectedCitySlug, setSelectedCitySlug] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  const cityOptions = useMemo(() => {
    const uniqueBySlug = new Map<string, string>();
    for (const event of events) {
      if (event.city?.slug && event.city?.name) {
        uniqueBySlug.set(event.city.slug, event.city.name);
      }
    }

    return Array.from(uniqueBySlug.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'uk'));
  }, [events]);

  const monthOptions = useMemo(() => {
    const monthNames = [
      'СІЧЕНЬ',
      'ЛЮТИЙ',
      'БЕРЕЗЕНЬ',
      'КВІТЕНЬ',
      'ТРАВЕНЬ',
      'ЧЕРВЕНЬ',
      'ЛИПЕНЬ',
      'СЕРПЕНЬ',
      'ВЕРЕСЕНЬ',
      'ЖОВТЕНЬ',
      'ЛИСТОПАД',
      'ГРУДЕНЬ',
    ];

    const options: Array<ArchiveLabeledOption<string | null>> = [
      { value: null, label: 'ВСІ МІСЯЦІ' },
    ];

    const uniqueMonths = new Set<string>();

    for (const event of events) {
      const gameStart = getGameStartDate(event);
      if (Number.isNaN(gameStart.getTime())) {
        continue;
      }

      const value = `${gameStart.getFullYear()}-${String(gameStart.getMonth() + 1).padStart(2, '0')}`;
      uniqueMonths.add(value);
    }

    const sortedMonths = Array.from(uniqueMonths).sort((a, b) => b.localeCompare(a));

    for (const value of sortedMonths) {
      const [year, month] = value.split('-');
      const monthIndex = Number(month) - 1;
      const label = `${monthNames[monthIndex]} ${year}`;
      options.push({ value, label });
    }

    return options;
  }, [events]);

  const difficultyOptions = useMemo(() => {
    const fixedOrder = ['ЛЕГКА', 'СЕРЕДНЯ', 'ВИСОКА'];
    const available = new Set(
      events.map((event) => event.difficulty).filter((value): value is string => Boolean(value))
    );

    const orderedKnown = fixedOrder.filter((value) => available.has(value));
    const otherValues = Array.from(available).filter((value) => !fixedOrder.includes(value));

    return [...orderedKnown, ...otherValues];
  }, [events]);

  const competitionTypeOptions: Array<ArchiveLabeledOption<CompetitionType | null>> = [
    { value: null, label: 'УСІ ТИПИ' },
    ...getCompetitionTypeOptions().map((option) => ({
      value: option.value,
      label: option.label,
    })),
  ];

  const cityDropdownOptions = useMemo<Array<ArchiveFilterOption<string | null>>>(
    () => [
      {
        key: 'all_regions',
        value: null,
        label: 'ВСІ ОБЛАСТІ',
        itemClassName: 'text-base font-bold',
      },
      ...cityOptions.map((option) => ({
        key: option.value,
        value: option.value,
        label: option.label,
        itemClassName: 'font-medium text-sm',
      })),
    ],
    [cityOptions]
  );

  const monthDropdownOptions = useMemo<Array<ArchiveFilterOption<string | null>>>(
    () =>
      monthOptions.map((option) => ({
        key: option.value || 'all_months',
        value: option.value,
        label: option.label,
        itemClassName: option.value === null ? 'text-base font-bold' : 'font-medium text-sm',
      })),
    [monthOptions]
  );

  const competitionTypeDropdownOptions = useMemo<Array<ArchiveFilterOption<CompetitionType | null>>>(
    () =>
      competitionTypeOptions.map((option) => ({
        key: option.value || 'all_types',
        value: option.value,
        label: option.label,
        itemClassName: 'font-medium text-sm',
      })),
    [competitionTypeOptions]
  );

  const difficultyDropdownOptions = useMemo<Array<ArchiveFilterOption<string | null>>>(
    () => [
      {
        key: 'all_difficulties',
        value: null,
        label: 'ВСЯ СКЛАДНІСТЬ',
        itemClassName: 'text-base font-bold',
      },
      ...difficultyOptions.map((option) => ({
        key: option,
        value: option,
        label: option,
        itemClassName: 'font-medium text-sm',
      })),
    ],
    [difficultyOptions]
  );

  const filteredEvents = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toUpperCase();
    const shouldApplySearch = normalizedQuery.length >= 2;

    return events.filter((event) => {
      if (selectedCompetitionType && event.competitionType !== selectedCompetitionType) {
        return false;
      }

      if (selectedCitySlug && event.city?.slug !== selectedCitySlug) {
        return false;
      }

      if (selectedMonth) {
        const gameStart = getGameStartDate(event);
        if (Number.isNaN(gameStart.getTime())) {
          return false;
        }
        const eventMonth = `${gameStart.getFullYear()}-${String(gameStart.getMonth() + 1).padStart(2, '0')}`;
        if (eventMonth !== selectedMonth) {
          return false;
        }
      }

      if (selectedDate) {
        const gameStart = getGameStartDate(event);
        if (Number.isNaN(gameStart.getTime())) {
          return false;
        }
        if (
          gameStart.getFullYear() !== selectedDate.getFullYear() ||
          gameStart.getMonth() !== selectedDate.getMonth() ||
          gameStart.getDate() !== selectedDate.getDate()
        ) {
          return false;
        }
      }

      if (selectedDifficulty && event.difficulty !== selectedDifficulty) {
        return false;
      }

      if (!shouldApplySearch) {
        return true;
      }

      return (
        event.name.toUpperCase().startsWith(normalizedQuery) ||
        event.city.name.toUpperCase().startsWith(normalizedQuery)
      );
    });
  }, [
    events,
    searchQuery,
    selectedCompetitionType,
    selectedCitySlug,
    selectedDate,
    selectedMonth,
    selectedDifficulty,
  ]);

  return (
    <>
        <div className="min991:-mx-10 min991:-mt-10 flex flex-col border-white">
          <div className="relative flex items-center border-b border-white p-4 min991:px-5 min991:py-7 gap-3 min991:gap-5">
            <SearchIcon className="w-4 h-4 min991:w-5 min991:h-5" />
            <Input
              type="text"
              placeholder="ПОШУК ПОДІЇ..."
              value={searchQuery}
              onInput={(event) => setSearchQuery(event.currentTarget.value)}
              className="font-medium uppercase text-sm! min991:text-2xl! placeholder:text-white placeholder:text-left placeholder:text-sm min991:placeholder:text-2xl placeholder:uppercase placeholder:opacity-40 border-0 focus-visible:ring-0 focus-visible:border-0"
            />
          </div>

          <div className="grid grid-cols-2 min991:grid-cols-4 border-white">
            <ArchiveFilterDropdown
              containerClassName="border-l border-b"
              contentClassName="min-w-50 max-h-75 overflow-y-auto rounded-none"
              contentAlign="start"
              selectedValue={selectedCitySlug}
              displayLabel={
                selectedCitySlug
                  ? cityOptions.find((c) => c.value === selectedCitySlug)?.label || 'ОБЛАСТЬ'
                  : 'ОБЛАСТЬ'
              }
              options={cityDropdownOptions}
              onSelect={setSelectedCitySlug}
            />

            <ArchiveFilterDropdown
              containerClassName="border-l border-b border-r min991:border-r-0"
              contentClassName="min-w-50 max-h-75 overflow-y-auto rounded-none"
              contentAlign="start"
              selectedValue={selectedMonth}
              displayLabel={
                selectedMonth
                  ? monthOptions.find((m) => m.value === selectedMonth)?.label || 'МІСЯЦЬ'
                  : 'МІСЯЦЬ'
              }
              options={monthDropdownOptions}
              onSelect={(value) => {
                setSelectedMonth(value);
                setSelectedDate(undefined);
              }}
            />

            <ArchiveFilterDropdown
              containerClassName="border-l border-b"
              contentClassName="min-w-37.5 rounded-none"
              contentAlign="end"
              selectedValue={selectedCompetitionType}
              displayLabel={
                selectedCompetitionType
                  ? translateCompetitionType(selectedCompetitionType)
                  : 'ТИП ЗМАГАННЯ'
              }
              options={competitionTypeDropdownOptions}
              onSelect={setSelectedCompetitionType}
            />

            <ArchiveFilterDropdown
              containerClassName="border-l border-b border-r"
              contentClassName="min-w-50 max-h-75 overflow-y-auto rounded-none"
              contentAlign="end"
              selectedValue={selectedDifficulty}
              displayLabel={selectedDifficulty || 'СКЛАДНІСТЬ'}
              options={difficultyDropdownOptions}
              onSelect={setSelectedDifficulty}
            />
          </div>

          <Calendar
            containerStyle="border-l border-b border-r min991:px-0! "
            dateItemsStyle='max-w-21.75!'
            selectedDate={selectedDate}
            onDateSelect={(date) => {
              setSelectedDate(date);
              setSelectedMonth(null);
            }}
            reverse={true}
          />
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-10 px-4 min991:px-0">
            <p className="text-gray-400 text-lg">У вас немає завершених ігор</p>
          </div>
        ) : (
          <div className="min991:-mx-10 border-t border-white">
            <div className="grid grid-cols-1 min991:grid-cols-2 border-l border-white min991:[&>*:nth-child(odd)]:border-r">
              {filteredEvents.map((event) => (
                <Card key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}
    </>
  );
}
