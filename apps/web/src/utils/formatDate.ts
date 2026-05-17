export const formatDate = (date: Date | string): string => {
  const dateObj = new Date(date);

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Kyiv',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(dateObj);
  const day = parts.find(p => p.type === 'day')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const year = parts.find(p => p.type === 'year')?.value || '';
  const hours = parts.find(p => p.type === 'hour')?.value || '';
  const minutes = parts.find(p => p.type === 'minute')?.value || '';

  return `${day}/${month}/${year}, ${hours}:${minutes}`;
};

export const formatDateFull = (date: Date | string): string => {
  const d = new Date(date);

  const weekdays = ['НЕДІЛЯ', 'ПОНЕДІЛОК', 'ВІВТОРОК', 'СЕРЕДА', 'ЧЕТВЕР', "П'ЯТНИЦЯ", 'СУБОТА'];
  const months = [
    'СІЧНЯ',
    'ЛЮТОГО',
    'БЕРЕЗНЯ',
    'КВІТНЯ',
    'ТРАВНЯ',
    'ЧЕРВНЯ',
    'ЛИПНЯ',
    'СЕРПНЯ',
    'ВЕРЕСНЯ',
    'ЖОВТНЯ',
    'ЛИСТОПАДА',
    'ГРУДНЯ',
  ];

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Kyiv',
    weekday: 'long',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(d);

  const weekdayName = parts.find(p => p.type === 'weekday')?.value || '';
  const day = parts.find(p => p.type === 'day')?.value || '';
  const monthNum = parts.find(p => p.type === 'month')?.value || '';
  const year = parts.find(p => p.type === 'year')?.value || '';
  const hours = parts.find(p => p.type === 'hour')?.value || '';
  const minutes = parts.find(p => p.type === 'minute')?.value || '';

  const weekdayMap: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };
  const weekdayIndex = weekdayMap[weekdayName] ?? 0;
  const weekday = weekdays[weekdayIndex];

  const monthIndex = parseInt(monthNum) - 1;
  const month = months[monthIndex] || months[0];

  return `${weekday}, ${day} ${month} ${year}, ${hours}:${minutes}`;
};

export const formatTime = (date: Date | string): string => {
  const d = new Date(date);

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Kyiv',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  const hours = parts.find(p => p.type === 'hour')?.value || '';
  const minutes = parts.find(p => p.type === 'minute')?.value || '';

  return `${hours}:${minutes}`;
};

const monthsGenitive = [
  'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
  'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня',
];

export const formatDateShort = (date: Date | string): string => {
  const d = new Date(date);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Kyiv',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(d);
  const day = parts.find(p => p.type === 'day')?.value || '';
  const monthNum = parseInt(parts.find(p => p.type === 'month')?.value || '1') - 1;
  const year = parts.find(p => p.type === 'year')?.value || '';
  const hours = parts.find(p => p.type === 'hour')?.value || '';
  const minutes = parts.find(p => p.type === 'minute')?.value || '';
  const month = monthsGenitive[monthNum] || monthsGenitive[0];
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
};
