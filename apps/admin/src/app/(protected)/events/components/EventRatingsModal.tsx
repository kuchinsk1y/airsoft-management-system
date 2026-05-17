'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MdClose, MdAdd, MdEdit, MdDelete, MdCheckCircle, MdSearch } from 'react-icons/md';
import { Event } from '../types';
import * as ratingsApi from '@/actions/ratings';
import * as usersApi from '@/actions/users';
import * as teamsApi from '@/actions/teams';
import * as eventsApi from '@/actions/events';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import DeleteResultConfirmModal from './DeleteResultConfirmModal';
import styles from './EventFormModal.module.css';

interface EventRatingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
}

interface ResultFormData {
  userId?: number;
  teamId?: number;
  placement: 'FIRST' | 'SECOND' | 'THIRD' | 'PARTICIPATED';
  kills?: number;
  deaths?: number;
  accuracy?: number;
}

export default function EventRatingsModal({
  isOpen,
  onClose,
  event,
}: EventRatingsModalProps) {
  const queryClient = useQueryClient();
  const [isClosing, setIsClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingResult, setEditingResult] = useState<ratingsApi.EventResultResponse | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<ResultFormData>({
    placement: 'PARTICIPATED',
  });
  const [error, setError] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [resultToDelete, setResultToDelete] = useState<ratingsApi.EventResultResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['event-results', event?.id],
    queryFn: () => event ? ratingsApi.getEventResults(event.id) : [],
    enabled: isOpen && !!event,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });
  const eventId = event?.id;
  const { data: approvedRegistrations = [] } = useQuery({
    queryKey: ['event-registrations', eventId, 'APPROVED'],
    queryFn: () => eventsApi.getEventRegistrations(eventId as number, 'APPROVED'),
    enabled: isOpen && !!eventId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  // Определяем тип события
  const competitionType = String(event?.competitionType ?? '');
  const isTeamEvent =
    competitionType === 'Командне' ||
    competitionType === 'TEAM';

  // Получаем ID игроков, которым уже есть рейтинг
  const usersWithResults = useMemo(() => {
    return new Set(results.filter(r => r.userId).map(r => r.userId!));
  }, [results]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedTeamId(null);
    }
  }, [isOpen]);

  const registrations = useMemo(
    () =>
      approvedRegistrations.map((registration) => ({
        userId: registration.userId,
        eventSideId: registration.eventSideId || null,
      })),
    [approvedRegistrations],
  );

  const teams = useMemo(() => {
    if (!isTeamEvent) return [];
    const uniqueTeams = new Map<number, teamsApi.Team>();
    for (const reg of approvedRegistrations) {
      if (!reg.team || !reg.team.id || uniqueTeams.has(reg.team.id)) continue;
      uniqueTeams.set(reg.team.id, {
        id: reg.team.id,
        name: reg.team.name,
        logoUrl: reg.team.logoUrl || null,
        description: null,
        createdAt: '',
        updatedAt: '',
      });
    }
    return Array.from(uniqueTeams.values());
  }, [approvedRegistrations, isTeamEvent]);

  const users = useMemo(() => {
    if (isTeamEvent) return [];
    const uniqueUsers = new Map<number, usersApi.UserProfile>();
    for (const reg of approvedRegistrations) {
      if (!reg.user || !reg.user.id || uniqueUsers.has(reg.user.id)) continue;
      uniqueUsers.set(reg.user.id, {
        id: reg.user.id,
        nickName: reg.user.nickName,
        fullName: reg.user.fullName || null,
        email: (reg.user as any).email || '',
        phoneNumber: (reg.user as any).phoneNumber || null,
        dateOfBirth: (reg.user as any).dateOfBirth || null,
        country: (reg.user as any).country || null,
        region: (reg.user as any).region || null,
        city: (reg.user as any).city || null,
        logoUrl: reg.user.logoUrl || null,
        isVerified: (reg.user as any).isVerified ?? true,
        createdAt: reg.createdAt,
        updatedAt: reg.createdAt,
      });
    }
    return Array.from(uniqueUsers.values());
  }, [approvedRegistrations, isTeamEvent]);

  const teamMembers = useMemo(() => {
    if (!isTeamEvent || !selectedTeamId) return [];
    return approvedRegistrations
      .filter((registration) => registration.teamId === selectedTeamId && registration.user?.id)
      .map((registration) => ({
        id: 0,
        teamId: selectedTeamId,
        userId: registration.user.id,
        memberStatus: 'ACTIVE' as const,
        joinedAt: null,
        leftAt: null,
        teamContribution: 0,
        user: {
          id: registration.user.id,
          nickName: registration.user.nickName,
          logoUrl: registration.user.logoUrl || null,
        },
      }));
  }, [approvedRegistrations, isTeamEvent, selectedTeamId]);

  // Закрываем dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
        setShowTeamDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsClosing(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      document.body.style.overflow = '';
      onClose();
      setShowForm(false);
      setEditingResult(null);
      setFormData({ placement: 'PARTICIPATED' });
      setError(null);
    }, 400);
  };

  const handleAddNew = () => {
    setEditingResult(null);
    setFormData({ placement: 'PARTICIPATED' });
    setShowForm(true);
    setError(null);
    setTeamSearchQuery('');
    setUserSearchQuery('');
    setSelectedTeamId(null);
    setShowUserDropdown(false);
    setShowTeamDropdown(false);
  };

  const handleEdit = (result: ratingsApi.EventResultResponse) => {
    setEditingResult(result);
    
    if (isTeamEvent && result.teamId) {
      setSelectedTeamId(result.teamId);
      const selectedTeam = teams.find((t) => t.id === result.teamId);
      setTeamSearchQuery(selectedTeam?.name || '');
    } else if (!isTeamEvent && result.userId) {
      const selectedUser = users.find((u) => u.id === result.userId);
      setUserSearchQuery(selectedUser?.nickName || '');
    }
    
    setFormData({
      userId: result.userId,
      teamId: result.teamId,
      placement: result.placement as 'FIRST' | 'SECOND' | 'THIRD' | 'PARTICIPATED',
      kills: result.kills,
      deaths: result.deaths,
      accuracy: result.accuracy,
    });
    setShowForm(true);
    setError(null);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingResult(null);
    setFormData({ placement: 'PARTICIPATED' });
    setError(null);
    setTeamSearchQuery('');
    setUserSearchQuery('');
    setSelectedTeamId(null);
    setShowUserDropdown(false);
    setShowTeamDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const data: ratingsApi.EventResultRequest = {
        eventId: event.id,
        ...formData,
      };

      if (editingResult) {
        await ratingsApi.updateEventResult(event.id, editingResult.id, data);
      } else {
        await ratingsApi.createEventResult(event.id, data);
      }

      // Сбрасываем editingResult перед обновлением данных
      setEditingResult(null);
      
      await queryClient.invalidateQueries({ queryKey: ['event-results', event.id] });
      
      // Закрываем форму
      handleCancelForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка при збереженні');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = async (result: ratingsApi.EventResultResponse) => {
    if (!event) return;
    try {
      await ratingsApi.confirmEventResult(event.id, result.id);
      await queryClient.invalidateQueries({ queryKey: ['event-results', event.id] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка при підтвердженні');
    }
  };

  const handleDelete = (result: ratingsApi.EventResultResponse) => {
    setResultToDelete(result);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!event || !resultToDelete) return;

    setIsDeleting(true);
    try {
      await ratingsApi.deleteEventResult(event.id, resultToDelete.id);
      await queryClient.invalidateQueries({ queryKey: ['event-results', event.id] });
      
      // Если удаляли редактируемый результат, закрываем форму
      if (editingResult && editingResult.id === resultToDelete.id) {
        handleCancelForm();
      }
      
      setDeleteConfirmOpen(false);
      setResultToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка при видаленні');
      setIsDeleting(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setResultToDelete(null);
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 ${
        isClosing ? styles.overlayExit : styles.overlay
      }`}
      onClick={handleClose}
    >
      <div
        className={`custom-scrollbar w-full max-w-4xl bg-black/80 border-2 border-white/10 rounded-2xl shadow-2xl shadow-black/40 max-h-[90vh] overflow-y-auto ${
          isClosing ? styles.modalExit : styles.modal
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-black/80">
          <div>
            <h2 className="text-xl font-bold text-white">
              Результати та рейтинги
            </h2>
            <p className="text-gray-400 text-sm">{event?.name}</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Закрити"
          >
            <MdClose size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {!showForm ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Результати ({results.length})
                </h3>
                <button
                  onClick={handleAddNew}
                  className="flex items-center gap-2 px-4 py-2 bg-(--color-primary) text-white rounded-lg hover:bg-(--color-primary-hover) transition-colors text-sm font-semibold"
                >
                  <MdAdd size={18} />
                  Додати результат
                </button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p>Немає результатів</p>
                  <p className="text-sm mt-2">Додайте перший результат</p>
                </div>
              ) : (
                (() => {
                  // Группируем результаты
                  if (isTeamEvent) {
                    // Для командных событий группируем по командам
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

                    return (
                      <div className="space-y-4">
                        {/* Группированные по командам */}
                        {Array.from(groupedByTeam.entries()).map(([teamId, teamResults]) => {
                          const team = teamResults[0]?.team;
                          return (
                            <div key={teamId} className="space-y-2">
                              <h4 className="text-md font-semibold text-white border-b border-gray-700 pb-2">
                                {team?.name || `Команда ID: ${teamId}`}
                              </h4>
                              <div className="space-y-3">
                                {teamResults.map((result) => (
                                  <div
                                    key={result.id}
                                    className="bg-gray-900/50 border border-gray-800 rounded-lg p-4"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                          <span
                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                              result.placement === 'FIRST'
                                                ? 'bg-yellow-900/50 text-yellow-300'
                                                : result.placement === 'SECOND'
                                                ? 'bg-gray-700 text-gray-300'
                                                : result.placement === 'THIRD'
                                                ? 'bg-orange-900/50 text-orange-300'
                                                : 'bg-gray-800 text-gray-400'
                                            }`}
                                          >
                                            {result.placement === 'FIRST'
                                              ? '1-ше місце'
                                              : result.placement === 'SECOND'
                                              ? '2-ге місце'
                                              : result.placement === 'THIRD'
                                              ? '3-тє місце'
                                              : 'Учасник'}
                                          </span>
                                          {result.status === 'CONFIRMED' && (
                                            <span className="px-2 py-1 rounded text-xs bg-green-900/50 text-green-300 flex items-center gap-1">
                                              <MdCheckCircle size={14} />
                                              Підтверджено
                                            </span>
                                          )}
                                        </div>
                                        <div className="space-y-1 text-sm">
                                          {result.user && (
                                            <p className="text-white font-medium">
                                              Гравець: {result.user.nickName}
                                            </p>
                                          )}
                                          <div className="flex gap-4 text-gray-400">
                                            <span>Очки: {result.points}</span>
                                            {result.kills !== undefined && (
                                              <span>Вбивств: {result.kills}</span>
                                            )}
                                            {result.deaths !== undefined && (
                                              <span>Смертей: {result.deaths}</span>
                                            )}
                                            {result.accuracy !== undefined && (
                                              <span>Точність: {typeof result.accuracy === 'number' ? result.accuracy.toFixed(1) : result.accuracy}%</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        {result.status !== 'CONFIRMED' && (
                                          <button
                                            onClick={() => handleConfirm(result)}
                                            className="p-2 text-green-400 hover:bg-green-900/20 rounded transition-colors"
                                            title="Підтвердити"
                                          >
                                            <MdCheckCircle size={20} />
                                          </button>
                                        )}
                                        <button
                                          onClick={() => handleEdit(result)}
                                          className="p-2 text-(--color-primary) hover:bg-(--color-primary)/10 rounded transition-colors"
                                          title="Редагувати"
                                        >
                                          <MdEdit size={20} />
                                        </button>
                                        <button
                                          onClick={() => handleDelete(result)}
                                          className="p-2 text-red-400 hover:bg-red-900/20 rounded transition-colors"
                                          title="Видалити"
                                        >
                                          <MdDelete size={20} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                        {/* Негруппированные результаты */}
                        {ungrouped.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-md font-semibold text-white border-b border-gray-700 pb-2">
                              Інші
                            </h4>
                            <div className="space-y-3">
                              {ungrouped.map((result) => (
                                <div
                                  key={result.id}
                                  className="bg-gray-900/50 border border-gray-800 rounded-lg p-4"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                        <span
                                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                            result.placement === 'FIRST'
                                              ? 'bg-yellow-900/50 text-yellow-300'
                                              : result.placement === 'SECOND'
                                              ? 'bg-gray-700 text-gray-300'
                                              : result.placement === 'THIRD'
                                              ? 'bg-orange-900/50 text-orange-300'
                                              : 'bg-gray-800 text-gray-400'
                                          }`}
                                        >
                                          {result.placement === 'FIRST'
                                            ? '1-ше місце'
                                            : result.placement === 'SECOND'
                                            ? '2-ге місце'
                                            : result.placement === 'THIRD'
                                            ? '3-тє місце'
                                            : 'Учасник'}
                                        </span>
                                        {result.status === 'CONFIRMED' && (
                                          <span className="px-2 py-1 rounded text-xs bg-green-900/50 text-green-300 flex items-center gap-1">
                                            <MdCheckCircle size={14} />
                                            Підтверджено
                                          </span>
                                        )}
                                      </div>
                                      <div className="space-y-1 text-sm">
                                        {result.user && (
                                          <p className="text-white font-medium">
                                            Гравець: {result.user.nickName}
                                          </p>
                                        )}
                                        <div className="flex gap-4 text-gray-400">
                                          <span>Очки: {result.points}</span>
                                          {result.kills !== undefined && (
                                            <span>Вбивств: {result.kills}</span>
                                          )}
                                          {result.deaths !== undefined && (
                                            <span>Смертей: {result.deaths}</span>
                                          )}
                                          {result.accuracy !== undefined && (
                                            <span>Точність: {typeof result.accuracy === 'number' ? result.accuracy.toFixed(1) : result.accuracy}%</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      {result.status !== 'CONFIRMED' && (
                                        <button
                                          onClick={() => handleConfirm(result)}
                                          className="p-2 text-green-400 hover:bg-green-900/20 rounded transition-colors"
                                          title="Підтвердити"
                                        >
                                          <MdCheckCircle size={20} />
                                        </button>
                                      )}
                                      <button
                                        onClick={() => handleEdit(result)}
                                        className="p-2 text-(--color-primary) hover:bg-(--color-primary)/10 rounded transition-colors"
                                        title="Редагувати"
                                      >
                                        <MdEdit size={20} />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(result)}
                                        className="p-2 text-red-400 hover:bg-red-900/20 rounded transition-colors"
                                        title="Видалити"
                                      >
                                        <MdDelete size={20} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  } else {
                    // Для индивидуальных событий группируем по сторонам (если есть)
                    const sides = event?.sides || [];
                    if (sides.length > 0) {
                      // Группируем результаты по сторонам на основе регистраций
                      const groupedBySide = new Map<number, ratingsApi.EventResultResponse[]>();
                      const ungrouped: ratingsApi.EventResultResponse[] = [];

                      results.forEach((result) => {
                        if (result.userId) {
                          const registration = registrations.find(r => r.userId === result.userId);
                          const sideId = registration?.eventSideId;
                          if (sideId) {
                            if (!groupedBySide.has(sideId)) {
                              groupedBySide.set(sideId, []);
                            }
                            groupedBySide.get(sideId)!.push(result);
                          } else {
                            ungrouped.push(result);
                          }
                        } else {
                          ungrouped.push(result);
                        }
                      });

                      return (
                        <div className="space-y-4">
                          {/* Группированные по сторонам */}
                          {Array.from(groupedBySide.entries()).map(([sideId, sideResults]) => {
                            const side = sides.find(s => s.id === sideId);
                            return (
                              <div key={sideId} className="space-y-2">
                                <h4 className="text-md font-semibold text-white border-b border-gray-700 pb-2">
                                  {side?.name || `Сторона ID: ${sideId}`}
                                </h4>
                                <div className="space-y-3">
                                  {sideResults.map((result) => (
                                    <div
                                      key={result.id}
                                      className="bg-gray-900/50 border border-gray-800 rounded-lg p-4"
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-3 mb-2">
                                            <span
                                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                result.placement === 'FIRST'
                                                  ? 'bg-yellow-900/50 text-yellow-300'
                                                  : result.placement === 'SECOND'
                                                  ? 'bg-gray-700 text-gray-300'
                                                  : result.placement === 'THIRD'
                                                  ? 'bg-orange-900/50 text-orange-300'
                                                  : 'bg-gray-800 text-gray-400'
                                              }`}
                                            >
                                              {result.placement === 'FIRST'
                                                ? '1-ше місце'
                                                : result.placement === 'SECOND'
                                                ? '2-ге місце'
                                                : result.placement === 'THIRD'
                                                ? '3-тє місце'
                                                : 'Учасник'}
                                            </span>
                                            {result.status === 'CONFIRMED' && (
                                              <span className="px-2 py-1 rounded text-xs bg-green-900/50 text-green-300 flex items-center gap-1">
                                                <MdCheckCircle size={14} />
                                                Підтверджено
                                              </span>
                                            )}
                                          </div>
                                          <div className="space-y-1 text-sm">
                                            {result.user && (
                                              <p className="text-white font-medium">
                                                Гравець: {result.user.nickName}
                                              </p>
                                            )}
                                            <div className="flex gap-4 text-gray-400">
                                              <span>Очки: {result.points}</span>
                                              {result.kills !== undefined && (
                                                <span>Вбивств: {result.kills}</span>
                                              )}
                                              {result.deaths !== undefined && (
                                                <span>Смертей: {result.deaths}</span>
                                              )}
                                              {result.accuracy !== undefined && (
                                                <span>Точність: {typeof result.accuracy === 'number' ? result.accuracy.toFixed(1) : result.accuracy}%</span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                          {result.status !== 'CONFIRMED' && (
                                            <button
                                              onClick={() => handleConfirm(result)}
                                              className="p-2 text-green-400 hover:bg-green-900/20 rounded transition-colors"
                                              title="Підтвердити"
                                            >
                                              <MdCheckCircle size={20} />
                                            </button>
                                          )}
                                          <button
                                            onClick={() => handleEdit(result)}
                                            className="p-2 text-(--color-primary) hover:bg-(--color-primary)/10 rounded transition-colors"
                                            title="Редагувати"
                                          >
                                            <MdEdit size={20} />
                                          </button>
                                          <button
                                            onClick={() => handleDelete(result)}
                                            className="p-2 text-red-400 hover:bg-red-900/20 rounded transition-colors"
                                            title="Видалити"
                                          >
                                            <MdDelete size={20} />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                          {/* Негруппированные результаты */}
                          {ungrouped.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-md font-semibold text-white border-b border-gray-700 pb-2">
                                Інші
                              </h4>
                              <div className="space-y-3">
                                {ungrouped.map((result) => (
                                  <div
                                    key={result.id}
                                    className="bg-gray-900/50 border border-gray-800 rounded-lg p-4"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                          <span
                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                              result.placement === 'FIRST'
                                                ? 'bg-yellow-900/50 text-yellow-300'
                                                : result.placement === 'SECOND'
                                                ? 'bg-gray-700 text-gray-300'
                                                : result.placement === 'THIRD'
                                                ? 'bg-orange-900/50 text-orange-300'
                                                : 'bg-gray-800 text-gray-400'
                                            }`}
                                          >
                                            {result.placement === 'FIRST'
                                              ? '1-ше місце'
                                              : result.placement === 'SECOND'
                                              ? '2-ге місце'
                                              : result.placement === 'THIRD'
                                              ? '3-тє місце'
                                              : 'Учасник'}
                                          </span>
                                          {result.status === 'CONFIRMED' && (
                                            <span className="px-2 py-1 rounded text-xs bg-green-900/50 text-green-300 flex items-center gap-1">
                                              <MdCheckCircle size={14} />
                                              Підтверджено
                                            </span>
                                          )}
                                        </div>
                                        <div className="space-y-1 text-sm">
                                          {result.user && (
                                            <p className="text-white font-medium">
                                              Гравець: {result.user.nickName}
                                            </p>
                                          )}
                                          <div className="flex gap-4 text-gray-400">
                                            <span>Очки: {result.points}</span>
                                            {result.kills !== undefined && (
                                              <span>Вбивств: {result.kills}</span>
                                            )}
                                            {result.deaths !== undefined && (
                                              <span>Смертей: {result.deaths}</span>
                                            )}
                                            {result.accuracy !== undefined && (
                                              <span>Точність: {typeof result.accuracy === 'number' ? result.accuracy.toFixed(1) : result.accuracy}%</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        {result.status !== 'CONFIRMED' && (
                                          <button
                                            onClick={() => handleConfirm(result)}
                                            className="p-2 text-green-400 hover:bg-green-900/20 rounded transition-colors"
                                            title="Підтвердити"
                                          >
                                            <MdCheckCircle size={20} />
                                          </button>
                                        )}
                                        <button
                                          onClick={() => handleEdit(result)}
                                          className="p-2 text-(--color-primary) hover:bg-(--color-primary)/10 rounded transition-colors"
                                          title="Редагувати"
                                        >
                                          <MdEdit size={20} />
                                        </button>
                                        <button
                                          onClick={() => handleDelete(result)}
                                          className="p-2 text-red-400 hover:bg-red-900/20 rounded transition-colors"
                                          title="Видалити"
                                        >
                                          <MdDelete size={20} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    } else {
                      // Если нет сторон, показываем простой список
                      return (
                        <div className="space-y-3">
                          {results.map((result) => (
                            <div
                              key={result.id}
                              className="bg-gray-900/50 border border-gray-800 rounded-lg p-4"
                            >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <span
                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                          result.placement === 'FIRST'
                                            ? 'bg-yellow-900/50 text-yellow-300'
                                            : result.placement === 'SECOND'
                                            ? 'bg-gray-700 text-gray-300'
                                            : result.placement === 'THIRD'
                                            ? 'bg-orange-900/50 text-orange-300'
                                            : 'bg-gray-800 text-gray-400'
                                        }`}
                                      >
                                        {result.placement === 'FIRST'
                                          ? '1-ше місце'
                                          : result.placement === 'SECOND'
                                          ? '2-ге місце'
                                          : result.placement === 'THIRD'
                                          ? '3-тє місце'
                                          : 'Учасник'}
                                      </span>
                                      {result.status === 'CONFIRMED' && (
                                        <span className="px-2 py-1 rounded text-xs bg-green-900/50 text-green-300 flex items-center gap-1">
                                          <MdCheckCircle size={14} />
                                          Підтверджено
                                        </span>
                                      )}
                                    </div>
                                    <div className="space-y-1 text-sm">
                                      {result.user && (
                                        <p className="text-white font-medium">
                                          Гравець: {result.user.nickName}
                                        </p>
                                      )}
                                      <div className="flex gap-4 text-gray-400">
                                        <span>Очки: {result.points}</span>
                                        {result.kills !== undefined && (
                                          <span>Вбивств: {result.kills}</span>
                                        )}
                                        {result.deaths !== undefined && (
                                          <span>Смертей: {result.deaths}</span>
                                        )}
                                        {result.accuracy !== undefined && (
                                          <span>Точність: {typeof result.accuracy === 'number' ? result.accuracy.toFixed(1) : result.accuracy}%</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    {result.status !== 'CONFIRMED' && (
                                      <button
                                        onClick={() => handleConfirm(result)}
                                        className="p-2 text-green-400 hover:bg-green-900/20 rounded transition-colors"
                                        title="Підтвердити"
                                      >
                                        <MdCheckCircle size={20} />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleEdit(result)}
                                      className="p-2 text-(--color-primary) hover:bg-(--color-primary)/10 rounded transition-colors"
                                      title="Редагувати"
                                    >
                                      <MdEdit size={20} />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(result)}
                                      className="p-2 text-red-400 hover:bg-red-900/20 rounded transition-colors"
                                      title="Видалити"
                                    >
                                      <MdDelete size={20} />
                                    </button>
                                  </div>
                                </div>
                            </div>
                          ))}
                        </div>
                      );
                    }
                  }
                })()
              )}
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-lg font-semibold text-white">
                {editingResult ? 'Редагувати результат' : 'Новий результат'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Місце
                  </label>
                  <select
                    value={formData.placement}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        placement: e.target.value as ResultFormData['placement'],
                      })
                    }
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-(--color-primary)"
                    title="Оберіть місце"
                    required
                  >
                    <option value="FIRST">1-ше місце</option>
                    <option value="SECOND">2-ге місце</option>
                    <option value="THIRD">3-тє місце</option>
                    <option value="PARTICIPATED">Учасник</option>
                  </select>
                </div>

                {isTeamEvent ? (
                  <>
                    {/* Выбор команды */}
                    <div className="relative" ref={dropdownRef}>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Команда
                      </label>
                      <div className="relative">
                        <div className="flex items-center gap-2">
                          <MdSearch className="absolute left-3 text-gray-400" size={18} />
                          <input
                            type="text"
                            value={teamSearchQuery}
                            onChange={(e) => {
                              setTeamSearchQuery(e.target.value);
                              setShowTeamDropdown(true);
                            }}
                            onFocus={() => setShowTeamDropdown(true)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-(--color-primary)"
                            placeholder="Пошук команди..."
                            disabled={!!editingResult}
                          />
                        </div>
                        {showTeamDropdown && !editingResult && (
                          <div className="absolute z-10 w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg max-h-60 overflow-y-auto">
                            {teams
                              .filter((team) =>
                                team.name.toLowerCase().includes(teamSearchQuery.toLowerCase())
                              )
                              .slice(0, 10)
                              .map((team) => (
                                <button
                                  key={team.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedTeamId(team.id);
                                    setTeamSearchQuery(team.name);
                                    setShowTeamDropdown(false);
                                    setFormData({
                                      ...formData,
                                      teamId: team.id,
                                      userId: undefined,
                                    });
                                  }}
                                  className="w-full px-4 py-2 text-left text-white hover:bg-gray-800 transition-colors"
                                >
                                  <div className="font-medium">{team.name}</div>
                                  <div className="text-xs text-gray-400">ID: {team.id}</div>
                                </button>
                              ))}
                            {teams.filter((team) =>
                              team.name.toLowerCase().includes(teamSearchQuery.toLowerCase())
                            ).length === 0 && (
                              <div className="px-4 py-2 text-gray-400 text-sm">
                                Команди не знайдено
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {selectedTeamId && (
                        <div className="mt-2 text-sm text-gray-400">
                          Обрано: {teams.find((t) => t.id === selectedTeamId)?.name || `ID: ${selectedTeamId}`}
                        </div>
                      )}
                    </div>

                    {/* Выбор игрока из команды */}
                    {selectedTeamId && (
                      <div className="relative" ref={dropdownRef}>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Гравець з команди
                        </label>
                        <div className="relative">
                          <div className="flex items-center gap-2">
                            <MdSearch className="absolute left-3 text-gray-400" size={18} />
                            <input
                              type="text"
                              value={userSearchQuery}
                              onChange={(e) => {
                                setUserSearchQuery(e.target.value);
                                setShowUserDropdown(true);
                              }}
                              onFocus={() => setShowUserDropdown(true)}
                              className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-(--color-primary)"
                              placeholder="Пошук гравця..."
                            />
                          </div>
                          {showUserDropdown && (
                            <div className="absolute z-10 w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg max-h-60 overflow-y-auto">
                              {teamMembers
                                .filter((member) => {
                                  // Фильтруем игроков, которым уже есть рейтинг (кроме редактируемого)
                                  if (editingResult && editingResult.userId === member.user.id) {
                                    return true; // Показываем редактируемого игрока
                                  }
                                  return !usersWithResults.has(member.user.id);
                                })
                                .filter((member) => {
                                  const userName = member.user.nickName?.toLowerCase() || '';
                                  return userName.includes(userSearchQuery.toLowerCase());
                                })
                                .slice(0, 10)
                                .map((member) => (
                                  <button
                                    key={member.user.id}
                                    type="button"
                                    onClick={() => {
                                      setFormData({
                                        ...formData,
                                        userId: member.user.id,
                                      });
                                      setUserSearchQuery(member.user.nickName || '');
                                      setShowUserDropdown(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-white hover:bg-gray-800 transition-colors"
                                  >
                                    <div className="font-medium">
                                      {member.user.nickName}
                                    </div>
                                  </button>
                                ))}
                              {teamMembers.filter((member) => {
                                if (editingResult && editingResult.userId === member.user.id) {
                                  return true;
                                }
                                return !usersWithResults.has(member.user.id);
                              }).filter((member) => {
                                const userName = member.user.nickName?.toLowerCase() || '';
                                return userName.includes(userSearchQuery.toLowerCase());
                              }).length === 0 && (
                                <div className="px-4 py-2 text-gray-400 text-sm">
                                  Гравців не знайдено або всім вже виставлено рейтинг
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {formData.userId && (
                          <div className="mt-2 text-sm text-gray-400">
                            Обрано: {teamMembers.find((m) => m.user.id === formData.userId)?.user.nickName || `ID: ${formData.userId}`}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="relative" ref={dropdownRef}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Гравець
                    </label>
                    <div className="relative">
                      <div className="flex items-center gap-2">
                        <MdSearch className="absolute left-3 text-gray-400" size={18} />
                        <input
                          type="text"
                          value={userSearchQuery}
                          onChange={(e) => {
                            setUserSearchQuery(e.target.value);
                            setShowUserDropdown(true);
                          }}
                          onFocus={() => setShowUserDropdown(true)}
                          className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-(--color-primary)"
                          placeholder="Пошук гравця..."
                        />
                      </div>
                      {showUserDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg max-h-60 overflow-y-auto">
                          {users
                            .filter((user) => {
                              // Фильтруем игроков, которым уже есть рейтинг (кроме редактируемого)
                              if (editingResult && editingResult.userId === user.id) {
                                return true; // Показываем редактируемого игрока
                              }
                              return !usersWithResults.has(user.id);
                            })
                            .filter(
                              (user) =>
                                user.nickName?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                                user.fullName?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                                user.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
                            )
                            .slice(0, 10)
                            .map((user) => (
                              <button
                                key={user.id}
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    userId: user.id,
                                    teamId: undefined,
                                  });
                                  setUserSearchQuery(user.nickName || user.email || '');
                                  setShowUserDropdown(false);
                                }}
                                className="w-full px-4 py-2 text-left text-white hover:bg-gray-800 transition-colors"
                              >
                                <div className="font-medium">
                                  {user.nickName || user.fullName || user.email}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {user.fullName && user.nickName && user.fullName !== user.nickName && user.fullName}
                                  {user.email && ` • ${user.email}`}
                                </div>
                              </button>
                            ))}
                          {users.filter((user) => {
                            if (editingResult && editingResult.userId === user.id) {
                              return true;
                            }
                            return !usersWithResults.has(user.id);
                          }).filter(
                            (user) =>
                              user.nickName?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                              user.fullName?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                              user.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
                          ).length === 0 && (
                            <div className="px-4 py-2 text-gray-400 text-sm">
                              Гравців не знайдено або всім вже виставлено рейтинг
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {formData.userId && (
                      <div className="mt-2 text-sm text-gray-400">
                        Обрано: {users.find((u) => u.id === formData.userId)?.nickName || `ID: ${formData.userId}`}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Вбивства
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.kills || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          kills: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-(--color-primary)"
                      title="Вбивства"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Смерті
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.deaths || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deaths: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-(--color-primary)"
                      title="Смерті"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Точність (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.accuracy || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        accuracy: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-(--color-primary)"
                    title="Точність у відсотках"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-(--color-primary) text-white rounded-lg hover:bg-(--color-primary-hover) transition-colors disabled:opacity-50 font-semibold"
                >
                  {isSubmitting ? 'Збереження...' : 'Зберегти'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 font-semibold"
                >
                  Скасувати
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <DeleteResultConfirmModal
        isOpen={deleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        resultInfo={
          resultToDelete
            ? resultToDelete.user
              ? `Результат гравця "${resultToDelete.user.nickName}"`
              : resultToDelete.team
              ? `Результат команди "${resultToDelete.team.name}"`
              : undefined
            : undefined
        }
        isLoading={isDeleting}
      />
    </div>
  );
}
