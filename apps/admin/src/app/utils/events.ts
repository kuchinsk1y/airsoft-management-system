const EVENT_TIME_ZONE = 'Europe/Kyiv'

const getDatePartsInTimeZone = (date: Date, timeZone: string): { year: string; month: string; day: string } => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  return {
    year: parts.find((part) => part.type === 'year')?.value || '',
    month: parts.find((part) => part.type === 'month')?.value || '',
    day: parts.find((part) => part.type === 'day')?.value || '',
  }
}

export const getFirstDayOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export const getLastDayOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

export const getCalendarDays = (date: Date): (Date | null)[] => {
  const firstDay = getFirstDayOfMonth(date)
  const lastDay = getLastDayOfMonth(date)
  const startDate = new Date(firstDay)

  const dayOfWeek = firstDay.getDay()
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  startDate.setDate(startDate.getDate() - daysToSubtract)

  const days: (Date | null)[] = []
  const currentDate = new Date(startDate)

  while (currentDate <= lastDay || days.length % 7 !== 0) {
    days.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return days
}

export const formatDateISO = (date: Date | string | null): string => {
  if (!date) return ''
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(dateObj.getTime())) return ''

  const { year, month, day } = getDatePartsInTimeZone(dateObj, EVENT_TIME_ZONE)
  return `${year}-${month}-${day}`
}

export const formatDateDisplay = (date: Date): string => {
  return date.toLocaleDateString('uk-UA', {
    timeZone: EVENT_TIME_ZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('uk-UA', {
    timeZone: EVENT_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

export const isCurrentMonth = (date: Date, monthDate: Date): boolean => {
  return date.getMonth() === monthDate.getMonth() && date.getFullYear() === monthDate.getFullYear()
}
