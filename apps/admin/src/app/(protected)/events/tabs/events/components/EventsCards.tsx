import { memo } from 'react'
import { Event } from '../../../types'
import EventCard from '../../../components/EventCard'

interface EventsCardsProps {
  events: Event[]
  selectedDate: Date | null
  onEdit: (event: Event) => void
  onDelete: (eventId: number) => void
  onManageRatings?: (event: Event) => void
  onComplete?: (event: Event) => void
  isLoading: boolean
}

function EventsCards({ events, selectedDate, onEdit, onDelete, onManageRatings, onComplete, isLoading }: EventsCardsProps) {
  const dateDisplay = selectedDate
    ? selectedDate.toLocaleDateString('uk-UA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      })
    : null

  if (events.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base lg:text-lg font-semibold text-white">
        {selectedDate ? (
          <>
            Події на <span className="text-(--color-primary)">{dateDisplay}</span>
          </>
        ) : (
          <span className="text-(--color-primary)">Всі події</span>
        )}
        <span className="text-gray-500 text-sm lg:text-base font-normal ml-2">({events.length})</span>
      </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onEdit={onEdit}
            onDelete={onDelete}
            onManageRatings={onManageRatings}
            onComplete={onComplete}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  )
}

export default memo(EventsCards)
