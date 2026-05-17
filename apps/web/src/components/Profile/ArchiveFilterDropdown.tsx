import { ChevronDownIcon } from '@/components/icons/ChevronDownIcon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type {
  ArchiveFilterValue,
  ArchiveFilterDropdownProps,
} from '@/interfaces';

export type { ArchiveFilterOption } from '@/interfaces';

export function ArchiveFilterDropdown<TValue extends ArchiveFilterValue>({
  containerClassName,
  contentClassName,
  contentAlign,
  selectedValue,
  displayLabel,
  options,
  onSelect,
}: ArchiveFilterDropdownProps<TValue>) {
  return (
    <div
      className={`border-white flex items-center justify-center p-5 pr-4 min991:pr-4 min991:pl-6 min991:py-9 ${containerClassName}`}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-center gap-2 w-full text-white uppercase focus:outline-none cursor-pointer font-medium text-base leading-[143%] min991:text-base min991:leading-[143%]">
            <p className="overflow-hidden text-ellipsis whitespace-nowrap flex-1 text-left">{displayLabel}</p>
            <ChevronDownIcon className="w-5 h-5 min991:w-5 min991:h-5 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className={`bg-white text-black border border-gray-200 ${contentClassName}`}
          align={contentAlign}
          side="bottom"
          sideOffset={9}
          alignOffset={0}
          collisionPadding={0}
        >
          {options.map((option) => (
            <DropdownMenuItem
              key={option.key}
              className={`uppercase py-1 px-3 cursor-pointer ${option.itemClassName || 'font-medium text-sm'} ${
                selectedValue === option.value ? 'bg-gray-200 text-black' : 'hover:bg-gray-100 text-black'
              }`}
              onClick={() => onSelect(option.value)}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
