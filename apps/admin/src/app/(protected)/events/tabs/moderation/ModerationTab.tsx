'use client'

import * as eventsApi from '@/actions/events'
import LoadingSpinner from '@/app/components/LoadingSpinner'
import Toast, { ToastMessage } from '@/app/components/Toast'
import { formatDateDisplay, formatTime } from '@/app/utils/events'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import {
  MdAccessTime,
  MdArrowOutward,
  MdCalendarToday,
  MdChevronLeft,
  MdChevronRight,
  MdLocationOn,
  MdPerson,
  MdSearch,
} from 'react-icons/md'
import { Event, EventStatus } from '../../types'
import ModerationEventPanel from './ModerationEventPanel'
import RejectReasonModal from './RejectReasonModal'

type ModerationFilter = 'ALL' | EventStatus

const PAGE_SIZE = 15

const FILTER_OPTIONS: Array<{ value: ModerationFilter; label: string }> = [
  { value: 'PENDING', label: 'На модерації' },
  { value: 'APPROVED', label: 'Схвалені' },
  { value: 'REJECTED', label: 'Відхилені' },
  { value: 'ALL', label: 'Усі' },
]

const STATUS_META: Record<EventStatus, { label: string; badgeClassName: string }> = {
  PENDING: {
    label: 'На модерації',
    badgeClassName: 'border border-amber-500/30 bg-amber-500/10 text-amber-200',
  },
  APPROVED: {
    label: 'Схвалено',
    badgeClassName: 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  },
  REJECTED: {
    label: 'Відхилено',
    badgeClassName: 'border border-red-500/30 bg-red-500/10 text-red-200',
  },
}

const STATUS_ORDER: Record<EventStatus, number> = {
  PENDING: 0,
  REJECTED: 1,
  APPROVED: 2,
}

const stripHtml = (value?: string) => value?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() ?? ''

const getSearchBlob = (event: Event) => {
  const ownerName = event.application.owner.fullName || event.application.owner.nickName

  return [
    event.name,
    event.application.name,
    ownerName,
    event.city.name,
    event.address,
    stripHtml(event.description),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

const getStatusCounts = (events: Event[]) => {
  return events.reduce(
    (acc, event) => {
      acc.ALL += 1
      acc[event.status] += 1
      return acc
    },
    {
      ALL: 0,
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
    } as Record<ModerationFilter, number>,
  )
}

export default function ModerationTab() {
  const queryClient = useQueryClient()

  const [selectedFilter, setSelectedFilter] = useState<ModerationFilter>('PENDING')
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [actionEventId, setActionEventId] = useState<number | null>(null)
  const [rejectEvent, setRejectEvent] = useState<Event | null>(null)

  const deferredSearchQuery = useDeferredValue(searchQuery.trim().toLowerCase())

  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ['events', 'moderation'],
    queryFn: () => eventsApi.fetchModerationEvents(),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  const sortedEvents = useMemo(
    () =>
      [...events].sort((left, right) => {
        const statusDelta = STATUS_ORDER[left.status] - STATUS_ORDER[right.status]
        if (statusDelta !== 0) return statusDelta
        return right.createdAt.getTime() - left.createdAt.getTime()
      }),
    [events],
  )

  const counts = useMemo(() => getStatusCounts(sortedEvents), [sortedEvents])

  const filteredEvents = useMemo(() => {
    return sortedEvents.filter((event) => {
      if (selectedFilter !== 'ALL' && event.status !== selectedFilter) {
        return false
      }

      if (deferredSearchQuery.length > 0 && !getSearchBlob(event).includes(deferredSearchQuery)) {
        return false
      }

      return true
    })
  }, [deferredSearchQuery, selectedFilter, sortedEvents])

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE))

  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    return filteredEvents.slice(startIndex, startIndex + PAGE_SIZE)
  }, [currentPage, filteredEvents])

  const paginationRange = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1)
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, totalPages]
    }

    if (currentPage >= totalPages - 2) {
      return [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }

    return [1, currentPage - 1, currentPage, currentPage + 1, totalPages]
  }, [currentPage, totalPages])

  const pageStart = filteredEvents.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const pageEnd = Math.min(currentPage * PAGE_SIZE, filteredEvents.length)

  useEffect(() => {
    setCurrentPage(1)
  }, [deferredSearchQuery, selectedFilter])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  useEffect(() => {
    if (selectedEventId === null) return

    const hasSelectedEvent = filteredEvents.some((event) => event.id === selectedEventId)
    if (!hasSelectedEvent) {
      setSelectedEventId(null)
    }
  }, [filteredEvents, selectedEventId])

  const selectedEvent = useMemo(
    () => sortedEvents.find((event) => event.id === selectedEventId) ?? null,
    [selectedEventId, sortedEvents],
  )

  const refreshModerationData = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['events', 'moderation'] }),
      queryClient.invalidateQueries({ queryKey: ['events'] }),
      queryClient.invalidateQueries({ queryKey: ['events', 'moderation', 'pending-count'] }),
    ])
  }, [queryClient])

  const handleApprove = useCallback(
    async (event: Event) => {
      try {
        setActionEventId(event.id)
        await eventsApi.updateEventStatus(event.id, { status: 'APPROVED' })
        await refreshModerationData()
        addToast('Подію схвалено', 'success')
      } catch (actionError) {
        console.error('Failed to approve event:', actionError)
        addToast(actionError instanceof Error ? actionError.message : 'Не вдалося схвалити подію', 'error')
      } finally {
        setActionEventId(null)
      }
    },
    [addToast, refreshModerationData],
  )

  const handleReject = useCallback(
    async (reason: string) => {
      if (!rejectEvent) return

      try {
        setActionEventId(rejectEvent.id)
        await eventsApi.updateEventStatus(rejectEvent.id, {
          status: 'REJECTED',
          reason,
        })
        await refreshModerationData()
        addToast('Подію відхилено', 'success')
        setRejectEvent(null)
      } catch (actionError) {
        console.error('Failed to reject event:', actionError)
        addToast(actionError instanceof Error ? actionError.message : 'Не вдалося відхилити подію', 'error')
      } finally {
        setActionEventId(null)
      }
    },
    [addToast, refreshModerationData, rejectEvent],
  )

  if (isLoading) {
    return (
      <div className="flex min-h-[45vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size="lg" thickness="thin" />
          <p className="text-sm text-gray-400">Завантаження черги модерації...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
        <p className="text-sm font-medium text-red-300">Не вдалося завантажити модерацію</p>
        <p className="mt-1 text-xs text-red-200/70">{error instanceof Error ? error.message : 'Спробуйте оновити сторінку.'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <Toast messages={toasts} onRemove={removeToast} />

      <div>
        <h1 className="text-xl sm:text-2xl lg:text-4xl font-black text-white leading-tight">Модерація подій</h1>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-black/50 px-6 py-12 text-center backdrop-blur-sm">
          <p className="text-lg font-semibold text-white">Черга модерації порожня</p>
          <p className="mt-2 text-sm text-gray-400">Коли організатори створять нові події, вони з’являться тут.</p>
        </div>
      ) : (
        <section className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,107,0,0.08),transparent_42%),rgba(255,255,255,0.02)] p-3 sm:p-4 lg:p-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-white sm:text-base">Відбір подій за статусом і пошуком</h2>
                </div>

                <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-gray-300">
                  <span className="text-gray-500">Знайдено</span>
                  <span className="rounded-full bg-white/8 px-2 py-0.5 text-sm font-semibold text-white">
                    {filteredEvents.length}
                  </span>
                </div>
              </div>

              <label className="group relative block">
                <MdSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-(--color-primary)" size={17} />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Пошук за назвою, організатором або містом"
                  className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-10 pr-4 text-sm text-white outline-none transition-[border-color,box-shadow,background-color] placeholder:text-gray-500 focus:border-(--color-primary)/60 focus:bg-black/55 focus:shadow-[0_0_0_3px_rgba(255,107,0,0.12)]"
                />
              </label>

              <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
                {FILTER_OPTIONS.map((option) => {
                  const isActive = option.value === selectedFilter
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedFilter(option.value)}
                      className={`inline-flex min-h-12 items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                        isActive
                          ? 'border-(--color-primary)/45 bg-(--color-primary)/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_30px_rgba(255,107,0,0.08)]'
                          : 'border-white/10 bg-black/35 text-gray-300 hover:border-white/20 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className="leading-5">{option.label}</span>
                      <span className={`inline-flex min-w-8 items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-bold ${isActive ? 'bg-(--color-primary) text-black' : 'bg-white/8 text-gray-300'}`}>
                        {counts[option.value]}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="rounded-xl border border-gray-800 bg-black/50 px-5 py-10 text-center">
              <p className="text-sm font-medium text-white">Нічого не знайдено</p>
              <p className="mt-2 text-xs text-gray-500">Спробуйте змінити статус або пошуковий запит.</p>
            </div>
          ) : (
            <>
              <div className="moderation-table-enter mb-1 hidden overflow-hidden rounded-xl border border-white/10 md:block">
                <table className="w-full table-fixed text-sm">
                  <colgroup>
                    <col className="w-20" />
                    <col />
                    <col className="w-56" />
                    <col className="w-52" />
                    <col className="w-36" />
                    <col className="w-28" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Фото</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Подія</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Організатор</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Локація / Час</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Статус</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Дії</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedEvents.map((event, index) => {
                      const ownerName = event.application.owner.fullName || event.application.owner.nickName
                      const statusMeta = STATUS_META[event.status]
                      const isSelected = selectedEventId === event.id

                      return (
                        <tr
                          key={event.id}
                          onClick={() => setSelectedEventId(event.id)}
                          onKeyDown={(keyboardEvent) => {
                            if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
                              keyboardEvent.preventDefault()
                              setSelectedEventId(event.id)
                            }
                          }}
                          tabIndex={0}
                          role="button"
                          className={`moderation-row-reveal cursor-pointer border-b border-white/6 transition-colors last:border-b-0 ${
                            isSelected ? 'bg-(--color-primary)/10' : 'hover:bg-white/[0.035]'
                          }`}
                          style={{ animationDelay: `${Math.min(index * 28, 280)}ms` }}
                        >
                          <td className="px-3 py-2.5 align-middle">
                            <div className="relative h-13 w-13 overflow-hidden rounded-lg border border-gray-700 bg-black/40">
                              {event.image ? (
                                <Image
                                  src={event.image}
                                  alt={event.name}
                                  fill
                                  sizes="52px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-[10px] text-gray-600">N/A</div>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-2.5 align-middle">
                            <p className="truncate font-semibold leading-snug text-white" title={event.name}>{event.name}</p>
                            <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{stripHtml(event.description) || 'Без опису'}</p>
                          </td>

                          <td className="px-4 py-2.5 align-middle">
                            <p className="truncate text-sm font-medium text-gray-200">{ownerName}</p>
                            <p className="mt-0.5 truncate text-xs text-gray-500">{event.application.name}</p>
                          </td>

                          <td className="px-4 py-2.5 align-middle">
                            <p className="inline-flex items-center gap-1.5 text-xs text-gray-300">
                              <MdLocationOn className="text-(--color-primary)" size={13} />
                              {event.city.name}
                            </p>
                            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-gray-500">
                              <MdCalendarToday size={13} />
                              {formatDateDisplay(event.gameStartDate ?? event.startDate)}
                              <span>•</span>
                              <MdAccessTime size={13} />
                              {formatTime(event.gameStartDate ?? event.startDate)}
                            </p>
                          </td>

                          <td className="px-4 py-2.5 align-middle">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${statusMeta.badgeClassName}`}>
                              {statusMeta.label}
                            </span>
                            {event.status === 'REJECTED' && event.statusReason && (
                              <p className="mt-1 line-clamp-1 text-xs text-red-200/85">{event.statusReason}</p>
                            )}
                          </td>

                          <td className="px-4 py-2.5 align-middle">
                            <div className="flex justify-end">
                              <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 bg-black/30 px-2.5 py-1.5 text-xs font-semibold text-gray-200">
                                <MdArrowOutward size={14} />
                                Переглянути
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="moderation-table-enter space-y-2.5 rounded-xl border border-white/10 bg-black/30 p-3 md:hidden">
                {paginatedEvents.map((event, index) => {
                  const ownerName = event.application.owner.fullName || event.application.owner.nickName
                  const statusMeta = STATUS_META[event.status]
                  const isSelected = selectedEventId === event.id

                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => setSelectedEventId(event.id)}
                      className={`moderation-card-reveal flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                        isSelected
                          ? 'border-(--color-primary)/40 bg-(--color-primary)/10'
                          : 'border-gray-800 bg-black/30 hover:bg-white/4'
                      }`}
                      style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-700 bg-black/40">
                        {event.image ? (
                          <Image
                            src={event.image}
                            alt={event.name}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] text-gray-600">N/A</div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-1 text-sm font-semibold text-white">{event.name}</p>
                          <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${statusMeta.badgeClassName}`}>
                            {statusMeta.label}
                          </span>
                        </div>

                        <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{ownerName}</p>
                        <p className="mt-1 line-clamp-1 text-xs text-gray-400">
                          {event.city.name} • {formatDateDisplay(event.gameStartDate ?? event.startDate)} • {formatTime(event.gameStartDate ?? event.startDate)}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>

              {filteredEvents.length > PAGE_SIZE && (
                <div className="moderation-table-enter flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                  <div className="text-xs text-gray-400 sm:text-sm">
                    Показано <span className="font-semibold text-white">{pageStart}-{pageEnd}</span> з <span className="font-semibold text-white">{filteredEvents.length}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                      className="inline-flex h-10 items-center gap-1 rounded-xl border border-white/10 bg-black/35 px-3 text-sm font-medium text-gray-200 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <MdChevronLeft size={18} />
                      Назад
                    </button>

                    <div className="flex items-center gap-2">
                      {paginationRange.map((page, index) => {
                        const previousPage = paginationRange[index - 1]
                        const shouldShowGap = previousPage !== undefined && page - previousPage > 1
                        const isActive = currentPage === page

                        return (
                          <div key={page} className="flex items-center gap-2">
                            {shouldShowGap && <span className="px-1 text-sm text-gray-500">...</span>}
                            <button
                              type="button"
                              onClick={() => setCurrentPage(page)}
                              className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition-colors ${
                                isActive
                                  ? 'border-(--color-primary)/45 bg-(--color-primary)/14 text-white'
                                  : 'border-white/10 bg-black/35 text-gray-300 hover:border-white/20 hover:text-white'
                              }`}
                            >
                              {page}
                            </button>
                          </div>
                        )
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      disabled={currentPage === totalPages}
                      className="inline-flex h-10 items-center gap-1 rounded-xl border border-white/10 bg-black/35 px-3 text-sm font-medium text-gray-200 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Далі
                      <MdChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      <ModerationEventPanel
        event={selectedEvent}
        open={selectedEvent !== null}
        isLoading={selectedEvent !== null && actionEventId === selectedEvent.id}
        onClose={() => setSelectedEventId(null)}
        onApprove={(event) => void handleApprove(event)}
        onReject={(event) => setRejectEvent(event)}
      />

      <RejectReasonModal
        isOpen={rejectEvent !== null}
        eventName={rejectEvent?.name}
        isLoading={rejectEvent !== null && actionEventId === rejectEvent.id}
        onCancel={() => setRejectEvent(null)}
        onConfirm={(reason) => void handleReject(reason)}
      />

      <style jsx>{`
        .moderation-table-enter {
          animation: moderationTableEnter 260ms ease-out both;
        }

        .moderation-row-reveal,
        .moderation-card-reveal {
          animation: moderationRowReveal 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes moderationTableEnter {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes moderationRowReveal {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .moderation-table-enter,
          .moderation-row-reveal,
          .moderation-card-reveal {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}