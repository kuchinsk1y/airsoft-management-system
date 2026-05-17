import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { getProfileBootstrap } from '@/actions/user';
import { User } from '@/interfaces';

export interface UserWithStats extends User {
  avatarUrl: string;
  location: string;
  joined: string;
  hasCreatedGames: boolean;
  team?: string;
  teamId?: number;
  stats: Array<{
    label: string;
    value: string | number;
    icon: string;
  }>;
  rank?: string;
}

export const useUserStore = create(
  combine(
    {
      currentUser: null as UserWithStats | null,
      isLoading: true,
      profileFetchedAt: null as number | null,
    },

    (set, get) => ({
      resetProfile: () => {
        set({
          currentUser: null,
          isLoading: false,
          profileFetchedAt: null,
        });
      },
      fetchUser: async (force = false) => {
        const { currentUser, profileFetchedAt } = get();
        const now = Date.now();
        const PROFILE_CACHE_TTL_MS = 60_000;

        if (
          !force &&
          currentUser &&
          profileFetchedAt &&
          now - profileFetchedAt < PROFILE_CACHE_TTL_MS
        ) {
          set({ isLoading: false });
          return;
        }

        set({ isLoading: true });
        try {
          const { user: result, team: currentTeam, hasCreatedGames, rating } =
            await getProfileBootstrap();

          if (result) {
            // Всегда формируем статистику из реальных данных рейтинга или нулей
            const stats = [
              {
                label: 'Ігор зіграно',
                value: rating?.gamesPlayed ?? 0,
                icon: 'Target',
              },
              {
                label: 'Перемоги',
                value: rating?.wins ?? 0,
                icon: 'Trophy',
              },
            ];

            const user: UserWithStats = {
              ...result,
              team: currentTeam?.name,
              teamId: currentTeam?.id,
              avatarUrl: result.logoUrl?.trim() || '',
              location:
                result.city && result.country
                  ? `${result.city}, ${result.country}`
                  : result.city || result.country || '—',
              joined: result.createdAt
                ? new Date(result.createdAt).toISOString()
                : new Date().toISOString(),
              hasCreatedGames,
              stats,
              rank: rating?.rank ? `#${rating.rank}` : undefined,
            };

            set({ currentUser: user, profileFetchedAt: Date.now() });
          } else {
            set({ currentUser: null, profileFetchedAt: Date.now() });
          }
        } catch (error) {
          console.error('Помилка завантаження:', error);
          set({ currentUser: null, profileFetchedAt: Date.now() });
        } finally {
          set({ isLoading: false });
        }
      },
    }),
  ),
);
