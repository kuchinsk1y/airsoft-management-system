'use client'

import { memo, useMemo } from 'react'
import Image from 'next/image'
import { MdEdit, MdDelete, MdLocationOn, MdPerson, MdEmojiEvents, MdCheckCircle } from 'react-icons/md'
import { Event } from '../types'
import { formatTime, formatDateDisplay } from '@/app/utils/events'
import { translateCompetitionType } from '@/utils/i18n'

interface EventCardProps {
  event: Event
  onEdit: (event: Event) => void
  onDelete: (eventId: number) => void
  onManageRatings?: (event: Event) => void
  onComplete?: (event: Event) => void
  isLoading?: boolean
}

function EventCard({ event, onEdit, onDelete, onManageRatings, onComplete, isLoading = false }: EventCardProps) {
  const eventGameStartDate = new Date(event.gameStartDate ?? event.startDate)

  const getEventStatus = () => {
    if (event.isCompleted) {
      return {
        label: 'Завершений',
        className: 'bg-gray-900/80 text-gray-300',
      }
    }

    if (event.endDate) {
      const endDate = new Date(event.endDate)
      const now = new Date()

      if (eventGameStartDate <= now && now <= endDate) {
        return {
          label: 'В процесі',
          className: 'bg-orange-900/80 text-orange-200',
        }
      }
    }

    if (event.isActive) {
      return {
        label: 'Активний',
        className: 'bg-green-900/80 text-green-200',
      }
    }

    return {
      label: 'Неактивний',
      className: 'bg-gray-900/80 text-gray-300',
    }
  }

  const status = useMemo(() => getEventStatus(), [event])
  const isCompletable = useMemo(() => {
    if (event.isCompleted) return false
    if (!event.endDate) return false
    const endDate = new Date(event.endDate)
    const now = new Date()
    return endDate < now
  }, [event])

  return (
    <div className="bg-black/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden hover:border-(--color-primary)/50 transition-all duration-200 group">
      <div className="relative w-full h-48 bg-linear-to-b from-gray-900 to-black overflow-hidden">
        {event.image ? (
          <Image 
            src={event.image} 
            alt={event.name} 
            fill 
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <span className="text-sm">Немає зображення</span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.className}`}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="text-lg font-semibold text-white truncate">{event.name}</h3>
        {/* Type & Time */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="px-2.5 py-1 rounded-md bg-(--color-primary)/10 text-(--color-primary) font-medium">{translateCompetitionType(event.competitionType)}</span>
          <span className="text-gray-400">
            {formatTime(eventGameStartDate)} • {eventGameStartDate.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Kyiv' })}
          </span>
        </div>
        {/* Details Grid */}
        <div className="space-y-2 pt-2">
          {/* Location */}
          <div className="flex items-start gap-2 text-sm">
            <MdLocationOn className="text-(--color-primary) mt-0.5 shrink-0" size={16} />
            <div className="flex-1">
              <p className="text-gray-300">{event.address}</p>
              <p className="text-xs text-gray-500">
                {event.city.name}
                {event.city.region?.name && `, ${event.city.region.name}`}
              </p>
            </div>
          </div>
          {/* Organizer */}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <MdPerson className="text-(--color-primary) shrink-0" size={16} />
            <span>{event.application.owner.fullName || event.application.owner.nickName}</span>
          </div>
          {/* Participants & Price */}
          <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-700">
            <span className="text-gray-400">
              <span className="text-white font-semibold">{event.registeredParticipants}</span>/{event.maxParticipants} учасників
            </span>
            <div className="text-(--color-primary) font-semibold">
              {event.price > 0 ? `${event.price} грн.` : 'Безплатно'}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-3 border-t border-gray-800">
          {onManageRatings && (
            <button 
              onClick={() => onManageRatings(event)} 
              disabled={isLoading} 
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-yellow-900/20 hover:bg-yellow-900/30 text-yellow-400 rounded-lg transition-colors disabled:opacity-50 text-sm font-semibold border border-yellow-800/50" 
              aria-label="Управління рейтингами"
            >
              <MdEmojiEvents size={16} />
              Результати та рейтинги
            </button>
          )}
          {onComplete && isCompletable && (
            <button 
              onClick={() => onComplete(event)} 
              disabled={isLoading} 
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-900/20 hover:bg-green-900/30 text-green-400 rounded-lg transition-colors disabled:opacity-50 text-sm font-semibold border border-green-800/50" 
              aria-label="Завершити подію"
            >
              <MdCheckCircle size={16} />
              Завершити подію
            </button>
          )}
          <div className="flex gap-2 min-w-0">
            <button onClick={() => onEdit(event)} disabled={isLoading} className="min-w-0 flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-900/50 hover:bg-(--color-primary-hover)/10 hover:text-(--color-primary) text-gray-400 rounded-lg transition-colors disabled:opacity-50 text-sm font-semibold" aria-label="Редагувати">
              <MdEdit size={16} />
              <span className="truncate">Редагувати</span>
            </button>
            <button onClick={() => onDelete(event.id)} disabled={isLoading} className="min-w-0 flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-900/50 hover:bg-red-500/10 hover:text-red-400 text-gray-400 rounded-lg transition-colors disabled:opacity-50 text-sm font-semibold" aria-label="Видалити">
              <MdDelete size={16} />
              <span className="truncate">Видалити</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(EventCard)
