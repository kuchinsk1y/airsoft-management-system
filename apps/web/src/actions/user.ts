'use server';

import { User } from '@/interfaces';
import { requireAuth } from '@/utils/auth';
import { NEXT_PUBLIC_API_URL, STATIC_API_KEY } from '@/utils/config';

type ProfileBootstrapData = {
  user: User | null;
  team: { id: number; name: string } | null;
  hasCreatedGames: boolean;
  rating: {
    gamesPlayed?: number;
    wins?: number;
    accuracy?: number | null;
    kdRatio?: number | null;
    rank?: number | null;
  } | null;
};

export const getUser = async (): Promise<User | null> => {
  try {
    const token = await requireAuth();

    const response = await fetch(`${NEXT_PUBLIC_API_URL}/users`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
};

export const getProfileBootstrap = async (): Promise<ProfileBootstrapData> => {
  try {
    const token = await requireAuth();
    const apiBase = NEXT_PUBLIC_API_URL.replace(/\/$/, '');

    const [userRes, teamsRes, ratingRes, organizerEventsRes] = await Promise.all([
      fetch(`${apiBase}/users`, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }),
      fetch(`${apiBase}/teams?myTeam=true`, {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-api-key': STATIC_API_KEY,
        },
      }),
      fetch(`${apiBase}/ratings/players/me`, {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-api-key': STATIC_API_KEY,
        },
      }),
      // For non-admin users, /events returns events for their own application.
      fetch(`${apiBase}/events`, {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-api-key': STATIC_API_KEY,
        },
      }),
    ]);

    const user = userRes.ok ? ((await userRes.json()) as User) : null;

    const teamsRaw = teamsRes.ok ? await teamsRes.json().catch(() => []) : [];
    const firstTeam = Array.isArray(teamsRaw) && teamsRaw.length > 0
      ? teamsRaw[0]
      : null;
    const team = firstTeam
      ? {
          id: Number(firstTeam.id),
          name: String(firstTeam.name ?? ''),
        }
      : null;

    const rating = ratingRes.ok
      ? await ratingRes.json().catch(() => null)
      : null;

    const organizerEventsRaw = organizerEventsRes.ok
      ? await organizerEventsRes.json().catch(() => [])
      : [];

    const hasCreatedGames =
      Array.isArray(organizerEventsRaw) && organizerEventsRaw.length > 0;

    return { user, team, hasCreatedGames, rating };
  } catch {
    return { user: null, team: null, hasCreatedGames: false, rating: null };
  }
};

export const updateUser = async (
  data: Partial<{
    fullName?: string;
    dateOfBirth?: string;
    phoneNumber?: string;
    country?: string;
    region?: string;
    city?: string;
  }>,
): Promise<User | null> => {
  try {
    const token = await requireAuth();

    const response = await fetch(`${NEXT_PUBLIC_API_URL}/users`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
};

export type UserSearchResult = {
  id: number;
  nickName: string;
  fullName?: string | null;
  logoUrl?: string | null;
};

export async function searchUsersByNickName(
  nickName: string,
): Promise<UserSearchResult[]> {
  const token = await requireAuth();
  const query = nickName.trim();
  if (query.length < 2) {
    return [];
  }

  const apiBase = NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  const res = await fetch(
    `${apiBase}/users/search?nickName=${encodeURIComponent(query)}`,
    {
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-api-key': STATIC_API_KEY,
      },
    },
  );

  if (!res.ok) {
    return [];
  }

  const data = await res.json().catch(() => null);
  return Array.isArray(data) ? (data as UserSearchResult[]) : [];
}
