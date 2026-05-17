'use client';

import { useEffect, useState } from 'react';
import { getEventResults } from '@/actions/ratings';
import type { EventResultResponse } from '@/interfaces';
import Image from 'next/image';

interface EventResultsSectionProps {
  eventId: number;
  competitionType: string;
}

const OUTCOME_LABELS: Record<'WIN' | 'PARTICIPATED', string> = {
  WIN: 'Переможець',
  PARTICIPATED: 'Учасник',
};

const OUTCOME_PRIORITY: Record<'WIN' | 'PARTICIPATED', number> = {
  WIN: 1,
  PARTICIPATED: 2,
};

const normalizeOutcome = (
  outcome?: EventResultResponse['outcome'],
): 'WIN' | 'PARTICIPATED' => (outcome === 'WIN' ? 'WIN' : 'PARTICIPATED');

export default function EventResultsSection({
  eventId,
  competitionType,
}: EventResultsSectionProps) {
  const [results, setResults] = useState<EventResultResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isTeamEvent = competitionType === 'TEAM' || competitionType === 'Командне';

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const eventResults = await getEventResults(eventId);
        if (!mounted) return;

        setResults(eventResults);
      } catch (e) {
        if (!mounted) return;
        console.error('Failed to load event results:', e);
        setError(e instanceof Error ? e.message : 'Помилка при завантаженні результатів');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [eventId]);

  if (loading) {
    return (
      <div className="border-t border-white py-8">
        <div className="text-center text-gray-400">Завантаження результатів...</div>
      </div>
    );
  }

  if (error) {
    return null; // Не показываем ошибку, просто не отображаем секцию
  }

  if (!results || results.length === 0) {
    return null; // Не показываем секцию, если результатов нет
  }

  const groupedResults = (() => {
    const groups = new Map<
      string,
      {
        id: string;
        name: string;
        points: number;
        outcome: 'WIN' | 'PARTICIPATED';
        logoUrl?: string;
        hasSummaryRow: boolean;
        players: EventResultResponse[];
      }
    >();

    if (isTeamEvent) {
      const teamRows = results.filter((result) => result.teamId && !result.userId);
      const playerRows = results.filter((result) => result.userId);

      teamRows.forEach((result) => {
        const key = `team-${result.teamId}`;
        groups.set(key, {
          id: key,
          name: result.team?.name || 'Команда',
          points: result.points,
          outcome: normalizeOutcome(result.outcome),
          logoUrl: result.team?.logoUrl,
          hasSummaryRow: true,
          players: [],
        });
      });

      playerRows.forEach((result) => {
        const key = result.teamId ? `team-${result.teamId}` : `user-${result.userId}`;
        const existing = groups.get(key);

        if (!existing) {
          groups.set(key, {
            id: key,
            name: result.team?.name || result.user?.nickName || 'Команда',
            points: 0,
            outcome: normalizeOutcome(result.outcome),
            logoUrl: result.team?.logoUrl,
            hasSummaryRow: false,
            players: [result],
          });
          return;
        }

        if (normalizeOutcome(result.outcome) === 'WIN') {
          existing.outcome = 'WIN';
        }
        existing.players.push(result);
      });

      groups.forEach((group) => {
        if (!group.hasSummaryRow) {
          group.points = group.players.reduce((acc, player) => acc + player.points, 0);
        }
        group.players.sort((a, b) => b.points - a.points);
      });
    } else {
      const playerRows = results.filter((result) => result.userId);

      playerRows.forEach((result) => {
        const sideIdentifier = result.sideId ?? result.side?.id;
        const sideKey =
          sideIdentifier !== undefined
            ? `side-${sideIdentifier}`
            : result.side?.name
              ? `side-name-${result.side.name}`
              : 'side-participants';
        const sideName = result.side?.name || 'Учасники';
        const existing = groups.get(sideKey);

        if (!existing) {
          groups.set(sideKey, {
            id: sideKey,
            name: sideName,
            points: result.points,
            outcome: normalizeOutcome(result.outcome),
            hasSummaryRow: false,
            players: [result],
          });
          return;
        }

        existing.points += result.points;
        if (normalizeOutcome(result.outcome) === 'WIN') {
          existing.outcome = 'WIN';
        }
        existing.players.push(result);
      });

      groups.forEach((group) => {
        group.players.sort((a, b) => b.points - a.points);
      });
    }

    return Array.from(groups.values()).sort((a, b) => {
      const aOrder = OUTCOME_PRIORITY[a.outcome];
      const bOrder = OUTCOME_PRIORITY[b.outcome];
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      return b.points - a.points;
    });
  })();

  if (groupedResults.length === 0) {
    return null;
  }

  return (
    <div className="w-full border-t border-white py-8 1440:py-14">
      <div className="w-full px-4 sm:px-6 lg:px-10 1440:px-20">
        <h2 className="text-white text-2xl 1440:text-[56px] min1441:text-[40px] font-semibold uppercase mb-6 1440:mb-10">
          Результати події
        </h2>
        <div className="space-y-4 1440:space-y-6">
          {groupedResults.map((group) => (
            <div
              key={group.id}
              className="rounded-xl border border-white/10 bg-white/2 overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
            >
              <div className="flex items-center justify-between gap-4 px-4 py-3 1440:px-6 1440:py-4 bg-white/5 border-b border-white/10">
                <div className="flex items-center gap-3">
                  {group.logoUrl && (
                    <div className="w-9 h-9 1440:w-11 1440:h-11 rounded-full overflow-hidden shrink-0">
                      <Image
                        src={group.logoUrl}
                        alt={group.name}
                        width={44}
                        height={44}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-white text-sm 1440:text-base font-semibold uppercase">
                      {group.name}
                    </span>
                    <span
                      className={`inline-flex w-fit mt-1 px-2 py-0.5 rounded text-[10px] 1440:text-xs font-semibold ${
                        group.outcome === 'WIN'
                          ? 'bg-green-900/50 text-green-300'
                          : 'bg-white/10 text-gray-300'
                      }`}
                    >
                      {OUTCOME_LABELS[group.outcome]}
                    </span>
                  </div>
                </div>
                <span className="inline-flex min-w-[88px] justify-center rounded-md bg-[#FF4D1C]/15 text-[#FF4D1C] px-3 py-1 text-sm 1440:text-base font-semibold">
                  {group.points} очок
                </span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-white/10 bg-black/30 m-3 1440:m-4">
                <table className="w-full min-w-[460px] text-sm">
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
                    {group.players.map((player) => (
                      <tr
                        key={player.id}
                        className="border-b border-white/5 last:border-b-0 hover:bg-white/3 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="text-white text-sm 1440:text-base font-medium">
                            {player.user?.nickName || 'Гравець'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex min-w-[76px] justify-center rounded-md bg-[#FF4D1C]/10 text-[#FF4D1C] px-2 py-1 text-sm 1440:text-base font-semibold">
                            {player.points} очок
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
