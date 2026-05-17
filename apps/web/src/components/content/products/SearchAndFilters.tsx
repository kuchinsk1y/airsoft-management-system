'use client';

import { GeneralInput } from '@/components/generics/input/Input';
import { ChevronDownIcon } from '@/components/icons/ChevronDownIcon';
import { FilterIcon } from '@/components/icons/FilterIcon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProductsSearchAndFiltersProps } from '@/interfaces';

export const SearchAndFilters = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  onFiltersClick,
}: ProductsSearchAndFiltersProps) => {
  const sortOptions: Array<{
    value: 'recommended' | 'price-low' | 'price-high' | 'name';
    label: string;
  }> = [
    { value: 'recommended', label: 'РЕКОМЕНДОВАНІ' },
    { value: 'price-low', label: 'ЦІНА: ЗРОСТАННЯМ' },
    { value: 'price-high', label: 'ЦІНА: СПАДАННЯМ' },
    { value: 'name', label: 'НАЗВА: А-Я' },
  ];

  const currentOption = sortOptions.find(option => option.value === sortBy) || sortOptions[0];

  return (
    <div className="grid grid-rows-2 grid-cols-2 lg:grid-rows-1 lg:grid-cols-4 border-white">
      <div className="col-span-2 lg:row-start-1 lg:col-start-1 lg:col-span-3">
        <GeneralInput
          type="text"
          variant="search"
          placeholder="ПОШУК..."
          value={searchQuery}
          onChange={event => onSearchChange(event.target.value)}
        />
      </div>

      {onFiltersClick && (
        <div
          onClick={onFiltersClick}
          className="border-r border-white flex justify-between items-center gap-3 lg:hidden row-start-2 col-start-1 py-3 pr-4 375:py-5 pl-5 375:pr-4 min376:py-3 min376:pr-4 cursor-pointer"
        >
          <span className="text-white uppercase transition font-medium text-sm leading-[143%]">
            ФІЛЬТРИ
          </span>
          <FilterIcon className="w-[13.333px] h-[13.333px] cursor-pointer" />
        </div>
      )}

      <div className="flex items-center justify-center row-start-2 col-start-2 lg:row-start-1 lg:col-start-4 lg:col-span-1 min1441:col-start-4 py-2 375:py-5 pl-5 pr-4 min376:py-2 lg:border-b lg:border-white 1440:py-8 1440:pl-10 1440:pr-6 1440:border-white lg:border-r min1441:py-2 min1441:pl-5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center justify-center gap-2 w-full text-white uppercase focus:outline-none cursor-pointer font-medium text-sm leading-[143%] lg:text-sm 1440:text-xl 1440:leading-[120%] min1441:text-sm">
              <span className="overflow-hidden text-ellipsis whitespace-nowrap flex-1 text-left">
                {currentOption.label}
              </span>
              <ChevronDownIcon className="w-5 h-5 1440:w-8 1440:h-8 min1441:w-5 min1441:h-5 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="bg-white text-black border border-gray-200 min-w-[200px] rounded-none"
            align="end"
            side="bottom"
            sideOffset={12}
            alignOffset={0}
            collisionPadding={0}
          >
            {sortOptions.map(option => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onSortChange(option.value)}
                className={`uppercase font-medium py-1 px-3 text-sm cursor-pointer ${
                  sortBy === option.value
                    ? 'bg-gray-200 text-black'
                    : 'hover:bg-gray-100 text-black'
                }`}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
