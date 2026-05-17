import { TimeUntilEvent } from '@/interfaces';
import { useEffect, useState } from 'react';

export const useTimeUntilEvent = (
  eventDate: Date | string,
  isEventActive: boolean = true,
  eventEndDate?: Date | string,
): TimeUntilEvent | null => {
  const [timeUntilEvent, setTimeUntilEvent] = useState<TimeUntilEvent | null>(null);

  useEffect(() => {
    const calculateTimeUntil = () => {
      const eventDateObj = new Date(eventDate);
      const eventEndDateObj = eventEndDate ? new Date(eventEndDate) : null;
      const now = new Date();
      const diff = eventDateObj.getTime() - now.getTime();

      if (diff <= 0) {
        const hasEnded = eventEndDateObj
          ? eventEndDateObj.getTime() <= now.getTime()
          : !isEventActive;

        setTimeUntilEvent({
          label: 'ПОДІЯ',
          time: hasEnded ? 'ЗАВЕРШИЛАСЬ' : 'В ПРОЦЕСІ',
        });
        return;
      }

      const totalMinutes = Math.floor(diff / (1000 * 60));
      const days = Math.floor(totalMinutes / (60 * 24));
      const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
      const minutes = totalMinutes % 60;

      let time = '';
      if (days > 0) {
        time = `${days} ДН ${hours} ГОД ${minutes} ХВ`;
      } else if (hours > 0) {
        time = `${hours} ГОД ${minutes} ХВ`;
      } else {
        time = `${minutes} ХВ`;
      }

      setTimeUntilEvent({ label: 'ДО ПОДІЇ:', time });
    };

    calculateTimeUntil();
    const interval = setInterval(calculateTimeUntil, 60000);

    return () => clearInterval(interval);
  }, [eventDate, isEventActive, eventEndDate]);

  return timeUntilEvent;
};
