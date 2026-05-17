'use client'

import { MdCalendarToday, MdLocationOn, MdPerson } from 'react-icons/md'
import { Event } from '../../../types'
import { formatTime, formatDateDisplay } from '@/app/utils/events'
import { translateCompetitionType } from '@/utils/i18n'
import styles from './UpcomingEventsList.module.css'

interface UpcomingEventsListProps {
  events: Event[]
  onEventClick: (event: Event) => void
  selectedEventId?: number
}

export default function UpcomingEventsList({ events, onEventClick, selectedEventId }: UpcomingEventsListProps) {
  const getEventGameStartDate = (event: Event): Date =>
    new Date(event.gameStartDate ?? event.startDate)

  if (events.length === 0) {
    return (
      <div className="bg-black/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 text-center">
        <p className="text-gray-400 text-sm">Немає найближчих подій</p>
      </div>
    )
  }

  return (
    <div className="bg-black/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden h-150 flex flex-col">
      <div className="p-4 border-b border-gray-800 shrink-0">
        <h3 className="font-semibold text-white">Найближчі події</h3>
        <p className="text-xs text-gray-500 mt-1">{events.length} подій</p>
      </div>

      <div className="custom-scrollbar divide-y divide-gray-800 overflow-y-auto flex-1">
        {events.map((event) => (
          <button
            key={event.id}
            onClick={() => onEventClick(event)}
            className={`w-full px-4 py-3 text-left transition-all duration-200 hover:bg-gray-900/50 ${
              selectedEventId === event.id ? 'bg-(--color-primary)/10 border-l-2 border-l-[#ea580c]' : ''
            }`}
          >
            <div className="space-y-2">
              {/* Title */}
              <p className="font-semibold text-white text-sm line-clamp-1">{event.name}</p>

              {/* Date & Time */}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <MdCalendarToday size={14} className="text-(--color-primary) shrink-0" />
                <span>
                  {formatDateDisplay(getEventGameStartDate(event))} {formatTime(getEventGameStartDate(event))}
                </span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <MdLocationOn size={14} className="text-(--color-primary) shrink-0" />
                <span className="line-clamp-1">{event.city.name}</span>
              </div>

              {/* Organizer */}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <MdPerson size={14} className="text-(--color-primary) shrink-0" />
                <span className="line-clamp-1">{event.application.owner.fullName || event.application.owner.nickName}</span>
              </div>

              {/* Type Badge */}
              <div className="pt-1">
                <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-(--color-primary)/10 text-(--color-primary)">
                  {translateCompetitionType(event.competitionType)}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
