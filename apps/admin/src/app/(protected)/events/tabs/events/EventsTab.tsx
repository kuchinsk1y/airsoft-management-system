'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import EventsImportModal from '../../components/EventsImportModal'
import EventFormModal from '../../components/EventFormModal'
import DeleteConfirmModal from '../../components/DeleteConfirmModal'
import TabsNavigation from '../../components/TabsNavigation'
import LoadingSpinner from '@/app/components/LoadingSpinner'
import CSVImportButton from '@/app/components/CSVImportButton'
import CSVExportButton from '@/app/components/CSVExportButton'
import Toast, { ToastMessage } from '@/app/components/Toast'
import { Event, EventFormData } from '../../types'
import { formatDateISO } from '@/app/utils/events'
import { getEnglishCompetitionType } from '@/utils/i18n'
import * as eventsApi from '@/actions/events'
import { EventsHeader, EventsFilters, EventsGrid, EventsCards } from './components'

const EXPORT_HEADERS = ['Назва', 'Зображення', 'Початок гри', 'Дата закінчення', 'Місто', 'Місце проведення', 'Тип змагання', 'Макс. учасників', 'Зареєстровано', 'Ціна', 'Статус']

const eventToFormData = (event: Event): EventFormData => ({
  name: event.name,
  image: event.image,
  startDate: new Date(event.startDate),
  gameStartDate: new Date(event.gameStartDate),
  endDate: event.endDate
    ? new Date(event.endDate)
    : new Date(event.gameStartDate ?? event.startDate),
  description: event.description,
  city: event.city.slug,
  address: event.address,
  regionId: event.city.region?.id ?? 0,
  maxParticipants: event.maxParticipants,
  competitionType: event.competitionType,
  gameTypeId: event.gameTypeId,
  price: event.price,
  isActive: event.isActive,
  applicationId: event.applicationId,
  paymentMethods: event.paymentMethods?.length ? event.paymentMethods : ['BANK', 'CASH'],
  sides:
    event.sides && event.sides.length >= 2
      ? event.sides.map((s) => ({
          name: s.name,
          sideCapacity:
            s.sideCapacity > 0
              ? s.sideCapacity
              : Math.max(1, Math.trunc(event.maxParticipants / event.sides!.length) || 1),
        }))
      : [
          { name: 'Сторона 1', sideCapacity: 10 },
          { name: 'Сторона 2', sideCapacity: 10 },
        ],
  socialLinks: event.socialLinks,
})

const getEventGameStartDate = (event: Event): Date =>
  new Date(event.gameStartDate ?? event.startDate)

export default function EventsTab() {
  const queryClient = useQueryClient()
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | undefined>()
  const [selectedUpcomingEventId, setSelectedUpcomingEventId] = useState<number | undefined>()

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteConfirmEventId, setDeleteConfirmEventId] = useState<number | null>(null)
  const [deleteConfirmEventName, setDeleteConfirmEventName] = useState('')
  const [isDeletingEvent, setIsDeletingEvent] = useState(false)
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)

  const [filterType, setFilterType] = useState<string>('Всі')
  const [filterCity, setFilterCity] = useState<string>('Всі')
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'selected-date' | 'week'>('all')
  const [showAllEvents, setShowAllEvents] = useState(true)
  const editingFormData = useMemo(
    () => (editingEvent ? eventToFormData(editingEvent) : undefined),
    [editingEvent],
  )

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const { data: events = [], isLoading, error: loadError } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsApi.fetchEvents(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  })

  const approvedEvents = useMemo(
    () => events.filter((event) => event.status === 'APPROVED'),
    [events],
  )

  const isEventInProgress = useCallback((event: Event, now: Date) => {
    if (event.isCompleted || !event.endDate) return false

    const start = getEventGameStartDate(event)
    const end = new Date(event.endDate)

    return start <= now && now <= end
  }, [])

  const allEventsForDisplay = useMemo(() => {
    const now = new Date()

    return approvedEvents.filter((event) => {
      // Показываем незавершенные события:
      // - будущие события
      // - или те, что сейчас в процессе (между gameStartDate и endDate)
      if (event.isCompleted) return false

      const inProgress = isEventInProgress(event, now)
      if (!event.isActive && !inProgress) return false
      
      const eventDate = getEventGameStartDate(event)
      
      // Фильтр по дате применяется только если не выбран "all"
      // Для незавершенных событий показываем все, независимо от даты
      if (filterPeriod === 'selected-date' && !showAllEvents && selectedDate) {
        const isSameDay = eventDate.toDateString() === selectedDate.toDateString()
        if (!isSameDay) return false
      } else if (filterPeriod === 'week') {
        // Для фильтра "week" показываем все незавершенные события (включая с прошедшими датами)
        // и будущие события на этой неделе
        const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        // Для незавершенных событий показываем все, независимо от даты
        // Для будущих событий показываем только те, что на этой неделе
        if (eventDate > weekEnd) return false
        // Не проверяем eventDate < today, так как незавершенные события показываем всегда
      }
      // Если filterPeriod === 'all', показываем все незавершенные события независимо от даты
      
      if (filterType !== 'Всі') {
        const englishFilterType = getEnglishCompetitionType(filterType)
        if (event.competitionType !== englishFilterType) return false
      }
      if (filterCity !== 'Всі' && event.city.name !== filterCity) return false
      return true
    })
  }, [approvedEvents, filterType, filterCity, filterPeriod, selectedDate, showAllEvents, isEventInProgress])

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return allEventsForDisplay
    return allEventsForDisplay.filter((event: Event) => {
      const eventDate = getEventGameStartDate(event)
      return (
        eventDate.getFullYear() === selectedDate.getFullYear() &&
        eventDate.getMonth() === selectedDate.getMonth() &&
        eventDate.getDate() === selectedDate.getDate()
      )
    })
  }, [allEventsForDisplay, selectedDate])

  const upcomingEvents = useMemo(() => {
    const now = new Date()
    const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return approvedEvents
      .filter((event) => {
        const eventDate = getEventGameStartDate(event)
        return eventDate >= now && eventDate <= oneWeekLater && !event.isCompleted
      })
      .sort((a, b) => getEventGameStartDate(a).getTime() - getEventGameStartDate(b).getTime())
      .slice(0, 10)
  }, [approvedEvents])

  const uniqueCities = useMemo(() => {
    const cities = approvedEvents
      .map((e) => (e?.city?.name ? e.city.name : typeof e?.city === 'string' ? e.city : undefined))
      .filter((c): c is string => Boolean(c))
    return ['Всі', ...Array.from(new Set(cities))]
  }, [approvedEvents])

  const uniqueTypes = useMemo(() => {
    const types = approvedEvents
      .map((e) => e.competitionType)
      .filter(Boolean)
    return ['Всі', ...Array.from(new Set(types))]
  }, [approvedEvents])

  const markedDates = useMemo(() => {
    const dates = allEventsForDisplay
      .filter((event) => {
        if (!event.gameStartDate && !event.startDate) return false
        const eventDate = getEventGameStartDate(event)
        return (
          eventDate.getMonth() === currentMonth.getMonth() &&
          eventDate.getFullYear() === currentMonth.getFullYear()
        )
      })
      .map((event) => formatDateISO(event.gameStartDate ?? event.startDate))
    return dates
  }, [allEventsForDisplay, currentMonth])

  const invalidateModerationData = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['events', 'moderation'] }),
      queryClient.invalidateQueries({ queryKey: ['events', 'moderation', 'pending-count'] }),
    ])
  }, [queryClient])

  const handleFormSubmit = useCallback(
    async (formData: EventFormData, imageFile?: File) => {
      if (isSubmittingEvent) return

      try {
        setIsSubmittingEvent(true)
        let savedEvent: Event
        if (editingEvent) {
          savedEvent = await eventsApi.updateEventWithImage(editingEvent.id, formData, imageFile)
          addToast('Подія успішно відредагована', 'success')
        } else {
          savedEvent = await eventsApi.createEventWithImage(formData, imageFile)
          addToast(
            savedEvent.status === 'APPROVED'
              ? 'Подія створена'
              : 'Подія створена та відправлена на модерацію',
            'success'
          )
        }

        queryClient.setQueryData<Event[]>(['events'], (prev = []) => {
          const index = prev.findIndex((event) => event.id === savedEvent.id)
          if (index >= 0) {
            const next = [...prev]
            next[index] = savedEvent
            return next
          }
          return [savedEvent, ...prev]
        })

        await invalidateModerationData()

        const eventDate = getEventGameStartDate(savedEvent)
        setSelectedDate(eventDate)
        setShowAllEvents(false)
        setFilterPeriod('selected-date')
        setCurrentMonth(new Date(eventDate.getFullYear(), eventDate.getMonth(), 1))

        setIsFormOpen(false)
        setEditingEvent(undefined)
      } catch (err) {
        console.error('Failed to submit event:', err)
        addToast(err instanceof Error ? err.message : 'Помилка при збереженні', 'error')
        alert(err instanceof Error ? err.message : 'Failed to save event')
      } finally {
        setIsSubmittingEvent(false)
      }
    },
    [editingEvent, addToast, queryClient, isSubmittingEvent, invalidateModerationData]
  )

  const handleDeleteEvent = useCallback((eventId: number) => {
    const eventToDelete = approvedEvents.find(e => e.id === eventId)
    setDeleteConfirmEventId(eventId)
    setDeleteConfirmEventName(eventToDelete?.name || '')
    setDeleteConfirmOpen(true)
  }, [approvedEvents])

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirmEventId || isDeletingEvent) return

    try {
      setIsDeletingEvent(true)
      await eventsApi.deleteEvent(deleteConfirmEventId)
      await queryClient.invalidateQueries({ queryKey: ['events'] })
      await invalidateModerationData()
      addToast('Подія видалена', 'success')
    } catch (err) {
      console.error('Failed to delete event:', err)
      addToast(err instanceof Error ? err.message : 'Помилка при видаленні', 'error')
    } finally {
      setIsDeletingEvent(false)
      setDeleteConfirmOpen(false)
      setDeleteConfirmEventId(null)
      setDeleteConfirmEventName('')
    }
  }, [deleteConfirmEventId, isDeletingEvent, addToast, queryClient, invalidateModerationData])

  const handleEditEvent = useCallback((event: Event) => {
    setEditingEvent(event)
    setIsFormOpen(true)
  }, [])

  const handleCreateEvent = useCallback(() => {
    setEditingEvent(undefined)
    setIsFormOpen(true)
  }, [])

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false)
    setEditingEvent(undefined)
  }, [])

  const handleUpcomingEventClick = useCallback(
    (event: Event) => {
      setSelectedUpcomingEventId(event.id)
      if (event.gameStartDate || event.startDate) {
        setSelectedDate(getEventGameStartDate(event))
        setShowAllEvents(false)
        setFilterPeriod('selected-date')
      }
    },
    [],
  )

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date)
    setShowAllEvents(false)
    setFilterPeriod('selected-date')
  }, [])

  const exportData = useMemo(
    () =>
      allEventsForDisplay.map((event: Event) => [
        event.name,
        event.image || '',
        event.gameStartDate instanceof Date ? event.gameStartDate.toISOString() : event.gameStartDate,
        event.endDate instanceof Date && event.endDate ? event.endDate.toISOString() : event.endDate ?? '',
        event.city?.name || '',
        event.address || '',
        event.competitionType || '',
        event.maxParticipants ?? '',
        event.registeredParticipants ?? '',
        event.price ?? '',
        (() => {
          const now = new Date()
          if (event.isCompleted) return 'Завершений'
          if (isEventInProgress(event, now)) return 'В процесі'
          return event.isActive ? 'Активний' : 'Неактивний'
        })(),
      ]),
    [allEventsForDisplay, isEventInProgress],
  )

  const handleExportSuccess = useCallback(() => {
    addToast('Події скачені у CSV', 'success')
  }, [addToast])

  const handleExportError = useCallback(
    (message: string) => {
      addToast(message, 'error')
    },
    [addToast],
  )
  const handleOpenImport = useCallback(() => {
    setIsImportOpen(true)
  }, [])
  const handleCloseImport = useCallback(() => {
    setIsImportOpen(false)
  }, [])
  const handleImportSuccess = useCallback(() => {
    window.location.reload()
  }, [])
  const handleFilterAll = useCallback(() => {
    setShowAllEvents(true)
    setFilterPeriod('all')
    setSelectedDate(null)
  }, [])
  const handleFilterByDate = useCallback(() => {
    setShowAllEvents(false)
    setFilterPeriod('selected-date')
  }, [])
  const handleFilterByWeek = useCallback(() => {
    setShowAllEvents(false)
    setFilterPeriod('week')
    setSelectedDate(new Date())
  }, [])
  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirmOpen(false)
  }, [])

  return (
    <div className="space-y-4 lg:space-y-6">
      <Toast messages={toasts} onRemove={removeToast} />

      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-3">
        <TabsNavigation className="flex-1 min-w-0" />
        <div className="flex flex-wrap items-center gap-2 lg:gap-3 xl:justify-end">
          <CSVImportButton onClick={handleOpenImport} disabled={isLoading} variant="secondary" />
          <CSVExportButton
            headers={EXPORT_HEADERS}
            data={exportData}
            fileName="events"
            disabled={isLoading || allEventsForDisplay.length === 0}
            onSuccess={handleExportSuccess}
            onError={handleExportError}
            variant="secondary"
          />
        </div>
      </div>

      <EventsHeader
        onCreateEvent={handleCreateEvent}
        isLoading={isLoading}
      />

      {isLoading && events.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <LoadingSpinner size="lg" thickness="thin" />
          <p className="text-gray-400 text-sm">Завантаження подій...</p>
        </div>
      )}

      {loadError && (
        <div className="p-4 rounded-lg border-2 border-red-500/30 bg-red-500/10">
          <p className="text-red-400 text-sm font-medium">⚠️ {loadError.message}</p>
          <p className="text-red-400/70 text-xs mt-1">Перевірте чи запущен backend сервер на порту 3101</p>
        </div>
      )}

      {!isLoading && !loadError && (
        <>
          <EventsFilters
            showAllEvents={showAllEvents}
            filterPeriod={filterPeriod}
            onFilterAll={handleFilterAll}
            onFilterByDate={handleFilterByDate}
            onFilterByWeek={handleFilterByWeek}
          />

          <EventsGrid
            upcomingEvents={upcomingEvents}
            onEventClick={handleUpcomingEventClick}
            selectedEventId={selectedUpcomingEventId}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            markedDates={markedDates}
            filterType={filterType}
            onFilterTypeChange={setFilterType}
            filterCity={filterCity}
            onFilterCityChange={setFilterCity}
            uniqueTypes={uniqueTypes}
            uniqueCities={uniqueCities}
            resultsCount={allEventsForDisplay.length}
          />

          {selectedDayEvents.length === 0 ? (
            <div className="bg-black/50 backdrop-blur-sm border border-gray-800 rounded-xl p-8 lg:p-12 text-center">
              <div className="text-gray-400 space-y-2">
                <p className="text-base lg:text-lg font-medium">
                  {selectedDate ? 'На цей день немає подій' : 'Немає подій за обраними фільтрами'}
                </p>
                {!selectedDate && (
                  <p className="text-xs lg:text-sm text-gray-500">
                    Перевірте фільтри або створіть нову подію
                  </p>
                )}
                {selectedDate && (
                  <p className="text-xs lg:text-sm">
                    {selectedDate.toLocaleDateString('uk-UA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long',
                    })}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <EventsCards
              events={selectedDayEvents}
              selectedDate={selectedDate}
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
              isLoading={isLoading}
            />
          )}
        </>
      )}

      {!isLoading && !loadError && approvedEvents.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <p className="text-gray-400 text-sm">
            {events.some((event) => event.status !== 'APPROVED')
              ? 'Поки немає схвалених подій для відображення'
              : 'Немає подій для відображення'}
          </p>
          {events.some((event) => event.status !== 'APPROVED') && (
            <p className="text-xs text-gray-500 max-w-md">
              Нові події з’являться тут після схвалення модератором.
            </p>
          )}
          <button onClick={handleCreateEvent} className="px-4 py-2 bg-(--color-primary) text-white font-semibold rounded-lg hover:bg-(--color-primary-hover) transition-colors text-sm">
            Створити першу подію
          </button>
        </div>
      )}

      <EventFormModal isOpen={isFormOpen} onClose={handleCloseForm} onSubmit={handleFormSubmit} initialData={editingFormData} selectedDate={!editingEvent && selectedDate ? selectedDate : undefined} isLoading={isSubmittingEvent}/>

      <DeleteConfirmModal
        isOpen={deleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleDeleteCancel}
        eventName={deleteConfirmEventName}
        isLoading={isDeletingEvent}
      />

      <EventsImportModal
        isOpen={isImportOpen}
        onClose={handleCloseImport}
        onSuccess={handleImportSuccess}
      />

    </div>
  )
}
