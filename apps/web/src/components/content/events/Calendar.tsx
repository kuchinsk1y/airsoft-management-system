'use client';

import { EventsCalendarProps } from '@/interfaces';
import { useEffect, useRef, useState } from 'react';
import { date } from 'zod';

const Calendar = ({
  selectedDate,
  onDateSelect,
  reverse = false,
  containerStyle,
  dateItemsStyle,
}: EventsCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [dates, setDates] = useState<Date[]>([]);
  const [showGradient, setShowGradient] = useState(true);
  const [gradientStyle, setGradientStyle] = useState<React.CSSProperties>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const today = new Date();
    const dateArray: Date[] = [];

    if (reverse) {
      for (let i = 0; i < 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dateArray.push(date);
      }
    } else {
      for (let i = 0; i < 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dateArray.push(date);
      }
    }

    setDates(dateArray);
  }, [reverse]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateGradient = () => {
      const rect = container.getBoundingClientRect();
      const { scrollLeft, scrollWidth, clientWidth } = container;
      const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 1;
      const isWideScreen = window.innerWidth >= 674;

      setShowGradient(!isAtEnd && !isWideScreen);

      if (!isAtEnd) {
        const gradientWidth = 140;
        setGradientStyle({
          position: 'absolute',
          right: 0,
          top: 0,
          height: `${rect.height}px`,
          width: `${gradientWidth}px`,
        });
      }
    };

    const handleScroll = () => {
      updateGradient();
    };

    const handleResize = () => {
      updateGradient();
    };

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('scroll', updateGradient, true);
    window.addEventListener('resize', handleResize);
    updateGradient();

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', updateGradient, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [dates]);

  const formatDay = (date: Date) => {
    const days = ['НД', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
    return days[date.getDay()];
  };

  const formatMonth = (date: Date) => {
    const months = [
      'СІЧ',
      'ЛЮТ',
      'БЕР',
      'КВІ',
      'ТРА',
      'ЧЕР',
      'ЛИП',
      'СЕР',
      'ВЕР',
      'ЖОВ',
      'ЛИС',
      'ГРУ',
    ];
    return months[date.getMonth()];
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const handleDateClick = (date: Date) => {
    setCurrentDate(date);
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  return (
    <div
      className={`border-t min991:px-16 border-white ${containerStyle} overflow-x-auto min-[674px]:overflow-x-hidden w-full relative overscroll-none`}
      ref={scrollContainerRef}
    >
      <div className="flex min-w-max min-[674px]:min-w-0 min-[674px]:w-full min-[674px]:justify-center 1440:gap-0 1440:justify-between w-full">
        {dates.map((date, index) => {
          const day = formatDay(date);
          const dayNumber = date.getDate();
          const month = formatMonth(date);
          const isSelected =
            isDateSelected(date) || (!selectedDate && isToday(date));
          const isWeekendDay = isWeekend(date);

          return (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              className={`flex flex-col items-stretch justify-center flex-1 w-11.75 1440:max-w-21.75 375:h-17.5 h-12.5 min376:h-12.5 lg:h-16.25 1440:h-20 transition-colors cursor-pointer relative ${dateItemsStyle}`}
              style={{
                background: isSelected ? '#FA4616' : 'transparent',
              }}
            >
              <div
                className={`uppercase text-center text-xs leading-[133.333%] 1440:text-sm 1440:leading-[200%] 1440:font-extrabold  ${
                  !isSelected && isWeekendDay
                    ? 'text-[#FA4616] font-normal 1440:font-bold'
                    : 'text-white font-normal  1440:font-bold'
                }`}
              >
                {day}
              </div>
              <div
                className={`uppercase 375:text-base text-xs min376:text-xs font-extrabold leading-[125%]   1440:leading-[140%] 1440:text-base ${
                  !isSelected && isWeekendDay ? 'text-[#FA4616]' : 'text-white'
                }`}
              >
                {dayNumber}
              </div>
              <div
                className={`uppercase 375:text-base text-xs min376:text-xs font-extrabold leading-[100%]  1440:text-base ${
                  !isSelected && isWeekendDay ? 'text-[#FA4616]' : 'text-white'
                }`}
              >
                {month}
              </div>
            </button>
          );
        })}
      </div>
      {showGradient && (
        <div
          className="pointer-events-none z-10"
          style={{
            ...gradientStyle,
            background:
              'linear-gradient(280deg, rgba(4, 4, 4, 0) 0%, rgba(4, 4, 4, 0) 100%)',
          }}
        />
      )}
    </div>
  );
};

export default Calendar;
