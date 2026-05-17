'use client';

import { GeneralInput } from '@/components/generics/input/Input';
import { ChevronDownIcon } from '@/components/icons/ChevronDownIcon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CompetitionType, EventsSearchAndFiltersProps } from '@/interfaces';
import {
  getCompetitionTypeOptions,
  translateCompetitionType,
} from '@/utils/i18n';
import { useRouter } from 'next/navigation';

export const SearchAndFilters = ({
  searchQuery,
  onSearchChange,
  selectedCompetitionType,
  onCompetitionTypeChange,
  archiveButtonText = 'АРХІВ ІГОР',
  archiveButtonUrl = '/events/archive',
}: EventsSearchAndFiltersProps) => {
  const router = useRouter();

  const competitionTypeOptions: Array<{
    value: CompetitionType | null;
    label: string;
  }> = [
    { value: null, label: 'УСІ ТИПИ' },
    ...getCompetitionTypeOptions().map((option) => ({
      value: option.value,
      label: option.label,
    })),
  ];

  return (
    <div className="grid grid-rows-2 grid-cols-2 lg:grid-rows-1 lg:grid-cols-4 border-white">
      <div className="col-span-2 lg:row-start-1 lg:col-start-1">
        <GeneralInput
          type="text"
          variant="search"
          placeholder="ПОШУК ПОДІЇ..."
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="flex items-center justify-center row-start-2 col-start-1 lg:row-start-1 lg:col-start-3 lg:col-span-1 py-2 375:py-5 pl-5 pr-4 min376:py-2 lg:border-b lg:border-r lg:border-white 1440:py-8 1440:pl-10 1440:pr-6 min1441:py-2 min1441:pl-5 border-b border-white ">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center justify-center gap-2 w-full text-white uppercase focus:outline-none cursor-pointer font-medium text-sm leading-[143%] 1440:text-xl 1440:leading-[120%] min1441:text-sm">
              <p className="overflow-hidden text-ellipsis whitespace-nowrap flex-1 text-left">
                {selectedCompetitionType
                  ? translateCompetitionType(selectedCompetitionType)
                  : 'УСІ ТИПИ'}
              </p>
              <ChevronDownIcon className="w-5 h-5 1440:w-8 1440:h-8 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="bg-white text-black border border-gray-200 min-w-37.5 rounded-none"
            align="end"
            side="bottom"
            sideOffset={9}
            alignOffset={0}
            collisionPadding={0}
          >
            {competitionTypeOptions.map((option) => (
              <DropdownMenuItem
                key={option.value || 'all'}
                className={`uppercase font-medium py-1 px-3 text-sm cursor-pointer ${
                  selectedCompetitionType === option.value
                    ? 'bg-gray-200 text-black'
                    : 'hover:bg-gray-100 text-black'
                }`}
                onClick={() => onCompetitionTypeChange(option.value)}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <button
        type="button"
        className="row-start-2 col-start-2 lg:row-start-1 lg:col-start-4 lg:col-span-1 border-l border-t-0 border-white border-b bg-[#FA4616] flex items-center justify-center py-2 375:py-5 px-4 pl-5 pr-4 min376:py-2 lg:border-b 1440:py-8 1440:pl-10 1440:pr-6 lg:border-r min1441:py-2 min1441:pl-5 cursor-pointer text-sm uppercase 1440:text-xl 1440:leading-[120%] min1441:text-sm"
        onClick={() => router.push(archiveButtonUrl)}
      >
        {archiveButtonText}
      </button>
    </div>
  );
};
