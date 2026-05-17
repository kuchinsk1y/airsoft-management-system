'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import TabsNavigation from '../../components/TabsNavigation';
import Toast, { ToastMessage } from '@/app/components/Toast';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import * as ratingsApi from '@/actions/ratings';
import { useApplication } from '@/contexts/ApplicationContext';

type FormState = {
  name: string;
  playerPoints: number;
  teamWinPoints: number;
  teamParticipatedPoints: number;
  organizerPointsPerParticipant: number;
};

const INITIAL_FORM: FormState = {
  name: '',
  playerPoints: 0,
  teamWinPoints: 0,
  teamParticipatedPoints: 0,
  organizerPointsPerParticipant: 0,
};

export default function GameTypesTab() {
  const { isAdmin } = useApplication();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const {
    data: gameTypes = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['rating-game-types-admin'],
    queryFn: () => ratingsApi.getAdminRatingGameTypes(),
    enabled: isAdmin,
  });

  const addToast = (message: string, type: ToastMessage['type']) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await ratingsApi.createRatingGameType({
        name: form.name.trim(),
        playerPoints: form.playerPoints,
        teamWinPoints: form.teamWinPoints,
        teamParticipatedPoints: form.teamParticipatedPoints,
        organizerPointsPerParticipant: form.organizerPointsPerParticipant,
        isActive: true,
      });
      setForm(INITIAL_FORM);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['rating-game-types-admin'],
        }),
        queryClient.invalidateQueries({ queryKey: ['rating-game-types'] }),
      ]);
      addToast('Тип гри успішно створено', 'success');
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'Помилка при створенні типу гри',
        'error',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Toast messages={toasts} onRemove={removeToast} />
      <TabsNavigation />

      <div>
        <h2 className="text-2xl font-bold text-white">
          Типи ігор для рейтингу
        </h2>
      </div>

      {!isAdmin ? (
        <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-sm">
          У вас немає прав для керування типами ігор.
        </div>
      ) : (
        <>
          <form
            onSubmit={handleCreate}
            className="space-y-5 rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,107,0,0.08),transparent_42%),rgba(255,255,255,0.02)] p-4 sm:p-5"
          >
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">
                Створити новий тип гри
              </h3>
              <p className="text-xs text-gray-400">
                Заповніть параметри нарахування очок для нового сценарію гри.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 sm:gap-4">
              <label className="text-sm font-medium text-gray-200">
                Назва типу
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-white outline-none transition-[border-color,box-shadow,background-color] placeholder:text-gray-500 focus:border-(--color-primary)/60 focus:bg-black/55 focus:shadow-[0_0_0_3px_rgba(255,107,0,0.12)]"
                />
              </label>
              <label className="text-sm font-medium text-gray-200">
                Очки гравця
                <input
                  type="number"
                  min={0}
                  value={form.playerPoints}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      playerPoints: Number(e.target.value),
                    }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-white outline-none transition-[border-color,box-shadow,background-color] focus:border-(--color-primary)/60 focus:bg-black/55 focus:shadow-[0_0_0_3px_rgba(255,107,0,0.12)]"
                />
              </label>
              <label className="text-sm font-medium text-gray-200">
                Очки команди за ПЕРЕМОГУ у грі
                <input
                  type="number"
                  min={0}
                  value={form.teamWinPoints}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      teamWinPoints: Number(e.target.value),
                    }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-white outline-none transition-[border-color,box-shadow,background-color] focus:border-(--color-primary)/60 focus:bg-black/55 focus:shadow-[0_0_0_3px_rgba(255,107,0,0.12)]"
                />
              </label>
              <label className="text-sm font-medium text-gray-200">
                Очки команди за УЧАСТЬ у грі
                <input
                  type="number"
                  min={0}
                  value={form.teamParticipatedPoints}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      teamParticipatedPoints: Number(e.target.value),
                    }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-white outline-none transition-[border-color,box-shadow,background-color] focus:border-(--color-primary)/60 focus:bg-black/55 focus:shadow-[0_0_0_3px_rgba(255,107,0,0.12)]"
                />
              </label>
              <label className="text-sm font-medium text-gray-200 md:col-span-2">
                Очки організатора за 1 учасника
                <input
                  type="number"
                  min={0}
                  value={form.organizerPointsPerParticipant}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      organizerPointsPerParticipant: Number(e.target.value),
                    }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-white outline-none transition-[border-color,box-shadow,background-color] focus:border-(--color-primary)/60 focus:bg-black/55 focus:shadow-[0_0_0_3px_rgba(255,107,0,0.12)]"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-(--color-primary) px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-(--color-primary-hover) disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Створення...' : 'Створити тип гри'}
            </button>
          </form>

          <div className="p-4 border border-gray-800 rounded-xl bg-black/50">
            <h3 className="text-white font-semibold mb-3">
              Створені типи ігор
            </h3>

            {isLoading ? (
              <div className="flex items-center gap-2 text-gray-400">
                <LoadingSpinner size="sm" />
                Завантаження...
              </div>
            ) : error ? (
              <div className="text-red-400 text-sm">
                {error instanceof Error
                  ? error.message
                  : 'Помилка завантаження'}
              </div>
            ) : gameTypes.length === 0 ? (
              <div className="text-gray-400 text-sm">
                Поки що немає типів ігор.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm text-white">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400">
                      <th className="text-left py-2 px-2">Назва</th>
                      <th className="text-left py-2 px-2">Гравець</th>
                      <th className="text-left py-2 px-2">Перемога</th>
                      <th className="text-left py-2 px-2">Участь</th>
                      <th className="text-left py-2 px-2">Орг/уч</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gameTypes.map((item) => (
                      <tr key={item.id} className="border-b border-gray-900">
                        <td className="py-2 px-2">{item.name}</td>
                        <td className="py-2 px-2">{item.playerPoints}</td>
                        <td className="py-2 px-2">{item.teamWinPoints}</td>
                        <td className="py-2 px-2">
                          {item.teamParticipatedPoints}
                        </td>
                        <td className="py-2 px-2">
                          {item.organizerPointsPerParticipant}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
