'use server';

import { getAuthToken } from '@/app/auth/server-utils';
import { NEXT_PUBLIC_API_KEY, NEXT_PUBLIC_API_URL } from '@/app/utils/config';

const API_URL = NEXT_PUBLIC_API_URL.replace(/\/$/, '');
const API_KEY = NEXT_PUBLIC_API_KEY;

if (!API_URL || !API_KEY) {
  throw new Error(
    'Missing required environment variables: NEXT_PUBLIC_API_URL or NEXT_PUBLIC_API_KEY',
  );
}

export interface EventResultRequest {
  eventId: number;
  userId?: number;
  teamId?: number;
  placement: 'FIRST' | 'SECOND' | 'THIRD' | 'PARTICIPATED';
  points?: number;
  kills?: number;
  deaths?: number;
  accuracy?: number;
}

export interface EventResultResponse {
  id: number;
  eventId: number;
  userId?: number;
  teamId?: number;
  sideId?: number;
  outcome?: 'WIN' | 'PARTICIPATED';
  placement: string;
  points: number;
  kills?: number;
  deaths?: number;
  accuracy?: number;
  status: string;
  confirmedAt?: string;
  confirmedBy?: number;
  createdAt: string;
  updatedAt: string;
  event?: {
    id: number;
    name: string;
    competitionType: string;
  };
  user?: {
    id: number;
    nickName: string;
    logoUrl?: string;
  };
  team?: {
    id: number;
    name: string;
    logoUrl?: string;
  };
  side?: {
    id: number;
    name: string;
  };
}

export interface RatingGameType {
  id: number;
  name: string;
  playerPoints: number;
  teamWinPoints: number;
  teamParticipatedPoints: number;
  organizerPointsPerParticipant: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompleteEventWithRatingsPayload {
  actualParticipants: number;
  outcomes: Array<{
    sideId?: number;
    teamId?: number;
    outcome: 'WIN' | 'PARTICIPATED';
  }>;
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Не авторизовані');
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Unknown error',
    }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Создать результат события
 */
export async function createEventResult(
  eventId: number,
  data: EventResultRequest,
): Promise<EventResultResponse> {
  try {
    return await fetchWithAuth(`/ratings/events/${eventId}/results`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('Failed to create event result:', error);
    throw error;
  }
}

/**
 * Получить результаты события
 */
export async function getEventResults(
  eventId: number,
): Promise<EventResultResponse[]> {
  try {
    return await fetchWithAuth(`/ratings/events/${eventId}/results`);
  } catch (error) {
    console.error('Failed to get event results:', error);
    throw error;
  }
}

/**
 * Получить результат события по ID
 */
export async function getEventResult(
  eventId: number,
  resultId: number,
): Promise<EventResultResponse> {
  try {
    return await fetchWithAuth(
      `/ratings/events/${eventId}/results/${resultId}`,
    );
  } catch (error) {
    console.error('Failed to get event result:', error);
    throw error;
  }
}

/**
 * Обновить результат события
 */
export async function updateEventResult(
  eventId: number,
  resultId: number,
  data: Partial<EventResultRequest>,
): Promise<EventResultResponse> {
  try {
    return await fetchWithAuth(`/ratings/events/${eventId}/results/${resultId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('Failed to update event result:', error);
    throw error;
  }
}

/**
 * Подтвердить результат события
 */
export async function confirmEventResult(
  eventId: number,
  resultId: number,
): Promise<EventResultResponse> {
  try {
    return await fetchWithAuth(
      `/ratings/events/${eventId}/results/${resultId}/confirm`,
      {
        method: 'POST',
      },
    );
  } catch (error) {
    console.error('Failed to confirm event result:', error);
    throw error;
  }
}

/**
 * Удалить результат события
 */
export async function deleteEventResult(
  eventId: number,
  resultId: number,
): Promise<void> {
  try {
    await fetchWithAuth(`/ratings/events/${eventId}/results/${resultId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Failed to delete event result:', error);
    throw error;
  }
}

export async function getRatingGameTypes(): Promise<RatingGameType[]> {
  try {
    return await fetchWithAuth('/ratings/game-types');
  } catch (error) {
    console.error('Failed to get rating game types:', error);
    throw error;
  }
}

export async function getAdminRatingGameTypes(): Promise<RatingGameType[]> {
  try {
    return await fetchWithAuth('/ratings/admin/game-types');
  } catch (error) {
    console.error('Failed to get admin rating game types:', error);
    throw error;
  }
}

export async function createRatingGameType(
  data: Omit<RatingGameType, 'id'>,
): Promise<RatingGameType> {
  try {
    return await fetchWithAuth('/ratings/admin/game-types', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('Failed to create rating game type:', error);
    throw error;
  }
}

export async function completeEventWithRatings(
  eventId: number,
  data: CompleteEventWithRatingsPayload,
) {
  try {
    return await fetchWithAuth(`/ratings/events/${eventId}/complete-with-ratings`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('Failed to complete event with ratings:', error);
    throw error;
  }
}
