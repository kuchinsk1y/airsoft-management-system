'use server';

import { getAuthToken } from '../utils/auth';
import { NEXT_PUBLIC_API_URL, STATIC_API_KEY } from '../utils/config';
import {
  EventResultResponse,
  LeaderboardQuery,
  LeaderboardResponse,
  OrganizerRatingResponse,
  PlayerRatingResponse,
  RatingTableRow,
  RatingType,
  ResRatingProps,
  TeamRatingResponse,
} from '@/interfaces';

type FetchResult<T> =
  | { ok: true; data: T; meta: ResRatingProps['meta'] }
  | { ok: false; message: string; status?: number };

const RATINGS_REVALIDATE_SECONDS = 60;
const USER_EVENT_RESULTS_CONCURRENCY = 4;

async function fetchApi(
  url: string,
  options: RequestInit = {},
  mode: 'public' | 'private' = 'public',
) {
  const token = mode === 'private' ? await getAuthToken() : null;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-api-key': STATIC_API_KEY,
    ...(mode === 'private' && token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const cacheOptions = { cache: 'no-store' as const };

  const response = await fetch(`${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}${url}`, {
    ...options,
    headers,
    ...cacheOptions,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json().catch(() => ({}));
}

// Event Results - Read-only access for web app
// All write operations (create, update, confirm, delete) are available only in admin app

export async function getEventResults(
  eventId: number,
): Promise<EventResultResponse[]> {
  return fetchApi(`/ratings/events/${eventId}/results`, {}, 'public');
}

export async function getEventResult(
  eventId: number,
  resultId: number,
): Promise<EventResultResponse> {
  return fetchApi(`/ratings/events/${eventId}/results/${resultId}`, {}, 'public');
}

// Player Ratings
export async function getPlayerLeaderboard(
  query?: LeaderboardQuery,
): Promise<LeaderboardResponse<PlayerRatingResponse>> {
  const params = new URLSearchParams();
  if (query?.limit !== undefined && query.limit !== null) {
    params.append('limit', query.limit.toString());
  }
  if (query?.offset !== undefined && query.offset !== null) {
    params.append('offset', query.offset.toString());
  }
  if (query?.sortBy) {
    params.append('sortBy', query.sortBy);
  }
  if (query?.order) {
    params.append('order', query.order);
  }
  if (query?.searchQuery) {
    params.append('search', query.searchQuery);
  }

  const queryString = params.toString();
  return fetchApi(`/ratings/players${queryString ? `?${queryString}` : ''}`, {}, 'public');
}

export async function getPlayerRating(
  userId: number,
): Promise<PlayerRatingResponse | null> {
  return fetchApi(`/ratings/players/${userId}`, {}, 'public');
}

export async function getMyPlayerRating(): Promise<PlayerRatingResponse | null> {
  return fetchApi('/ratings/players/me', {}, 'private');
}

// Get user's confirmed event results
export async function getUserEventResults(
  userId?: number,
): Promise<EventResultResponse[]> {
  if (!userId) {
    return [];
  }
  
  // Get all events first, then get results for each event
  // This is not optimal but works for now
  // TODO: Create dedicated endpoint for user's results
  try {
    const token = await getAuthToken();
    const eventsResponse = await fetch(
      `${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/events/user/my-events`,
      {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': STATIC_API_KEY,
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      },
    );
    
    if (!eventsResponse.ok) {
      return [];
    }
    
    const events = await eventsResponse.json();
    if (!Array.isArray(events)) {
      return [];
    }
    
    const eventIds = events
      .map((event) => Number(event?.id))
      .filter((eventId) => Number.isFinite(eventId));

    const chunks: number[][] = [];
    for (let i = 0; i < eventIds.length; i += USER_EVENT_RESULTS_CONCURRENCY) {
      chunks.push(eventIds.slice(i, i + USER_EVENT_RESULTS_CONCURRENCY));
    }

    const allResults: EventResultResponse[] = [];
    for (const chunk of chunks) {
      const settledChunk = await Promise.allSettled(
        chunk.map((eventId) => getEventResults(eventId)),
      );

      for (const settled of settledChunk) {
        if (settled.status !== 'fulfilled') {
          continue;
        }
        const userResults = settled.value.filter(
          (result) => result.userId === userId && result.status === 'CONFIRMED',
        );
        allResults.push(...userResults);
      }
    }

    return allResults;
  } catch {
    return [];
  }
}

// Team Ratings
export async function getTeamLeaderboard(
  query?: LeaderboardQuery,
): Promise<LeaderboardResponse<TeamRatingResponse>> {
  const params = new URLSearchParams();
  if (query?.limit !== undefined && query.limit !== null) {
    params.append('limit', query.limit.toString());
  }
  if (query?.offset !== undefined && query.offset !== null) {
    params.append('offset', query.offset.toString());
  }
  if (query?.sortBy) {
    params.append('sortBy', query.sortBy);
  }
  if (query?.order) {
    params.append('order', query.order);
  }
  if (query?.searchQuery) {
    params.append('search', query.searchQuery);
  }

  const queryString = params.toString();
  return fetchApi(`/ratings/teams${queryString ? `?${queryString}` : ''}`, {}, 'public');
}

export async function getTeamRating(
  teamId: number,
): Promise<TeamRatingResponse | null> {
  return fetchApi(`/ratings/teams/${teamId}`, {}, 'public');
}

export async function getOrganizerLeaderboard(
  query?: LeaderboardQuery,
): Promise<LeaderboardResponse<OrganizerRatingResponse>> {
  const params = new URLSearchParams();
  if (query?.limit !== undefined && query.limit !== null) {
    params.append('limit', query.limit.toString());
  }
  if (query?.offset !== undefined && query.offset !== null) {
    params.append('offset', query.offset.toString());
  }
  if (query?.sortBy) {
    params.append('sortBy', query.sortBy);
  }
  if (query?.order) {
    params.append('order', query.order);
  }
  if (query?.searchQuery) {
    params.append('search', query.searchQuery);
  }

  const queryString = params.toString();
  return fetchApi(
    `/ratings/organizers${queryString ? `?${queryString}` : ''}`,
    {},
    'public',
  );
}

export async function getTopRating({
  type,
  page = 1,
  limit,
  searchQuery,
}: {
  type: RatingType;
  page?: number;
  limit: number;
  searchQuery?: string;
}): Promise<FetchResult<RatingTableRow[]>> {
  try {
    const offset = Math.max(0, (page - 1) * limit);
    const result = await fetchApi(
      `/ratings/${type}?limit=${limit}&offset=${offset}&sortBy=totalPoints&order=desc${searchQuery ? `&search=${searchQuery}` : ''}`,
      {},
      'public',
    );

    const mappedItems: RatingTableRow[] = (result.items || []).map((item: any) => ({
      id: item.id ?? item.userId ?? item.teamId,
      logoUrl: item.logoUrl ?? '/TopLogo.svg',
      nickName: item.nickName !== undefined ? item.nickName : undefined,
      teamName: item.teamName ?? item.name,
      gamesPlayed: Number(item.gamesPlayed ?? item.gamesOrganized ?? 0),
      wins: Number(item.wins ?? 0),
      winRate: Number(item.winRate ?? 0),
      membersCount: Number(item.membersCount ?? 0),
      totalPoints: Number(item.totalPoints ?? 0),
      points: Number(item.points ?? 0),
      rank: item.rank !== undefined ? Number(item.rank) : undefined,
    }));

    return {
      ok: true,
      data: mappedItems,
      meta: {
        total: Number(result.total ?? 0),
        page,
        limit: Number(result.limit ?? limit),
        totalPages:
          Number(result.limit ?? limit) > 0
            ? Math.ceil(Number(result.total ?? 0) / Number(result.limit ?? limit))
            : 1,
      },
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : 'Невідома помилка мережі',
      status: 0,
    };
  }
}
