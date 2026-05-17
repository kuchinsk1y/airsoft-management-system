'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CalendarProps } from '@/interfaces';
import { cn } from '@/utils/cn';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import {
  CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useRef, useState } from 'react';

export function Calendar({
  value,
  onChange,
  placeholder = 'ДД.ММ.РРРР',
  className,
  textStyle,
  disabled = false,
  error = false,
}: CalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dateError, setDateError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedYearRef = useRef<HTMLDivElement | null>(null);

  const today = new Date();
  const defaultYear = today.getFullYear() - 18;

  const months = [
    'січень',
    'лютий',
    'березень',
    'квітень',
    'травень',
    'червень',
    'липень',
    'серпень',
    'вересень',
    'жовтень',
    'листопад',
    'грудень',
  ];

  const currentMonthIndex = currentMonth.getMonth();
  const currentYear = currentMonth.getFullYear();
  const baseYear = new Date().getFullYear();
  const years = Array.from({ length: 105 }, (_, i) => baseYear - i);

  const parseDateString = (dateString: string): Date | null => {
    if (!dateString) return null;
    const parts = dateString.split('-');
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    return new Date(year, month, day);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      if (d > today) {
        setDateError('Дата не може бути в майбутньому');
        return;
      }
      setDateError(null);
      const formattedDate = format(date, 'yyyy-MM-dd');
      onChange?.(formattedDate);
      setIsOpen(false);
    }
  };

  const handleInputClick = () => {
    if (!disabled) setIsOpen(!isOpen);
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);

    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(startDate.getDate() - daysToSubtract);

    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === today.toDateString();
      const selectedDate = value ? parseDateString(value) : null;
      const isSelected =
        selectedDate && date.toDateString() === selectedDate.toDateString();
      const isDisabled = date > today;

      days.push({
        date,
        isCurrentMonth,
        isToday,
        isSelected,
        isDisabled,
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={handleInputClick}
        className={cn(
          'flex 375:h-13.5 min376:h-auto 1440:h-17 min1441:h-auto w-full items-center justify-between border border-solid border-white bg-transparent px-5 1440:px-8 min1441:px-5 min1441:py-3 375:py-4 min376:py-2 1440:py-5 py-2 rounded-none cursor-pointer',
          error
            ? 'border-[#FA4616] text-[#FA4616]'
            : value
              ? 'bg-[#E8F0FE] text-[#5F6368]'
              : 'text-white',
          className,
        )}
      >
        <div
          className={cn(
            'font-medium uppercase placeholder:text-white 375:text-sm !min376:text-[10px] text-[10px] !1440:text-2xl !min1441:text-[12px] 1440:leading-[116.667%] leading-[137.5%] mb-0',
            !value && 'opacity-40 text-white',
            value && !error && 'text-[#5F6368]',
            textStyle,
          )}
        >
          {value
            ? (() => {
                const dateObj = parseDateString(value);
                if (dateObj) {
                  return format(dateObj, 'dd.MM.yyyy', { locale: uk });
                }
                return value;
              })()
            : placeholder}
        </div>
        <CalendarIcon className="h-4 w-4 1440:h-6 1440:w-6 min1441:h-4 min1441:w-4 opacity-80" />
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="calendar-container absolute top-full left-0 z-50 mt-1 rounded-md border bg-white p-3 text-gray-900 shadow-lg"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {dateError && (
              <div className="mb-1 rounded-md bg-red-50 border border-red-200 p-2 text-red-600 text-sm">
                {dateError}
              </div>
            )}

            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger
                    className="flex items-center gap-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 hover:bg-gray-50 focus:border-blue-500 focus:outline-none"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {months[currentMonthIndex]}
                    <ChevronDown className="h-3 w-3 text-gray-600" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="max-h-48 overflow-y-auto bg-white border border-gray-200 shadow-lg"
                    onPointerDownCapture={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {months.map((month, index) => (
                      <DropdownMenuItem
                        key={index}
                        onSelect={() => {
                          const newMonth = new Date(currentMonth);
                          newMonth.setMonth(index);
                          setCurrentMonth(newMonth);
                        }}
                        className="cursor-pointer text-gray-900 hover:bg-gray-100"
                      >
                        {month}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger
                    className="flex items-center gap-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 hover:bg-gray-50 focus:border-blue-500 focus:outline-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTimeout(() => {
                        selectedYearRef.current?.scrollIntoView({
                          block: 'center',
                        });
                      }, 0);
                    }}
                  >
                    {currentYear}
                    <ChevronDown className="h-3 w-3 text-gray-600" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="max-h-48 overflow-y-auto bg-white border border-gray-200 shadow-lg"
                    onPointerDownCapture={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {years.map((year) => (
                      <DropdownMenuItem
                        key={year}
                        ref={year === defaultYear ? selectedYearRef : null}
                        onSelect={() => {
                          const newMonth = new Date(currentMonth);
                          newMonth.setFullYear(year);
                          setCurrentMonth(newMonth);
                        }}
                        className="cursor-pointer text-gray-900 hover:bg-gray-100"
                      >
                        {year}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex gap-1">
                <button
                  type="button"
                  aria-label="Попередній місяць"
                  title="Попередній місяць"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newMonth = new Date(currentMonth);
                    newMonth.setMonth(newMonth.getMonth() - 1);
                    setCurrentMonth(newMonth);
                  }}
                  className="rounded p-1 hover:bg-gray-100"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Наступний місяць"
                  title="Наступний місяць"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newMonth = new Date(currentMonth);
                    newMonth.setMonth(newMonth.getMonth() + 1);
                    setCurrentMonth(newMonth);
                  }}
                  className="rounded p-1 hover:bg-gray-100"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="w-full">
              <div className="grid grid-cols-7 gap-0 mb-2">
                {['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'нд'].map((day) => (
                  <div
                    key={day}
                    className="h-9 flex items-center justify-center text-sm font-medium text-gray-600"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0">
                {calendarDays.map((dayData, index) => (
                  <button
                    key={index}
                    type="button"
                    className={cn(
                      'h-9 w-9 flex items-center justify-center text-sm font-normal rounded-md transition-colors duration-150',
                      dayData.isCurrentMonth
                        ? 'text-gray-900'
                        : 'text-gray-400',
                      dayData.isSelected &&
                        'bg-blue-600 text-white hover:bg-blue-700',
                      !dayData.isSelected &&
                        !dayData.isDisabled &&
                        'hover:bg-gray-100',
                      dayData.isToday &&
                        !dayData.isSelected &&
                        'ring-2 ring-blue-500 font-semibold',
                      dayData.isDisabled &&
                        'text-gray-300 opacity-50 cursor-not-allowed',
                    )}
                    disabled={dayData.isDisabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!dayData.isDisabled) {
                        handleDateSelect(dayData.date);
                      }
                    }}
                  >
                    {dayData.date.getDate()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
