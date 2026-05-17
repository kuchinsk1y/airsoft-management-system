'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { MdCheckCircle } from 'react-icons/md';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import Toast, { ToastMessage } from '@/app/components/Toast';
import * as eventsApi from '@/actions/events';
import * as ratingsApi from '@/actions/ratings';
import DeleteConfirmModal from '../../components/DeleteConfirmModal';
import CompleteWithRatingsModal from '../../components/CompleteWithRatingsModal';
import { Event } from '../../types';
import { formatTime } from '@/app/utils/events';
import { getEnglishCompetitionType, translateCompetitionType } from '@/utils/i18n';

export default function PendingRatingsTab() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmEventId, setDeleteConfirmEventId] = useState<number | null>(null);
  const [deleteConfirmEventName, setDeleteConfirmEventName] = useState('');
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);
  const [selectedEventForComplete, setSelectedEventForComplete] = useState<Event | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [filterType, setFilterType] = useState<string>('Всі');
  const [filterCity, setFilterCity] = useState<string>('Всі');

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const { data: events = [], isLoading, error: loadError } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsApi.fetchEvents(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const approvedEvents = useMemo(
    () => events.filter((event) => event.status === 'APPROVED'),
    [events],
  );

  // Фильтруем события: только незавершенные, у которых прошла дата окончания.
  const pendingEvents = useMemo(() => {
    const now = new Date();

    return approvedEvents.filter((event) => {
      const isCompleted = event.isCompleted === true;
      const hasEndDatePassed = event.endDate ? new Date(event.endDate) < now : false;
      
      if (isCompleted || !hasEndDatePassed) return false;
      if (event.registeredParticipants === 0) return false;

      // Фильтры
      if (filterType !== 'Всі') {
        const englishFilterType = getEnglishCompetitionType(filterType);
        if (event.competitionType !== filterType && event.competitionType !== englishFilterType) return false;
      }
      if (filterCity !== 'Всі' && event.city.name !== filterCity) return false;

      return true;
    });
  }, [approvedEvents, filterType, filterCity]);

  const uniqueCities = useMemo(() => {
    const cities = approvedEvents
      .map((e) => (e?.city?.name ? e.city.name : typeof e?.city === 'string' ? e.city : undefined))
      .filter((c): c is string => Boolean(c));
    return ['Всі', ...Array.from(new Set(cities))];
  }, [approvedEvents]);

  const uniqueTypes = useMemo(() => {
    const types = approvedEvents
      .map((e) => e.competitionType)
      .filter(Boolean);
    return ['Всі', ...Array.from(new Set(types))];
  }, [approvedEvents])

  const handleDeleteEvent = useCallback((eventId: number) => {
    const eventToDelete = events.find((e) => e.id === eventId);
    setDeleteConfirmEventId(eventId);
    setDeleteConfirmEventName(eventToDelete?.name || '');
    setDeleteConfirmOpen(true);
  }, [events]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirmEventId || isDeleting) return;

    try {
      setIsDeleting(true);
      await eventsApi.deleteEvent(deleteConfirmEventId);
      await queryClient.invalidateQueries({ queryKey: ['events'] });
      addToast('Подія видалена', 'success');
    } catch (err) {
      console.error('Failed to delete event:', err);
      addToast(err instanceof Error ? err.message : 'Помилка при видаленні', 'error');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setDeleteConfirmEventId(null);
      setDeleteConfirmEventName('');
    }
  }, [deleteConfirmEventId, isDeleting, addToast, queryClient]);

  const handleCompleteEvent = useCallback((event: Event) => {
    setSelectedEventForComplete(event);
    setCompleteConfirmOpen(true);
  }, []);

  const handleConfirmComplete = useCallback(async (payload: ratingsApi.CompleteEventWithRatingsPayload) => {
    if (!selectedEventForComplete) return;
    setIsCompleting(true);
    try {
      await ratingsApi.completeEventWithRatings(selectedEventForComplete.id, payload);
      await queryClient.invalidateQueries({ queryKey: ['events'] });
      await queryClient.refetchQueries({ queryKey: ['events'] });
      router.refresh();
      addToast('Подія успішно завершена', 'success');
      setCompleteConfirmOpen(false);
    } catch (err) {
      console.error('Failed to complete event:', err);
      addToast(err instanceof Error ? err.message : 'Помилка при завершенні події', 'error');
    } finally {
      setIsCompleting(false);
      setSelectedEventForComplete(null);
    }
  }, [selectedEventForComplete, addToast, queryClient, router]);

  const handleEventClick = useCallback((event: Event) => {
    router.push(`/events/${event.id}?fromPendingRatings=true`);
  }, [router]);

  return (
    <div className="space-y-6">
      <Toast messages={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Очікують введення результатів</h2>
        </div>
        <div className="text-sm text-gray-400">
          Знайдено: <span className="text-white font-semibold">{pendingEvents.length}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <label className="block text-xs text-gray-400 mb-1">Тип події</label>
          <select
            title="Тип події"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-(--color-primary)"
          >
            {uniqueTypes.map((type) => (
              <option key={type} value={type}>
                {type === 'Всі' ? type : translateCompetitionType(type)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-400 mb-1">Місто</label>
          <select
            title="Місто"
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-(--color-primary)"
          >
            {uniqueCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <LoadingSpinner size="lg" thickness="thin" />
          <p className="text-gray-400 text-sm">Завантаження подій...</p>
        </div>
      )}

      {/* Error */}
      {loadError && (
        <div className="p-4 rounded-lg border-2 border-red-500/30 bg-red-500/10">
          <p className="text-red-400 text-sm font-medium">⚠️ {loadError.message}</p>
        </div>
      )}

      {/* Events List */}
      {!isLoading && !loadError && (
        <>
          {pendingEvents.length === 0 ? (
            <div className="bg-black/50 backdrop-blur-sm border border-gray-800 rounded-xl p-12 text-center">
              <div className="text-gray-400 space-y-2">
                <p className="text-lg font-medium">Немає подій, що очікують введення результатів</p>
                <p className="text-sm">Всі завершені події вже мають результати</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pendingEvents.map((event) => {
                const canComplete = !event.isCompleted && event.endDate && new Date(event.endDate) < new Date();

                return (
                  <div
                    key={event.id}
                    className="bg-black/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden hover:border-yellow-500/50 transition-all duration-200 cursor-pointer"
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="text-lg font-semibold text-white flex-1">{event.name}</h3>
                        {canComplete ? (
                          <span className="px-2 py-1 rounded text-xs bg-blue-900/50 text-blue-300 font-semibold">
                            Завершити
                          </span>
                        ) : null}
                      </div>

                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="px-2 py-1 rounded-md bg-(--color-primary)/10 text-(--color-primary) font-medium text-xs">
                        {translateCompetitionType(event.competitionType)}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {formatTime(new Date(event.gameStartDate ?? event.startDate))}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm">
                      <p className="text-gray-300">{event.address}</p>
                      <p className="text-xs text-gray-500">{event.city.name}</p>
                    </div>

                    <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-700">
                      <span className="text-gray-400">
                        <span className="text-white font-semibold">{event.registeredParticipants}</span>/{event.maxParticipants} учасників
                      </span>
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-gray-800" onClick={(e) => e.stopPropagation()}>
                      {canComplete ? (
                        <button
                          onClick={() => handleCompleteEvent(event)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-900/20 hover:bg-green-900/30 text-green-400 rounded-lg transition-colors text-sm font-semibold border border-green-800/50"
                        >
                          <MdCheckCircle size={16} />
                          Завершити подію
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </>
      )}

      <DeleteConfirmModal
        isOpen={deleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
        eventName={deleteConfirmEventName}
        isLoading={isDeleting}
      />

      <CompleteWithRatingsModal
        isOpen={completeConfirmOpen}
        onConfirm={handleConfirmComplete}
        onCancel={() => {
          setCompleteConfirmOpen(false);
          setSelectedEventForComplete(null);
        }}
        event={selectedEventForComplete}
        isLoading={isCompleting}
      />
    </div>
  );
}
