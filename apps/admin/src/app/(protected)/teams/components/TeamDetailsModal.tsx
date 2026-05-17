'use client';

import * as teamsApi from '@/actions/teams';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useEffect, useState } from 'react';
import {
  MdClose,
  MdGroups,
  MdPeople,
  MdCalendarToday,
  MdSwapHoriz,
} from 'react-icons/md';

interface TeamDetailsModalProps {
  teamId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function TeamDetailsModal({
  teamId,
  isOpen,
  onClose,
}: TeamDetailsModalProps) {
  const [team, setTeam] = useState<teamsApi.Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNewOwner, setSelectedNewOwner] =
    useState<teamsApi.TeamMember | null>(null);
  const [isOwnerTransferLoading, setIsOwnerTransferLoading] = useState(false);
  const [ownerTransferError, setOwnerTransferError] = useState<string | null>(
    null,
  );
  const [ownerTransferSuccess, setOwnerTransferSuccess] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!isOpen || !teamId) return;

    const loadTeamDetails = async () => {
      setIsLoading(true);
      try {
        const data = await teamsApi.getTeamById(teamId);
        setTeam(data);
      } catch (err) {
        console.error('Failed to load team details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadTeamDetails();
  }, [teamId, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedNewOwner(null);
      setIsOwnerTransferLoading(false);
      setOwnerTransferError(null);
      setOwnerTransferSuccess(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeMembers =
    team?.members
      ?.filter((m) => m.memberStatus === 'ACTIVE')
      .sort((a, b) => {
        const aIsOwner = (a.role || '').toLowerCase().includes('owner');
        const bIsOwner = (b.role || '').toLowerCase().includes('owner');

        if (aIsOwner === bIsOwner) return 0;
        return aIsOwner ? -1 : 1;
      }) || [];
  const leftMembers =
    team?.members?.filter((m) => m.memberStatus === 'LEFT') || [];
  const currentOwner = activeMembers.find((member) =>
    (member.role || '').toLowerCase().includes('owner'),
  );

  const transferOwnerToMember = async () => {
    if (!team || !selectedNewOwner || isOwnerTransferLoading) return;

    setIsOwnerTransferLoading(true);
    setOwnerTransferError(null);
    setOwnerTransferSuccess(null);

    try {
      await teamsApi.reassignTeamOwnerByAdmin(team.id, selectedNewOwner.userId);
      setOwnerTransferSuccess(
        `Права власника передано користувачу ${selectedNewOwner.user.nickName}`,
      );
      setSelectedNewOwner(null);

      const refreshedTeam = await teamsApi.getTeamById(team.id);
      if (refreshedTeam) {
        setTeam(refreshedTeam);
      }
    } catch (error) {
      setOwnerTransferError(
        error instanceof Error
          ? error.message
          : 'Не вдалося передати права власника команди',
      );
    } finally {
      setIsOwnerTransferLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="custom-scrollbar w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto bg-black/80 border-2 border-white/10 rounded-2xl shadow-2xl shadow-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-black/80 border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 sm:gap-3">
            <MdGroups
              size={24}
              className="text-(--color-primary) sm:w-7 sm:h-7"
            />
            <span className="truncate">Деталі команди</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors shrink-0"
            aria-label="Закрити"
            title="Закрити"
          >
            <MdClose size={24} className="text-gray-400" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          ) : !team ? (
            <div className="text-center py-12">
              <p className="text-gray-400">
                Не вдалося завантажити дані команди
              </p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-gray-800 bg-black/50">
                {team.logoUrl ? (
                  <img
                    src={team.logoUrl}
                    alt={team.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border-2 border-white/10"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white/5 border-2 border-white/10 flex items-center justify-center">
                    <MdGroups className="text-gray-500" size={32} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 wrap-break-word">
                    {team.name}
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <MdCalendarToday size={16} />
                      <span>
                        Створено:{' '}
                        {new Date(team.createdAt).toLocaleDateString('uk-UA')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MdPeople size={16} />
                      <span>{activeMembers.length} активних учасників</span>
                    </div>
                  </div>
                </div>
              </div>

              {ownerTransferSuccess && (
                <div className="p-3 sm:p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <p className="text-emerald-300 text-sm">
                    {ownerTransferSuccess}
                  </p>
                </div>
              )}

              {ownerTransferError && (
                <div className="p-3 sm:p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                  <p className="text-red-300 text-sm">{ownerTransferError}</p>
                </div>
              )}

              <div>
                <h4 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <MdPeople size={20} className="text-(--color-primary)" />
                  Активні учасники ({activeMembers.length})
                </h4>
                {activeMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Немає активних учасників
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between gap-2 p-2 sm:p-4 rounded-lg sm:rounded-xl bg-black/50 border border-gray-800 hover:border-(--color-primary)/40 transition-colors"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          {member.user.logoUrl ? (
                            <img
                              src={member.user.logoUrl}
                              alt={member.user.nickName}
                              className="w-8 h-8 sm:w-12 sm:h-12 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                              <span className="text-white font-bold text-xs sm:text-lg">
                                {member.user.nickName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-semibold text-xs sm:text-base truncate">
                              {member.user.nickName}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              {member.role && (
                                <p className="text-xs text-(--color-primary) truncate">
                                  {member.role}
                                </p>
                              )}
                              {member.joinedAt && (
                                <p className="text-xs text-gray-500 sm:hidden">
                                  {new Date(member.joinedAt).toLocaleDateString(
                                    'uk-UA',
                                    { day: '2-digit', month: '2-digit' },
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col h-full justify-between text-right shrink-0">
                          {currentOwner?.id !== member.id ? (
                            <button
                              type="button"
                              onClick={() => {
                                setOwnerTransferError(null);
                                setSelectedNewOwner(member);
                              }}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/20 text-xs text-white hover:bg-white/10 transition-colors"
                            >
                              <MdSwapHoriz
                                size={14}
                                className="text-(--color-primary)"
                              />
                              Передати права власника
                            </button>
                          ) : (
                            <p className="h-7" aria-hidden="true"></p>
                          )}
                          {member.joinedAt && (
                            <p className=" hidden sm:block text-xs text-gray-400">
                              Приєднався:{' '}
                              {new Date(member.joinedAt).toLocaleDateString(
                                'uk-UA',
                              )}
                            </p>
                          )}
                          {member.teamContribution > 0 && (
                            <p className="text-xs text-gray-500">
                              Внесок: {member.teamContribution}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {leftMembers.length > 0 && (
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-gray-400 mb-3 sm:mb-4 flex items-center gap-2">
                    Колишні учасники ({leftMembers.length})
                  </h4>
                  <div className="space-y-2">
                    {leftMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg bg-black/40 border border-gray-800"
                      >
                        <div className="flex items-center gap-3">
                          {member.user.logoUrl ? (
                            <img
                              src={member.user.logoUrl}
                              alt={member.user.nickName}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover opacity-60 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                              <span className="text-gray-500 font-bold text-sm">
                                {member.user.nickName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <p className="text-gray-500 text-sm truncate">
                            {member.user.nickName}
                          </p>
                        </div>
                        {member.leftAt && (
                          <p className="text-xs text-gray-600 ml-11 sm:ml-0">
                            Вийшов:{' '}
                            {new Date(member.leftAt).toLocaleDateString(
                              'uk-UA',
                            )}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedNewOwner && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-black/80 border-2 border-white/10 rounded-2xl shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">
                Підтвердження передачі прав
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (isOwnerTransferLoading) return;
                  setSelectedNewOwner(null);
                }}
                disabled={isOwnerTransferLoading}
                className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                aria-label="Закрити"
              >
                <MdClose size={22} />
              </button>
            </div>
            <div className="px-6 py-6">
              <p className="text-sm text-gray-300">
                Передати права власника команди користувачу{' '}
                <span className="font-semibold text-white">
                  {selectedNewOwner.user.nickName}
                </span>
                ?
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end px-6 py-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  if (isOwnerTransferLoading) return;
                  setSelectedNewOwner(null);
                }}
                disabled={isOwnerTransferLoading}
                className="px-4 py-2 rounded-lg border border-white/20 text-gray-200 hover:bg-white/10 transition-colors disabled:opacity-60"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={transferOwnerToMember}
                disabled={isOwnerTransferLoading}
                className="px-4 py-2 rounded-lg bg-(--color-primary) text-white font-semibold hover:bg-(--color-primary-hover) transition-colors disabled:opacity-60"
              >
                {isOwnerTransferLoading ? 'Передача...' : 'Підтвердити'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
