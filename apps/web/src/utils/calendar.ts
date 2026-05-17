import { Event } from '@/interfaces';

export const addEventToCalendar = (event: Event): void => {
  const gameStartAt = event.gameStartDate ?? event.startDate;
  const startDate = new Date(gameStartAt);
  const endDate = event.endDate
    ? new Date(event.endDate)
    : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
  const location = [event.city.name, event.address?.trim()]
    .filter(Boolean)
    .join(', ');

  const formatGoogleDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.name,
    dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
    details: event.description || '',
    location: location || event.city.name,
  });

  const googleCalendarUrl = `https://calendar.google.com/calendar/render?${params.toString()}`;
  window.open(googleCalendarUrl, '_blank');
};
