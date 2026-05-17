'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { MdChevronLeft, MdChevronRight } from 'react-icons/md'
import { getCalendarDays, isSameDay, isCurrentMonth, formatDateISO } from '@/app/utils/events'
import { translateCompetitionType } from '@/utils/i18n'

interface CalendarProps {
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  currentMonth: Date
  onMonthChange: (date: Date) => void
  markedDates?: string[]
  // Фільтри
  filterType: string
  onFilterTypeChange: (type: string) => void
  filterCity: string
  onFilterCityChange: (city: string) => void
  uniqueTypes: string[]
  uniqueCities: string[]
  resultsCount: number
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']

export default function Calendar({ 
  selectedDate, 
  onDateSelect, 
  currentMonth, 
  onMonthChange, 
  markedDates = [],
  filterType,
  onFilterTypeChange,
  filterCity,
  onFilterCityChange,
  uniqueTypes,
  uniqueCities,
  resultsCount
}: CalendarProps) {
  const shouldReduceMotion = useReducedMotion()
  const calendarDays = getCalendarDays(currentMonth)
  const monthName = currentMonth.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' })

  const handlePrevMonth = () => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  const handleNextMonth = () => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))

  return (
    <div className="bg-black/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden flex flex-col h-150">
      {/* Header з фільтрами */}
      <div className="p-4 border-b border-gray-800 space-y-3 shrink-0">
        {/* Перший рядок: назва місяця + навігація */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-white capitalize">{monthName}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Оберіть дату та фільтри</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-900/50 rounded-lg transition-colors text-gray-400 hover:text-white" aria-label="Попередній місяць">
              <MdChevronLeft size={20} />
            </button>
            <button onClick={handleNextMonth} className="p-2 hover:bg-gray-900/50 rounded-lg transition-colors text-gray-400 hover:text-white" aria-label="Наступний місяць">
              <MdChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Другий рядок: фільтри */}
        <div className="flex items-center gap-2">
          <select value={filterType} onChange={(e) => onFilterTypeChange(e.target.value)} title="Тип змагань" className="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white text-xs focus:border-(--color-primary) focus:outline-none transition-colors">
            {uniqueTypes.map((type) => (
              <option key={type} value={type}>{type === 'Всі' ? type : translateCompetitionType(type)}</option>
            ))}
          </select>

          <select value={filterCity} onChange={(e) => onFilterCityChange(e.target.value)} title="Місто" className="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white text-xs focus:border-(--color-primary) focus:outline-none transition-colors">
            {uniqueCities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <div className="text-xs text-gray-400 whitespace-nowrap">
            <span className="font-semibold text-(--color-primary)">{resultsCount}</span> івентів
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 flex-1 flex flex-col">
        {/* Weekdays */}
        <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-gray-500 py-1">{day}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1 flex-1 content-start">
        {calendarDays.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="h-18" />

          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
          const isCurrentMonthDay = isCurrentMonth(day, currentMonth)
          const isMarked = markedDates.includes(formatDateISO(day))

          return (
            <button key={formatDateISO(day)} onClick={() => onDateSelect(day)}
              className={`
                w-full h-18 rounded flex items-center justify-center text-sm font-medium
                transition-colors duration-200 relative overflow-hidden
                ${isSelected ? 'text-white' : ''}
                ${isCurrentMonthDay && !isSelected ? 'text-white hover:bg-gray-900/50' : ''}
                ${!isCurrentMonthDay && !isSelected ? 'text-gray-600' : ''}
                ${isMarked && !isSelected ? 'ring-1 ring-(--color-primary)/50' : ''}
              `}
            >
              {isSelected && (
                <motion.span
                  layoutId="calendar-active-day"
                  className="absolute inset-0 rounded bg-(--color-primary)"
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 420, damping: 34, mass: 0.72 }
                  }
                />
              )}

              <span className="relative z-10">{day.getDate()}</span>
              {isMarked && !isSelected && <div className="absolute bottom-1 w-1 h-1 bg-(--color-primary) rounded-full" />}
            </button>
          )
        })}
      </div>
      </div>
    </div>
  )
}
