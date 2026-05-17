'use client';

import { useEffect, useState } from 'react';
import { MdCheckCircle, MdClose } from 'react-icons/md';
import * as eventsApi from '@/actions/events';
import * as ratingsApi from '@/actions/ratings';
import { Event } from '../types';

interface CompleteWithRatingsModalProps {
  isOpen: boolean;
  event: Event | null;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: (payload: ratingsApi.CompleteEventWithRatingsPayload) => void;
}

type OutcomeValue = 'WIN' | 'PARTICIPATED';

export default function CompleteWithRatingsModal({
  isOpen,
  event,
  isLoading = false,
  onCancel,
  onConfirm,
}: CompleteWithRatingsModalProps) {
  const [actualParticipants, setActualParticipants] = useState<number>(0);
  const [teamRows, setTeamRows] = useState<
    Array<{ teamId: number; name: string }>
  >([]);
  const [sideOutcomes, setSideOutcomes] = useState<
    Record<number, OutcomeValue>
  >({});
  const [teamOutcomes, setTeamOutcomes] = useState<
    Record<number, OutcomeValue>
  >({});
  const [error, setError] = useState<string | null>(null);

  const competitionType = String(event?.competitionType ?? '');
  const isTeamEvent =
    competitionType === 'Командне' || competitionType === 'TEAM';

  useEffect(() => {
    if (!isOpen || !event) {
      return;
    }

    let mounted = true;
    const init = async () => {
      try {
        const registrations = await eventsApi.getEventRegistrations(
          event.id,
          'APPROVED',
        );
        if (!mounted) return;

        setActualParticipants(
          event.registeredParticipants > 0
            ? event.registeredParticipants
            : registrations.length,
        );

        const uniqueTeams = new Map<number, { teamId: number; name: string }>();
        for (const registration of registrations) {
          if (registration.teamId && registration.team) {
            uniqueTeams.set(registration.teamId, {
              teamId: registration.teamId,
              name: registration.team.name,
            });
          }
        }
        setTeamRows(Array.from(uniqueTeams.values()));

        const nextSideOutcomes: Record<number, OutcomeValue> = {};
        for (const side of event.sides ?? []) {
          nextSideOutcomes[side.id] = 'PARTICIPATED';
        }
        setSideOutcomes(nextSideOutcomes);

        const nextTeamOutcomes: Record<number, OutcomeValue> = {};
        for (const row of Array.from(uniqueTeams.values())) {
          nextTeamOutcomes[row.teamId] = 'PARTICIPATED';
        }
        setTeamOutcomes(nextTeamOutcomes);
      } catch (e) {
        if (!mounted) return;
        setError(
          e instanceof Error
            ? e.message
            : 'Не вдалося завантажити налаштування рейтингу',
        );
      }
    };

    void init();
    return () => {
      mounted = false;
    };
  }, [isOpen, event]);

  if (!isOpen || !event) {
    return null;
  }

  const handleSubmit = () => {
    setError(null);
    if (actualParticipants < 0) {
      setError('Фактична кількість учасників має бути 0 або більше');
      return;
    }

    const outcomes: ratingsApi.CompleteEventWithRatingsPayload['outcomes'] = [];

    if (isTeamEvent) {
      for (const row of teamRows) {
        outcomes.push({
          teamId: row.teamId,
          outcome: teamOutcomes[row.teamId] ?? 'PARTICIPATED',
        });
      }
    } else {
      for (const side of event.sides ?? []) {
        outcomes.push({
          sideId: side.id,
          outcome: sideOutcomes[side.id] ?? 'PARTICIPATED',
        });
      }
    }

    if (outcomes.length === 0) {
      setError('Не задані результати сторін/команд');
      return;
    }

    onConfirm({
      actualParticipants,
      outcomes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-black/85 border-2 border-white/10 rounded-2xl shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">
            Завершення події та нарахування рейтингу
          </h2>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Закрити"
          >
            <MdClose size={22} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <p className="text-sm text-gray-300">
            Подія:{' '}
            <span className="text-white font-semibold">{event.name}</span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm text-gray-300">
              Фактична кількість учасників
              <input
                type="number"
                min={0}
                value={actualParticipants}
                onChange={(e) => setActualParticipants(Number(e.target.value))}
                className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
              />
            </label>
          </div>

          {isTeamEvent ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white">
                Результати команд
              </h3>
              {teamRows.length === 0 ? (
                <p className="text-xs text-gray-400">
                  Немає команд для оцінювання.
                </p>
              ) : (
                teamRows.map((team) => (
                  <div
                    key={team.teamId}
                    className="flex items-center justify-between gap-3 p-2 rounded border border-gray-800"
                  >
                    <span className="text-sm text-white">{team.name}</span>
                    <select
                      value={teamOutcomes[team.teamId] ?? 'PARTICIPATED'}
                      onChange={(e) =>
                        setTeamOutcomes((prev) => ({
                          ...prev,
                          [team.teamId]: e.target.value as OutcomeValue,
                        }))
                      }
                      className="px-3 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                    >
                      <option value="WIN">ПЕРЕМОГА</option>
                      <option value="PARTICIPATED">УЧАСТЬ</option>
                    </select>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white">
                Результати сторін
              </h3>
              {(event.sides ?? []).length === 0 ? (
                <p className="text-xs text-gray-400">У події немає сторін.</p>
              ) : (
                (event.sides ?? []).map((side) => (
                  <div
                    key={side.id}
                    className="flex items-center justify-between gap-3 p-2 rounded border border-gray-800"
                  >
                    <span className="text-sm text-white">{side.name}</span>
                    <select
                      value={sideOutcomes[side.id] ?? 'PARTICIPATED'}
                      onChange={(e) =>
                        setSideOutcomes((prev) => ({
                          ...prev,
                          [side.id]: e.target.value as OutcomeValue,
                        }))
                      }
                      className="px-3 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                    >
                      <option value="WIN">ПЕРЕМОГА</option>
                      <option value="PARTICIPATED">УЧАСТЬ</option>
                    </select>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-white/10 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/5 transition-colors disabled:opacity-50 font-medium text-sm"
          >
            Скасувати
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50 font-medium text-sm flex items-center gap-2"
          >
            <MdCheckCircle size={18} />
            {isLoading ? 'Завершення...' : 'Завершити і нарахувати'}
          </button>
        </div>
      </div>
    </div>
  );
}
