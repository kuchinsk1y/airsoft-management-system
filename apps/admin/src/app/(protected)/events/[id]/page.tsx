'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import {
  MdArrowBack,
  MdLocationOn,
  MdPerson,
  MdEmojiEvents,
  MdCheckCircle,
  MdCalendarToday,
  MdAccessTime,
  MdPhotoLibrary,
  MdUpload,
  MdDelete,
} from 'react-icons/md';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import Toast, { ToastMessage } from '@/app/components/Toast';
import * as eventsApi from '@/actions/events';
import * as ratingsApi from '@/actions/ratings';
import CompleteWithRatingsModal from '../components/CompleteWithRatingsModal';
import { formatTime, formatDateDisplay } from '@/app/utils/events';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const eventId = Number(params.id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Проверяем, откуда пришел пользователь
  const fromArchive = searchParams.get('fromArchive') === 'true';
  const fromPendingRatings = searchParams.get('fromPendingRatings') === 'true';

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [completeWithRatingsOpen, setCompleteWithRatingsOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isConfirmingAll, setIsConfirmingAll] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const addToast = useCallback(
    (
      message: string,
      type: 'success' | 'error' | 'info' | 'warning' = 'info',
    ) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, type }]);
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const {
    data: event,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsApi.fetchEventById(eventId),
    enabled: !!eventId && !isNaN(eventId),
    staleTime: 60 * 1000,
  });

  // Загружаем результаты для проверки статуса
  const { data: results = [] } = useQuery({
    queryKey: ['event-results', eventId],
    queryFn: () => ratingsApi.getEventResults(eventId),
    enabled: !!eventId && !isNaN(eventId) && !!event,
    staleTime: 30 * 1000,
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ['event-registrations', eventId, 'APPROVED'],
    queryFn: () =>
      eventsApi.getEventRegistrations(eventId, 'APPROVED').catch(() => []),
    enabled: !!eventId && !isNaN(eventId) && !!event,
    staleTime: 30 * 1000,
  });

  // Загружаем галерею события
  const {
    data: gallery = [],
    isLoading: isLoadingGallery,
    refetch: refetchGallery,
  } = useQuery({
    queryKey: ['event-gallery', eventId],
    queryFn: () => eventsApi.getEventGallery(eventId),
    enabled: !!eventId && !isNaN(eventId) && !!event,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const sortedGallery = useMemo(() => {
    return [...gallery].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }, [gallery]);

  // Проверяем, все ли участники имеют результаты (для активации кнопки подтверждения)
  const allParticipantsHaveResults = useMemo(() => {
    if (!event || registrations.length === 0) return false;

    const competitionType = String(event.competitionType ?? '');
    const isTeamEvent =
      competitionType === 'Командне' || competitionType === 'TEAM';

    if (isTeamEvent) {
      const uniqueTeams = new Set(
        registrations
          .map((r) => r.teamId)
          .filter((id): id is number => id !== null),
      );
      const uniqueTeamResults = new Set(
        results
          .map((r) => r.teamId)
          .filter((id): id is number => id !== null && id !== undefined),
      );
      return (
        uniqueTeams.size > 0 && uniqueTeamResults.size === uniqueTeams.size
      );
    } else {
      const uniqueUsers = new Set(
        registrations
          .map((r) => r.userId)
          .filter((id): id is number => id !== null),
      );
      const uniqueUserResults = new Set(
        results
          .map((r) => r.userId)
          .filter((id): id is number => id !== null && id !== undefined),
      );
      return (
        uniqueUsers.size > 0 && uniqueUserResults.size === uniqueUsers.size
      );
    }
  }, [event, results, registrations]);

  // Проверяем, есть ли неподтвержденные результаты
  const hasUnconfirmedResults = useMemo(() => {
    return results.some((r) => r.status !== 'CONFIRMED');
  }, [results]);

  const canComplete = useMemo(() => {
    if (!event) return false;
    if (event.isCompleted) return false;
    if (!event.endDate) return false;
    const endDate = new Date(event.endDate);
    const now = new Date();
    return endDate < now;
  }, [event]);

  const handleCompleteEvent = useCallback(() => {
    setCompleteWithRatingsOpen(true);
  }, []);

  const handleConfirmComplete = useCallback(
    async (payload: ratingsApi.CompleteEventWithRatingsPayload) => {
    if (!event) return;

    setIsCompleting(true);
    try {
      await ratingsApi.completeEventWithRatings(event.id, payload);
      await queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      await queryClient.invalidateQueries({ queryKey: ['events'] });
      await queryClient.invalidateQueries({ queryKey: ['event-results', eventId] });
      await queryClient.invalidateQueries({
        queryKey: ['event-registrations', eventId, 'APPROVED'],
      });
      router.refresh();
      addToast('Подія успішно завершена', 'success');
      setCompleteWithRatingsOpen(false);
    } catch (err) {
      console.error('Failed to complete event:', err);
      addToast(
        err instanceof Error ? err.message : 'Помилка при завершенні події',
        'error',
      );
    } finally {
      setIsCompleting(false);
    }
    },
    [event, eventId, addToast, queryClient, router],
  );

  const handleFilesChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      setSelectedFiles(files);
    },
    [],
  );

  const handleUploadGallery = useCallback(async () => {
    if (!event || selectedFiles.length === 0) return;
    setIsUploading(true);
    try {
      await eventsApi.uploadEventGallery(event.id, selectedFiles);
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await refetchGallery();
      addToast('Фото успішно завантажено', 'success');
    } catch (err) {
      console.error('Failed to upload gallery:', err);
      addToast(
        err instanceof Error ? err.message : 'Помилка при завантаженні фото',
        'error',
      );
    } finally {
      setIsUploading(false);
    }
  }, [event, selectedFiles, refetchGallery, addToast]);

  const handleDeletePhoto = useCallback(
    async (photoId: number) => {
      if (!event) return;
      setIsDeleting(photoId);
      try {
        await eventsApi.deleteEventGalleryPhoto(event.id, photoId);
        await refetchGallery();
        addToast('Фото видалено', 'success');
      } catch (err) {
        console.error('Failed to delete photo:', err);
        addToast(
          err instanceof Error ? err.message : 'Помилка при видаленні фото',
          'error',
        );
      } finally {
        setIsDeleting(null);
      }
    },
    [event, refetchGallery, addToast],
  );

  const handleConfirmAllResults = useCallback(async () => {
    if (!event || !allParticipantsHaveResults) return;

    setIsConfirmingAll(true);
    try {
      // Подтверждаем все неподтвержденные результаты
      const unconfirmedResults = results.filter(
        (r) => r.status !== 'CONFIRMED',
      );
      await Promise.all(
        unconfirmedResults.map((result) =>
          ratingsApi.confirmEventResult(event.id, result.id),
        ),
      );

      await queryClient.invalidateQueries({
        queryKey: ['event-results', eventId],
      });
      addToast('Всі результати успішно підтверджено', 'success');
    } catch (err) {
      console.error('Failed to confirm all results:', err);
      addToast(
        err instanceof Error
          ? err.message
          : 'Помилка при підтвердженні результатів',
        'error',
      );
    } finally {
      setIsConfirmingAll(false);
    }
  }, [
    event,
    results,
    allParticipantsHaveResults,
    eventId,
    addToast,
    queryClient,
  ]);

  // Группируем результаты для отображения
  const groupedResults = useMemo(() => {
    if (!event || results.length === 0) return null;

    const competitionType = String(event.competitionType ?? '');
    const isTeamEvent =
      competitionType === 'Командне' || competitionType === 'TEAM';

    if (isTeamEvent) {
      // Группируем по командам
      const groupedByTeam = new Map<number, ratingsApi.EventResultResponse[]>();
      const ungrouped: ratingsApi.EventResultResponse[] = [];

      results.forEach((result) => {
        if (result.teamId && result.team) {
          if (!groupedByTeam.has(result.teamId)) {
            groupedByTeam.set(result.teamId, []);
          }
          groupedByTeam.get(result.teamId)!.push(result);
        } else {
          ungrouped.push(result);
        }
      });

      return {
        type: 'teams' as const,
        teams: Array.from(groupedByTeam.entries()),
        ungrouped,
      };
    } else {
      // Группируем по сторонам (если есть)
      const sides = event.sides || [];
      if (sides.length > 0) {
        const sideIdByName = new Map(
          sides.map((side) => [side.name.trim().toLowerCase(), side.id]),
        );
        const groupedBySide = new Map<
          number,
          ratingsApi.EventResultResponse[]
        >();
        const ungrouped: ratingsApi.EventResultResponse[] = [];

        results.forEach((result) => {
          const registration = result.userId
            ? registrations.find((r) => r.userId === result.userId)
            : undefined;
          const resolvedSideId =
            result.sideId ??
            result.side?.id ??
            registration?.eventSideId ??
            (result.side?.name
              ? sideIdByName.get(result.side.name.trim().toLowerCase())
              : undefined);

          if (resolvedSideId) {
            if (!groupedBySide.has(resolvedSideId)) {
              groupedBySide.set(resolvedSideId, []);
            }
            groupedBySide.get(resolvedSideId)!.push(result);
          } else {
            ungrouped.push(result);
          }
        });

        return {
          type: 'sides' as const,
          sides: Array.from(groupedBySide.entries()),
          ungrouped,
          sidesList: sides,
        };
      } else {
        // Простой список
        return { type: 'list' as const, results };
      }
    }
  }, [event, results, registrations]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <LoadingSpinner size="lg" thickness="thin" />
        <p className="text-gray-400 text-sm">Завантаження події...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="p-4 rounded-lg border-2 border-red-500/30 bg-red-500/10">
        <p className="text-red-400 text-sm font-medium">
          {error instanceof Error
            ? error.message
            : 'Помилка завантаження події'}
        </p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
        >
          Назад
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toast messages={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg bg-gray-900/50 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          aria-label="Назад"
        >
          <MdArrowBack size={24} />
        </button>
        <h1 className="text-2xl font-bold text-white">{event.name}</h1>
      </div>

      {/* Event Image */}
      {event.image && (
        <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden bg-gray-900">
          <Image
            src={event.image}
            alt={event.name}
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
      )}

      {/* Event Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-black/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-white">
              Інформація про подію
            </h2>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <MdCalendarToday
                  className="text-(--color-primary) shrink-0"
                  size={20}
                />
                <div>
                  <p className="text-gray-400">Початок гри</p>
                  <p className="text-white font-medium">
                    {new Date(
                      event.gameStartDate ?? event.startDate,
                    ).toLocaleDateString('uk-UA', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      timeZone: 'Europe/Kyiv',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <MdAccessTime
                  className="text-(--color-primary) shrink-0"
                  size={20}
                />
                <div>
                  <p className="text-gray-400">Кінець реєстрації</p>
                  <p className="text-white font-medium">
                    {new Date(event.startDate).toLocaleDateString('uk-UA', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      timeZone: 'Europe/Kyiv',
                    })}
                  </p>
                </div>
              </div>

              {event.endDate && (
                <div className="flex items-center gap-3 text-sm">
                  <MdAccessTime
                    className="text-(--color-primary) shrink-0"
                    size={20}
                  />
                  <div>
                    <p className="text-gray-400">Дата завершення</p>
                    <p className="text-white font-medium">
                      {new Date(event.endDate).toLocaleDateString('uk-UA', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        timeZone: 'Europe/Kyiv',
                      })}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm">
                <MdLocationOn
                  className="text-(--color-primary) shrink-0"
                  size={20}
                />
                <div className="flex-1">
                  <p className="text-gray-400">Місце проведення</p>
                  <p className="text-white font-medium">{event.address}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {event.city.name}
                    {event.city.region?.name && `, ${event.city.region.name}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <MdPerson
                  className="text-(--color-primary) shrink-0"
                  size={20}
                />
                <div>
                  <p className="text-gray-400">Організатор</p>
                  <p className="text-white font-medium">
                    {event.application.owner.fullName ||
                      event.application.owner.nickName}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="bg-black/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Опис</h2>
              <p className="text-gray-300 whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="bg-black/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-white">Статистика</h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Тип змагання</span>
                <span className="px-3 py-1 rounded-md bg-(--color-primary)/10 text-(--color-primary) font-medium text-sm">
                  {event.competitionType}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Учасників</span>
                <span className="text-white font-semibold">
                  {event.registeredParticipants}/{event.maxParticipants}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Ціна</span>
                <span className="text-(--color-primary) font-semibold">
                  {event.price > 0 ? `${event.price} грн.` : 'Безкоштовно'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Статус</span>
                <span
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    event.isCompleted
                      ? 'bg-green-900/50 text-green-300'
                      : event.isActive
                        ? 'bg-blue-900/50 text-blue-300'
                        : 'bg-gray-900/50 text-gray-300'
                  }`}
                >
                  {event.isCompleted
                    ? 'Завершено'
                    : event.isActive
                      ? 'Активний'
                      : 'Неактивний'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {(canComplete || event.isCompleted || results.length > 0) && (
        <div className="bg-black/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <MdEmojiEvents className="text-(--color-primary)" size={24} />
              Результати події
            </h2>
            <div className="flex gap-2">
              {canComplete && (
                <button
                  onClick={handleCompleteEvent}
                  className="px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-colors text-sm font-semibold border border-green-600/30 flex items-center gap-2"
                >
                  <MdCheckCircle size={18} />
                  Завершити подію
                </button>
              )}
              {event.isCompleted && (
                <>
                  {allParticipantsHaveResults && hasUnconfirmedResults && (
                    <button
                      onClick={handleConfirmAllResults}
                      disabled={isConfirmingAll}
                      className="px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-colors text-sm font-semibold border border-green-600/30 disabled:opacity-50 flex items-center gap-2"
                    >
                      <MdCheckCircle size={18} />
                      {isConfirmingAll
                        ? 'Підтвердження...'
                        : 'Підтвердити всі результати'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-12">
              <MdEmojiEvents className="text-gray-600 mx-auto mb-4" size={48} />
              <p className="text-gray-400 text-lg font-medium mb-2">
                Результати ще не додані
              </p>
              <p className="text-gray-500 text-sm mb-6">
                {event.isCompleted
                  ? 'Рейтинг ще не був нарахований'
                  : 'Після завершення події ви зможете додати результати'}
              </p>
            </div>
          ) : groupedResults ? (
            <>
              {groupedResults.type === 'teams' && (
                <div className="space-y-6">
                  {groupedResults.teams.map(([teamId, teamResults]) => {
                    const team = teamResults[0]?.team;
                    const teamSummaryResult = teamResults.find(
                      (result) =>
                        result.teamId !== undefined &&
                        result.teamId !== null &&
                        result.userId === undefined,
                    );
                    const teamTotalPoints = teamSummaryResult?.points;
                    const teamOutcome =
                      teamSummaryResult?.outcome ??
                      teamResults.find((result) => result.outcome === 'WIN')?.outcome ??
                      'PARTICIPATED';
                    // Сортируем по очкам (по убыванию)
                    const sortedResults = [...teamResults]
                      .filter(
                        (result) =>
                          result.userId !== undefined && result.userId !== null,
                      )
                      .sort(
                      (a, b) => b.points - a.points,
                    );

                    return (
                      <div key={teamId} className="rounded-xl border border-white/10 bg-white/2 p-4 space-y-3">
                        <h3 className="text-base font-semibold text-white border-b border-white/10 pb-3 flex items-center justify-between gap-3">
                          <span>{team?.name || `Команда ID: ${teamId}`}</span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                teamOutcome === 'WIN'
                                  ? 'bg-green-900/50 text-green-300'
                                  : 'bg-gray-800 text-gray-300'
                              }`}
                            >
                              {teamOutcome === 'WIN' ? 'Переможець' : 'Учасник'}
                            </span>
                            {teamTotalPoints !== undefined && (
                              <span className="text-(--color-primary) text-sm font-bold">
                                {teamTotalPoints} очок
                              </span>
                            )}
                          </div>
                        </h3>
                        {sortedResults.length > 0 && (
                          <div className="overflow-x-auto rounded-lg border border-white/10 bg-black/30">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-white/10 bg-white/5">
                                  <th className="text-left py-3 px-4 text-gray-400 text-xs font-semibold uppercase tracking-wide">
                                    Гравець
                                  </th>
                                  <th className="text-center py-3 px-4 text-gray-400 text-xs font-semibold uppercase tracking-wide">
                                    Очки
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {sortedResults.map((result) => (
                                  <tr
                                    key={result.id}
                                    className="border-b border-white/5 last:border-b-0 hover:bg-white/3 transition-colors"
                                  >
                                    <td className="py-3 px-4">
                                      <span className="text-white font-medium">
                                        {result.user?.nickName || 'Невідомий'}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <span className="inline-flex min-w-14 justify-center rounded-md bg-(--color-primary)/15 text-(--color-primary) px-2 py-1 font-semibold">
                                        {result.points}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {groupedResults.ungrouped.length > 0 && (
                    <div className="rounded-xl border border-white/10 bg-white/2 p-4 space-y-3">
                      <h3 className="text-base font-semibold text-white border-b border-white/10 pb-3">
                        Інші
                      </h3>
                      <div className="overflow-x-auto rounded-lg border border-white/10 bg-black/30">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                              <th className="text-left py-3 px-4 text-gray-400 text-xs font-semibold uppercase tracking-wide">
                                Гравець
                              </th>
                              <th className="text-center py-3 px-4 text-gray-400 text-xs font-semibold uppercase tracking-wide">
                                Очки
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {groupedResults.ungrouped.map((result) => (
                              <tr
                                key={result.id}
                                className="border-b border-white/5 last:border-b-0 hover:bg-white/3 transition-colors"
                              >
                                <td className="py-3 px-4">
                                  <span className="text-white font-medium">
                                    {result.user?.nickName || 'Невідомий'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className="inline-flex min-w-14 justify-center rounded-md bg-(--color-primary)/15 text-(--color-primary) px-2 py-1 font-semibold">
                                    {result.points}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {groupedResults.type === 'sides' && (
                <div className="space-y-6">
                  {groupedResults.sides.map(([sideId, sideResults]) => {
                    const side = groupedResults.sidesList?.find(
                      (s) => s.id === sideId,
                    );
                    const sortedResults = [...sideResults].sort(
                      (a, b) => b.points - a.points,
                    );

                    return (
                      <div key={sideId} className="rounded-xl border border-white/10 bg-white/2 p-4 space-y-3">
                        <h3 className="text-base font-semibold text-white border-b border-white/10 pb-3">
                          {side?.name || `Сторона ID: ${sideId}`}
                        </h3>
                        <div className="overflow-x-auto rounded-lg border border-white/10 bg-black/30">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-white/10 bg-white/5">
                                <th className="text-left py-3 px-4 text-gray-400 text-xs font-semibold uppercase tracking-wide">
                                  Гравець
                                </th>
                                <th className="text-center py-3 px-4 text-gray-400 text-xs font-semibold uppercase tracking-wide">
                                  Очки
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {sortedResults.map((result) => (
                                <tr
                                  key={result.id}
                                  className="border-b border-white/5 last:border-b-0 hover:bg-white/3 transition-colors"
                                >
                                  <td className="py-3 px-4">
                                    <span className="text-white font-medium">
                                      {result.user?.nickName || 'Невідомий'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className="inline-flex min-w-14 justify-center rounded-md bg-(--color-primary)/15 text-(--color-primary) px-2 py-1 font-semibold">
                                      {result.points}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                  {groupedResults.ungrouped.length > 0 && (
                    <div className="rounded-xl border border-white/10 bg-white/2 p-4 space-y-3">
                      <h3 className="text-base font-semibold text-white border-b border-white/10 pb-3">
                        Інші
                      </h3>
                      <div className="overflow-x-auto rounded-lg border border-white/10 bg-black/30">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                              <th className="text-left py-3 px-4 text-gray-400 text-xs font-semibold uppercase tracking-wide">
                                Гравець
                              </th>
                              <th className="text-center py-3 px-4 text-gray-400 text-xs font-semibold uppercase tracking-wide">
                                Очки
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {groupedResults.ungrouped.map((result) => (
                              <tr
                                key={result.id}
                                className="border-b border-white/5 last:border-b-0 hover:bg-white/3 transition-colors"
                              >
                                <td className="py-3 px-4">
                                  <span className="text-white font-medium">
                                    {result.user?.nickName || 'Невідомий'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className="inline-flex min-w-14 justify-center rounded-md bg-(--color-primary)/15 text-(--color-primary) px-2 py-1 font-semibold">
                                    {result.points}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {groupedResults.type === 'list' && (
                <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/30">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        <th className="text-left py-3 px-4 text-gray-400 text-xs font-semibold uppercase tracking-wide">
                          Гравець
                        </th>
                        <th className="text-center py-3 px-4 text-gray-400 text-xs font-semibold uppercase tracking-wide">
                          Очки
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...groupedResults.results]
                        .sort((a, b) => b.points - a.points)
                        .map((result) => (
                          <tr
                            key={result.id}
                            className="border-b border-white/5 last:border-b-0 hover:bg-white/3 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <span className="text-white font-medium">
                                {result.user?.nickName ||
                                  result.team?.name ||
                                  'Невідомий'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex min-w-14 justify-center rounded-md bg-(--color-primary)/15 text-(--color-primary) px-2 py-1 font-semibold">
                                {result.points}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* Gallery Section */}
      {(event.isCompleted ||
        (fromPendingRatings &&
          event.endDate &&
          new Date(event.endDate) < new Date())) && (
        <div className="bg-black/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <MdPhotoLibrary className="text-(--color-primary)" size={24} />
              Галерея події
            </h2>
            {(!fromArchive || fromPendingRatings) && (
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-gray-300 text-sm font-semibold border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                  <MdUpload size={18} />
                  Обрати фото
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFilesChange}
                  />
                </label>
                <span className="text-xs text-gray-500">
                  Рекомендовано: 1600x900, мінімум 1200x675.
                </span>
                {selectedFiles.length > 0 && (
                  <span className="text-xs text-gray-400">
                    Обрано:{' '}
                    <span className="text-white font-semibold">
                      {selectedFiles.length}
                    </span>
                  </span>
                )}
                {selectedFiles.length > 0 && (
                  <button
                    onClick={handleUploadGallery}
                    disabled={isUploading}
                    className="px-4 py-2 rounded-lg bg-(--color-primary) text-black font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <MdUpload size={18} />
                    {isUploading ? 'Завантаження...' : 'Завантажити'}
                  </button>
                )}
              </div>
            )}
          </div>

          {isLoadingGallery ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              Завантаження галереї...
            </div>
          ) : sortedGallery.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 text-2xl">
                📷
              </div>
              <div>
                <p className="text-gray-400 text-sm font-semibold">
                  Фото ще не додані
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Завантажте перші знімки події
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedGallery.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/10 bg-white/5 overflow-hidden group"
                >
                  <div className="relative w-full h-48 bg-black">
                    <Image
                      src={item.url}
                      alt="Gallery"
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover"
                    />
                    {(!fromArchive || fromPendingRatings) && (
                      <button
                        onClick={() => handleDeletePhoto(item.id)}
                        disabled={isDeleting === item.id}
                        className="absolute top-2 right-2 p-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 flex items-center gap-1 text-xs"
                      >
                        <MdDelete size={16} />
                        {isDeleting === item.id ? '...' : ''}
                      </button>
                    )}
                  </div>
                  <div className="p-3">
                    <span className="text-xs text-gray-400">
                      {item.createdAt.toLocaleDateString('uk-UA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <CompleteWithRatingsModal
        isOpen={completeWithRatingsOpen}
        onConfirm={handleConfirmComplete}
        onCancel={() => setCompleteWithRatingsOpen(false)}
        event={event}
        isLoading={isCompleting}
      />
    </div>
  );
}
