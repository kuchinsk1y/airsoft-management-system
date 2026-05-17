'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import LoadingSpinner from '@/app/components/LoadingSpinner'
import * as eventsApi from '@/actions/events'
import ArchiveMonthlyChart from './components/ArchiveMonthlyChart'
import ArchiveCityChart from './components/ArchiveCityChart'
import ArchiveGalleryModal from './components/ArchiveGalleryModal'
import CSVExportButton from '@/app/components/CSVExportButton'
import { translateCompetitionType } from '@/utils/i18n'
import type { Event } from '../../types'

const PAGE_SIZE = 25

const getEventGameStartDate = (event: Event): Date =>
  new Date(event.gameStartDate ?? event.startDate)

export default function ArchiveTab() {
  const router = useRouter()
  const [mobileChart, setMobileChart] = useState<'monthly' | 'cities'>('monthly')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'price'>('date')
  const [currentPage, setCurrentPage] = useState(1)
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false)
  const [selectedGalleryEvent, setSelectedGalleryEvent] = useState<Event | undefined>()

  const handleOpenEventPage = (event: Event) => {
    router.push(`/events/${event.id}?fromArchive=true`)
  }

  const { data: events = [], isLoading, error: loadError } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsApi.fetchEvents(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  })

  const archivedEvents = useMemo(() => {
    return events.filter((event) => event.isCompleted === true)
  }, [events])

  const cities = useMemo(() => {
    const citiesSet = new Set(archivedEvents.map((e) => e.city?.name).filter(Boolean))
    return Array.from(citiesSet).sort()
  }, [archivedEvents])

  const eventTypes = useMemo(() => {
    const typesSet = new Set(archivedEvents.map((e) => e.competitionType).filter(Boolean))
    return Array.from(typesSet).sort()
  }, [archivedEvents])

  const monthlyStats = useMemo(() => {
    const counts = new Map<string, number>()

    archivedEvents.forEach((event) => {
      const date = getEventGameStartDate(event)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      counts.set(key, (counts.get(key) || 0) + 1)
    })

    const sortedKeys = Array.from(counts.keys()).sort()
    const lastKeys = sortedKeys.slice(-12)

    const labels = lastKeys.map((key) => {
      const [year, month] = key.split('-').map(Number)
      const date = new Date(year, month - 1, 1)
      return date.toLocaleDateString('uk-UA', { month: 'short', year: '2-digit' })
    })

    const data = lastKeys.map((key) => counts.get(key) || 0)

    return { labels, data }
  }, [archivedEvents])

  const cityStats = useMemo(() => {
    const counts = new Map<string, number>()

    archivedEvents.forEach((event) => {
      const cityName = event.city?.name || 'Невідомо'
      counts.set(cityName, (counts.get(cityName) || 0) + 1)
    })

    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
    const maxSlices = 6
    const top = sorted.slice(0, maxSlices)
    const rest = sorted.slice(maxSlices)
    const restTotal = rest.reduce((sum, [, value]) => sum + value, 0)

    const labels = top.map(([label]) => label)
    const data = top.map(([, value]) => value)

    if (restTotal > 0) {
      labels.push('Інші')
      data.push(restTotal)
    }

    return { labels, data }
  }, [archivedEvents])


  const filteredAndSortedEvents = useMemo(() => {
    let filtered = archivedEvents.filter((event) => {
      if (searchQuery && !event.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (selectedCity && event.city?.name !== selectedCity) return false
      if (selectedType && event.competitionType !== selectedType) return false

      return true
    })

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name, 'uk-UA')
        case 'price':
          return b.price - a.price
        case 'date':
        default:
          return getEventGameStartDate(b).getTime() - getEventGameStartDate(a).getTime()
      }
    })
  }, [archivedEvents, searchQuery, selectedCity, selectedType, sortBy])

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedEvents.length / PAGE_SIZE))

  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    return filteredAndSortedEvents.slice(startIndex, startIndex + PAGE_SIZE)
  }, [currentPage, filteredAndSortedEvents])

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

  const pageStart = filteredAndSortedEvents.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const pageEnd = Math.min(currentPage * PAGE_SIZE, filteredAndSortedEvents.length)

  const handlePrevPage = () => setCurrentPage((page) => Math.max(1, page - 1))
  const handleNextPage = () => setCurrentPage((page) => Math.min(totalPages, page + 1))

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCity, selectedType, sortBy])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const exportHeaders = [
    'Назва',
    'Початок гри',
    'Дата закінчення',
    'Місто',
    'Тип',
    'Учасників',
    'Ціна',
  ]

  const exportData = useMemo(
    () =>
      filteredAndSortedEvents.map((event) => [
        event.name,
        event.gameStartDate instanceof Date
          ? event.gameStartDate.toISOString()
          : event.gameStartDate,
        event.endDate instanceof Date && event.endDate ? event.endDate.toISOString() : event.endDate ?? '',
        event.city?.name || '',
        event.competitionType || '',
        event.registeredParticipants || 0,
        event.price ?? '',
      ]),
    [filteredAndSortedEvents]
  )

  const formatDate = (date: string | Date) => {
    const d = new Date(date)
    return d.toLocaleDateString('uk-UA', { 
      timeZone: 'Europe/Kyiv',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleOpenGalleryModal = (event: Event) => {
    setSelectedGalleryEvent(event)
    setIsGalleryModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <LoadingSpinner size="lg" thickness="thin" />
        <p className="text-gray-400 text-sm">Завантаження архіву...</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="p-4 rounded-lg border-2 border-red-500/30 bg-red-500/10">
        <p className="text-red-400 text-sm font-medium">⚠️ {String(loadError)}</p>
        <p className="text-red-400/70 text-xs mt-1">Перевірте чи запущен backend сервер на порту 3101</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-white">Архів подій</h2>
        <div className="hidden lg:block">
          <CSVExportButton
            headers={exportHeaders}
            data={exportData}
            fileName="archive-events"
            disabled={isLoading || filteredAndSortedEvents.length === 0}
          />
        </div>
      </div>

      {/* Графіки */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 lg:hidden">
          <div className="inline-flex rounded-lg border border-(--color-primary)/30 bg-black/40 p-1 gap-1">
            <button
              type="button"
              onClick={() => setMobileChart('monthly')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                mobileChart === 'monthly'
                  ? 'bg-(--color-primary) text-white'
                  : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              По місяцях
            </button>
            <button
              type="button"
              onClick={() => setMobileChart('cities')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                mobileChart === 'cities'
                  ? 'bg-(--color-primary) text-white'
                  : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              Міста
            </button>
          </div>

          <div className="shrink-0">
            <CSVExportButton
              headers={exportHeaders}
              data={exportData}
              fileName="archive-events"
              disabled={isLoading || filteredAndSortedEvents.length === 0}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div
            className={`lg:col-span-2 flex flex-col gap-3 rounded-xl p-5 border-2 border-(--color-primary) bg-black/40 backdrop-blur-sm ${
              mobileChart === 'cities' ? 'hidden lg:flex' : 'flex'
            }`}
          >
          <div>
            <h3 className="text-white text-lg font-bold">Події по місяцях</h3>
            <p className="text-gray-400 text-xs">Кількість завершених подій за останні 12 місяців.</p>
          </div>
          <div className="w-full h-56">
            <ArchiveMonthlyChart labels={monthlyStats.labels} data={monthlyStats.data} />
          </div>
          </div>

          <div
            className={`flex flex-col gap-3 rounded-xl p-5 border-2 border-(--color-primary) bg-black/40 backdrop-blur-sm ${
              mobileChart === 'monthly' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <div>
              <h3 className="text-white text-lg font-bold">Популярність міст</h3>
              <p className="text-gray-400 text-xs">Частка архівних подій по містах.</p>
            </div>
            <div className="w-full h-56 flex items-center justify-center">
              <ArchiveCityChart labels={cityStats.labels} data={cityStats.data} />
            </div>
          </div>
        </div>
      </div>

      {/* Фільтри */}
      <div className="rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,107,0,0.08),transparent_45%),rgba(255,255,255,0.02)] p-3 sm:p-4 lg:p-5 space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="xl:col-span-2">
            <label htmlFor="search-input" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">Пошук</label>
            <input
              id="search-input"
              type="text"
              placeholder="За назвою..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none transition-[border-color,box-shadow,background-color] placeholder:text-gray-500 focus:border-(--color-primary)/60 focus:bg-black/55 focus:shadow-[0_0_0_3px_rgba(255,107,0,0.12)]"
            />
          </div>

          <div>
            <label htmlFor="city-select" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">Місто</label>
            <select
              id="city-select"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none transition-[border-color,box-shadow,background-color] focus:border-(--color-primary)/60 focus:bg-black/55 focus:shadow-[0_0_0_3px_rgba(255,107,0,0.12)]"
            >
              <option value="">Всі міста</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="type-select" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">Тип</label>
            <select
              id="type-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none transition-[border-color,box-shadow,background-color] focus:border-(--color-primary)/60 focus:bg-black/55 focus:shadow-[0_0_0_3px_rgba(255,107,0,0.12)]"
            >
              <option value="">Всі типи</option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {translateCompetitionType(type)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sort-select" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">Сортування</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'price')}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none transition-[border-color,box-shadow,background-color] focus:border-(--color-primary)/60 focus:bg-black/55 focus:shadow-[0_0_0_3px_rgba(255,107,0,0.12)]"
            >
              <option value="date">По даті</option>
              <option value="name">По назві</option>
              <option value="price">По ціні</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-xs text-gray-300">
            <span className="text-gray-500">Знайдено</span>
            <span className="rounded-full bg-white/8 px-2 py-0.5 text-sm font-semibold text-white">{filteredAndSortedEvents.length}</span>
            <span>{filteredAndSortedEvents.length === 1 ? 'подія' : 'подій'}</span>
          </div>

          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedCity('')
              setSelectedType('')
            }}
            disabled={!searchQuery && !selectedCity && !selectedType}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/10 bg-black/35 px-4 py-2 text-sm font-semibold text-gray-200 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            Очистити фільтри
          </button>
        </div>
      </div>

      {/* Таблиця / Картки */}
      {filteredAndSortedEvents.length > 0 ? (
        <>
          <div className="space-y-3 md:hidden">
            {paginatedEvents.map((event) => (
              <div 
                key={event.id} 
                className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3 cursor-pointer hover:border-(--color-primary)/50 transition-colors"
                onClick={() => handleOpenEventPage(event)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-white font-semibold text-sm">{event.name}</p>
                    <p className="text-gray-400 text-xs mt-1">{formatDate(event.gameStartDate ?? event.startDate)}</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-(--color-primary)/20 text-(--color-primary) border border-(--color-primary)/30">
                    {translateCompetitionType(event.competitionType)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-500">Місто</p>
                    <p className="text-gray-200 mt-1">{event.city?.name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Учасників</p>
                    <p className="text-gray-200 mt-1">{event.registeredParticipants || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Ціна</p>
                    <p className="text-white mt-1 font-semibold">{event.price} грн</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 space-y-2" onClick={(e) => e.stopPropagation()}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Дії</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleOpenGalleryModal(event)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 text-gray-100 border border-white/20 hover:bg-white/15 transition-colors"
                    >
                      Галерея
                    </button>
                    <button
                      onClick={() => handleOpenEventPage(event)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-(--color-primary)/15 text-(--color-primary) border border-(--color-primary)/30 hover:bg-(--color-primary)/25 transition-colors"
                    >
                      Відкрити
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block rounded-lg border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Назва</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Дата</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Місто</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Тип</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Учасників</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Ціна</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Дії</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedEvents.map((event) => (
                    <tr 
                      key={event.id} 
                      className="hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => handleOpenEventPage(event)}
                    >
                      <td className="px-4 py-3.5 text-sm text-white font-semibold">{event.name}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-300">{formatDate(event.gameStartDate ?? event.startDate)}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-300">{event.city?.name}</td>
                      <td className="px-4 py-3.5 text-sm"><span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-(--color-primary)/20 text-(--color-primary) border border-(--color-primary)/30">{translateCompetitionType(event.competitionType)}</span></td>
                      <td className="px-4 py-3.5 text-sm text-gray-300"><span className="bg-white/10 px-2.5 py-1 rounded text-xs font-semibold">{event.registeredParticipants || 0}</span></td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-white">{event.price} грн</td>
                      <td className="px-4 py-3.5 text-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenGalleryModal(event)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 text-gray-100 border border-white/20 hover:bg-white/15 transition-colors"
                          >
                            Галерея
                          </button>
                          <button
                            onClick={() => handleOpenEventPage(event)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-(--color-primary)/15 text-(--color-primary) border border-(--color-primary)/30 hover:bg-(--color-primary)/25 transition-colors"
                          >
                            Відкрити
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredAndSortedEvents.length > PAGE_SIZE && (
            <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <div className="text-xs text-gray-400 sm:text-sm">
                Показано <span className="font-semibold text-white">{pageStart}-{pageEnd}</span> з <span className="font-semibold text-white">{filteredAndSortedEvents.length}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-black/35 px-3 text-sm font-medium text-gray-200 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                >
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
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-black/35 px-3 text-sm font-medium text-gray-200 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Далі
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-gray-500">📋</div>
          <div>
            <p className="text-gray-400 text-sm font-semibold">Немає завершених подій</p>
            <p className="text-gray-500 text-xs mt-1">Події з'являться тут після їх завершення</p>
          </div>
        </div>
      )}
      <ArchiveGalleryModal
        isOpen={isGalleryModalOpen}
        onClose={() => setIsGalleryModalOpen(false)}
        event={selectedGalleryEvent}
      />
    </div>
  )
}

