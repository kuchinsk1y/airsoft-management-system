'use client';

import {
  acceptOwnershipTransferRequest,
  acceptTeamInvitation,
  getMyTeams,
  rejectOwnershipTransferRequest,
  rejectTeamInvitation,
  type TeamInvitationResponse,
  type TeamOwnershipTransferRequestResponse,
} from '@/actions/teams';
import {
  getProfileNotificationsBootstrapData,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/actions/notifications';
import { FieldError } from '@/components/ui/field';
import type { NotificationItem } from '@/interfaces';
import { Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function 
NotificationsPageClient() {
  const router = useRouter();
  const [items, setItems] = useState<TeamInvitationResponse[]>([]);
  const [ownershipRequests, setOwnershipRequests] = useState<
    TeamOwnershipTransferRequestResponse[]
  >([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [notificationsBusy, setNotificationsBusy] = useState(false);

  const pending = useMemo(
    () => items.filter((item) => item.status === 'PENDING'),
    [items],
  );

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );

  const hasPendingRequests = pending.length > 0 || ownershipRequests.length > 0;

  const loadData = async (): Promise<void> => {
    const {
      invitations,
      transferRequests,
      notifications: nextNotifications,
    } = await getProfileNotificationsBootstrapData();

    setItems(invitations);
    setOwnershipRequests(transferRequests);
    setNotifications(nextNotifications);
  };

  const markRelatedNotificationsRead = async (params: {
    type: string;
    teamId: number;
    title: string;
    teamName?: string;
  }): Promise<void> => {
    const parseTeamIdFromLink = (rawLink?: string | null): number | null => {
      if (!rawLink) {
        return null;
      }

      try {
        const parsed = new URL(rawLink, window.location.origin);
        const value = Number(parsed.searchParams.get('teamId'));
        return Number.isFinite(value) ? value : null;
      } catch {
        return null;
      }
    };

    const normalizedTeamName = (params.teamName || '').trim().toLowerCase();

    const unreadCandidates = notifications.filter((notification) => {
      if (notification.isRead) {
        return false;
      }

      if (notification.type !== params.type) {
        return false;
      }

      if (notification.title !== params.title) {
        return false;
      }

      if (!normalizedTeamName) {
        return true;
      }

      return notification.message.toLowerCase().includes(normalizedTeamName);
    });

    const withExactTeamId = unreadCandidates.filter((notification) => {
      const linkTeamId = parseTeamIdFromLink(notification.link);
      return linkTeamId === params.teamId;
    });

    const chooseLatest = (
      list: NotificationItem[],
    ): NotificationItem | null => {
      if (list.length === 0) {
        return null;
      }

      return [...list].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];
    };

    const target =
      chooseLatest(withExactTeamId) || chooseLatest(unreadCandidates);

    if (!target) {
      return;
    }

    await markNotificationRead(target.id);

    setNotifications((prev) =>
      prev.map((item) =>
        item.id === target.id
          ? {
              ...item,
              isRead: true,
            }
          : item,
      ),
    );
    window.dispatchEvent(new Event('notifications-updated'));
  };

  const resolveTeamLink = async (
    rawLink: string,
    notificationType?: string,
  ): Promise<string> => {
    try {
      const parsed = new URL(rawLink, window.location.origin);

      const isInvite =
        parsed.pathname === '/profile/notifications' && parsed.hash;
      if (isInvite) {
        return `${parsed.pathname}${parsed.hash}`;
      }

      const isTeamPage = parsed.pathname === '/profile/team';
      if (!isTeamPage) {
        return `${parsed.pathname}${parsed.search}`;
      }

      const isConfirmationFlow =
        notificationType === 'TEAM_JOIN_REQUEST' ||
        notificationType === 'TEAM_INVITATION';
      if (isConfirmationFlow && !parsed.searchParams.has('tab')) {
        parsed.searchParams.set('tab', 'applications');
      }

      const hasTeamId = parsed.searchParams.has('teamId');
      if (hasTeamId) {
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
      }

      const teams = await getMyTeams();
      const firstTeamId = Number((teams as Array<{ id?: number }>)?.[0]?.id);
      if (!Number.isFinite(firstTeamId) || firstTeamId <= 0) {
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
      }

      parsed.searchParams.set('teamId', String(firstTeamId));
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return rawLink;
    }
  };

  useEffect(() => {

    let mounted = true;

    (async () => {
      try {
        setIsLoading(true);
        setError(null);

        const {
          invitations,
          transferRequests,
          notifications: nextNotifications,
        } = await getProfileNotificationsBootstrapData();

        if (!mounted) {
          return;
        }

        setItems(invitations);
        setOwnershipRequests(transferRequests);
        setNotifications(nextNotifications);
      } catch (e) {
        if (!mounted) {
          return;
        }

        setError(
          e instanceof Error ? e.message : 'Помилка при завантаженні запрошень',
        );
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="text-white ">
      <div className="mb-5 pb-5 border-b border-white/15 flex flex-col gap-3">
        <p
          className="uppercase text-sm text-white/70 scroll-mt-24 "
          id="invite"
        >
          Запрошення{' '}
        </p>
        {hasPendingRequests ? (
          <>
            {pending.map((invitation) => {
              const inviterName =
                invitation.inviter?.nickName ||
                invitation.inviter?.fullName ||
                `#${invitation.inviterId}`;
              const invitationBusyKey = `invitation-${invitation.id}`;

              return (
                <div
                  key={`invitation-${invitation.id}`}
                  className="border border-white/15 bg-white/5 px-4 py-3 flex items-center gap-4"
                >
                  <img
                    src={invitation.team?.logoUrl || '/team-logo-avatar.png'}
                    alt="team logo"
                    className="w-12 h-12 object-cover shrink-0"
                    onError={(e) => {
                      e.currentTarget.src = '/team-logo-avatar.png';
                    }}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="uppercase text-sm font-semibold truncate">
                      {invitation.team?.name || 'Команда'}
                    </p>
                    <p className="text-xs text-white/60 mt-1">
                      Запросив(ла): {inviterName}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Відхилити"
                      disabled={busyKey === invitationBusyKey}
                      className="w-10 h-10 border border-white/30 hover:bg-white/10 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
                      onClick={async () => {
                        setBusyKey(invitationBusyKey);
                        setError(null);
                        setSuccess(null);

                        try {
                          await rejectTeamInvitation(invitation.id);
                          setItems((prev) =>
                            prev.filter((item) => item.id !== invitation.id),
                          );
                          await markRelatedNotificationsRead({
                            type: 'TEAM_INVITATION',
                            teamId: invitation.teamId,
                            title: 'Запрошення до команди',
                            teamName: invitation.team?.name,
                          });
                          setSuccess('Запрошення відхилено');
                          window.dispatchEvent(
                            new Event('notifications-updated'),
                          );
                        } catch (e) {
                          setError(
                            e instanceof Error
                              ? e.message
                              : 'Помилка при відхиленні запрошення',
                          );
                        } finally {
                          setBusyKey(null);
                        }
                      }}
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      aria-label="Прийняти"
                      disabled={busyKey === invitationBusyKey}
                      className="w-10 h-10 border border-[#FF4D1C]/70 text-[#FF4D1C] hover:bg-[#FF4D1C]/10 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
                      onClick={async () => {
                        setBusyKey(invitationBusyKey);
                        setError(null);
                        setSuccess(null);

                        try {
                          const accepted = await acceptTeamInvitation(
                            invitation.id,
                          );
                          setItems((prev) =>
                            prev.filter((item) => item.id !== invitation.id),
                          );
                          await markRelatedNotificationsRead({
                            type: 'TEAM_INVITATION',
                            teamId: invitation.teamId,
                            title: 'Запрошення до команди',
                            teamName: invitation.team?.name,
                          });
                          setSuccess('Запрошення прийнято');
                          window.dispatchEvent(
                            new Event('notifications-updated'),
                          );
                          router.push(
                            `/profile/team?teamId=${accepted.teamId}`,
                          );
                        } catch (e) {
                          setError(
                            e instanceof Error
                              ? e.message
                              : 'Помилка при прийнятті запрошення',
                          );
                        } finally {
                          setBusyKey(null);
                        }
                      }}
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {ownershipRequests.map((request) => {
              const ownerName =
                request.currentOwner?.nickName ||
                request.currentOwner?.fullName ||
                `#${request.currentOwnerId}`;
              const ownershipBusyKey = `ownership-${request.id}`;

              return (
                <div
                  key={`ownership-${request.id}`}
                  className="border border-white/15 bg-white/5 px-4 py-3 flex items-center gap-4"
                >
                  <img
                    src={request.team?.logoUrl || '/team-logo-avatar.png'}
                    alt="team logo"
                    className="w-12 h-12 object-cover shrink-0"
                    onError={(e) => {
                      e.currentTarget.src = '/team-logo-avatar.png';
                    }}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="uppercase text-sm font-semibold truncate">
                      {request.team?.name || 'Команда'}
                    </p>
                    <p className="text-xs text-white/60 mt-1">
                      {ownerName} хоче передати вам права власника команди
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Відхилити передачу прав"
                      disabled={busyKey === ownershipBusyKey}
                      className="w-10 h-10 border border-white/30 hover:bg-white/10 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
                      onClick={async () => {
                        setBusyKey(ownershipBusyKey);
                        setError(null);
                        setSuccess(null);

                        try {
                          await rejectOwnershipTransferRequest({
                            teamId: request.teamId,
                          });
                          setOwnershipRequests((prev) =>
                            prev.filter((item) => item.id !== request.id),
                          );
                          await markRelatedNotificationsRead({
                            type: 'TRANSFER_OWNERSHIP',
                            teamId: request.teamId,
                            title:
                              'Вам запропонували право власності на команду',
                            teamName: request.team?.name,
                          });
                          setSuccess('Запит на передачу прав відхилено');
                          window.dispatchEvent(
                            new Event('notifications-updated'),
                          );
                        } catch (e) {
                          setError(
                            e instanceof Error
                              ? e.message
                              : 'Помилка при відхиленні передачі прав',
                          );
                        } finally {
                          setBusyKey(null);
                        }
                      }}
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      aria-label="Прийняти передачу прав"
                      disabled={busyKey === ownershipBusyKey}
                      className="w-10 h-10 border border-[#FF4D1C]/70 text-[#FF4D1C] hover:bg-[#FF4D1C]/10 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
                      onClick={async () => {
                        setBusyKey(ownershipBusyKey);
                        setError(null);
                        setSuccess(null);

                        try {
                          await acceptOwnershipTransferRequest({
                            teamId: request.teamId,
                          });
                          setOwnershipRequests((prev) =>
                            prev.filter((item) => item.id !== request.id),
                          );
                          await markRelatedNotificationsRead({
                            type: 'TRANSFER_OWNERSHIP',
                            teamId: request.teamId,
                            title:
                              'Вам запропонували право власності на команду',
                            teamName: request.team?.name,
                          });
                          setSuccess('Права власника команди передано');
                          window.dispatchEvent(
                            new Event('notifications-updated'),
                          );
                          router.push(`/profile/team?teamId=${request.teamId}`);
                        } catch (e) {
                          setError(
                            e instanceof Error
                              ? e.message
                              : 'Помилка при прийнятті передачі прав',
                          );
                        } finally {
                          setBusyKey(null);
                        }
                      }}
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <p className="uppercase text-xs text-white/50">Запрошень немає</p>
        )}
      </div>

      {isLoading ? (
        <div className="text-white mt-10">
          <p className="uppercase text-sm text-white/70">Мої повідомлення</p>
          <p className="uppercase text-sm text-white/50 mt-6">
            Завантаження...
          </p>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <p className="uppercase text-sm text-white/70">Мої повідомлення</p>
        <button
          type="button"
          className="uppercase text-xs text-white/70 hover:text-white border border-white/20 px-3 py-2"
          onClick={async () => {
            setSuccess(null);
            setError(null);
            setIsLoading(true);

            try {
              await loadData();
            } catch (e) {
              setError(
                e instanceof Error
                  ? e.message
                  : 'Помилка при завантаженні запрошень',
              );
            } finally {
              setIsLoading(false);
            }
          }}
        >
          Оновити
        </button>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-4">
          <p className="uppercase text-xs text-white/60">
            Сповіщення{unreadCount ? ` • непрочитані: ${unreadCount}` : ''}
          </p>
          <button
            type="button"
            className="uppercase text-xs text-white/70 hover:text-white border border-white/20 px-3 py-2 disabled:opacity-50 disabled:pointer-events-none"
            disabled={notificationsBusy || notifications.length === 0}
            onClick={async () => {
              setNotificationsBusy(true);
              try {
                const ok = await markAllNotificationsRead();
                if (ok) {
                  setNotifications((prev) =>
                    prev.map((item) => ({ ...item, isRead: true })),
                  );
                  window.dispatchEvent(new Event('notifications-updated'));
                }
              } finally {
                setNotificationsBusy(false);
              }
            }}
          >
            Прочитати всі
          </button>
        </div>

        <div className="mt-3 flex flex-col gap-3">
          {notifications.length === 0 ? (
            <p className="uppercase text-sm text-white/50">Сповіщень немає</p>
          ) : (
            notifications.slice(0, 30).map((notification) => (
              <button
                key={notification.id}
                type="button"
                className={`text-left border border-white/15 bg-white/5 px-4 py-3 hover:bg-white/10 transition ${
                  notification.isRead ? 'opacity-70' : ''
                } ${!notification.isRead ? 'cursor-pointer' : ''}`}
                onClick={async () => {
                  if (!notification.isRead) {
                    await markNotificationRead(notification.id);
                    setNotifications((prev) =>
                      prev.map((item) =>
                        item.id === notification.id
                          ? { ...item, isRead: true }
                          : item,
                      ),
                    );
                    window.dispatchEvent(new Event('notifications-updated'));
                  }

                  if (notification.link && !notification.isRead) {
                    const target = await resolveTeamLink(
                      notification.link,
                      notification.type,
                    );
                    router.push(target);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="uppercase text-sm font-semibold truncate">
                      {notification.title}
                    </p>
                    <p className="text-xs text-white/70 mt-1">
                      {notification.message}
                    </p>
                  </div>
                  <div className="shrink-0 text-[10px] text-white/50 uppercase">
                    {notification.createdAt
                      ? new Date(notification.createdAt).toLocaleDateString(
                          'uk-UA',
                        )
                      : ''}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {success ? (
        <p className="uppercase text-xs text-white/80 mt-4">{success}</p>
      ) : null}

      {error ? (
        <div className="mt-4">
          <FieldError
            errors={[{ message: error }]}
            className="text-[#FA4616] text-[10px] 375:text-xs min376:text-[10px] 1440:text-base min1441:text-sm font-normal leading-[150%]"
          />
        </div>
      ) : null}
    </div>
  );
}
