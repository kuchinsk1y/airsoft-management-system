'use client';

import { useEffect, useState } from 'react';
import MobileApplicationItem from './MobileApplicationItem';
import DesktopApplicationItem from './DesktopApplicationItem';
import { getTeamApplications, updateJoinRequestStatus } from '@/actions/teams';
import { markNotificationsByTypeRead } from '@/actions/notifications';
import type { Application, TeamApplicationsProps } from '@/interfaces';

export type { Application } from '@/interfaces';


export function TeamApplications({ teamId }: TeamApplicationsProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingApplicationId, setProcessingApplicationId] = useState<number | null>(null);

  useEffect(() => {
    if (!teamId) {
      setIsLoading(false);
      return;
    }

    const fetchApplications = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getTeamApplications(teamId);

        const mapped = data.map((item: any) => {
          const stats = item.playerStats || item.user?.playerStats;

          return {
          id: item.id,
          logoUrl: item.user?.logoUrl || '/team-logo-avatar.png',
          userName: item.user?.nickName || 'Unknown',
          rating: stats?.rank || 0,
          gamesPlayed: stats?.gamesPlayed || 0,
          points: stats?.totalPoints ?? stats?.points ?? 0,
          applicationDate: new Date(item.createdAt).toLocaleDateString('uk-UA'),
          status: item.status || 'PENDING',
          };
        });

        setApplications(mapped);
      } catch (err) {
        setError('Помилка при завантаженні заявок');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [teamId]);

  const handleAccept = async (applicationId: number) => {
    if (!teamId || processingApplicationId !== null) return;

    try {
      setProcessingApplicationId(applicationId);
      await updateJoinRequestStatus(teamId, applicationId, 'APPROVED');
      setApplications((prev) =>
        prev.filter((app) => app.id !== applicationId),
      );
      await markNotificationsByTypeRead('TEAM_JOIN_REQUEST');
      window.dispatchEvent(new Event('notifications-updated'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка при прийнятті заявки');
    } finally {
      setProcessingApplicationId(null);
    }
  };

  const handleReject = async (applicationId: number) => {
    if (!teamId || processingApplicationId !== null) return;

    try {
      setProcessingApplicationId(applicationId);
      await updateJoinRequestStatus(teamId, applicationId, 'REJECTED');
      setApplications((prev) =>
        prev.filter((app) => app.id !== applicationId),
      );
      await markNotificationsByTypeRead('TEAM_JOIN_REQUEST');
      window.dispatchEvent(new Event('notifications-updated'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка при відхиленні заявки');
    } finally {
      setProcessingApplicationId(null);
    }
  };

  const gridLayout =
    'grid grid-cols-[48px_minmax(126px,126px)_minmax(50px,1fr)_minmax(70px,1fr)_minmax(70px,1fr)_190px] gap-1 items-center w-full min-w-0';

  if (isLoading) {
    return (
      <div className="text-center text-gray-400 py-10 text-sm uppercase">
        Завантаження заявок...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-[#FF4D1C] py-10 text-sm uppercase">
        {error}
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center text-gray-400 py-10 text-sm uppercase">
        Немає заявок на вступ
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      <div className="min991:hidden space-y-3">
        {applications.map((app) => (
          <MobileApplicationItem
            key={app.id}
            team={app}
            onAccept={() => handleAccept(app.id)}
            onReject={() => handleReject(app.id)}
            isProcessing={processingApplicationId === app.id}
          />
        ))}
      </div>

      <div className="hidden min991:block">
        <div
          className={`${gridLayout} px-3 py-3 border-b border-[#262626] text-[11px] bg-[#0D0D0D] text-[#999999] font-semibold uppercase`}
        >
          <span>Фото</span>
          <span>Позивний</span>
          <span className="text-center">Ігор</span>
          <span className="text-center">Очок</span>
          <span className="text-center">Дата заявки</span>
          <span className="text-end pr-4">Дії</span>
        </div>

        <div className="flex flex-col">
          {applications.map((app) => (
            <DesktopApplicationItem
              key={app.id}
              team={app}
              gridLayout={gridLayout}
              onAccept={() => handleAccept(app.id)}
              onReject={() => handleReject(app.id)}
              isProcessing={processingApplicationId === app.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}