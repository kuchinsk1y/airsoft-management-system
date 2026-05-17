'use server';

import type { Comment } from '@/interfaces';
import { NEXT_PUBLIC_API_URL, STATIC_API_KEY } from '@/utils/config';
import { getAuthToken } from '@/utils/auth';

const RANDOM_COMMENTS_REVALIDATE_SECONDS = 30;
type CommentScope = 'EVENT' | 'COMPANY';

export const getEventComments = async (eventId: number): Promise<Comment[]> => {
  try {
    const response = await fetch(
      `${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/comments?eventId=${eventId}`,
      {
        cache: 'no-store',
        headers: { 'x-api-key': STATIC_API_KEY },
      },
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const getRandomComments = async (limit: number = 9): Promise<Comment[]> => {
  try {
    const response = await fetch(
      `${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/comments?random=true&limit=${limit}`,
      {
        next: { revalidate: RANDOM_COMMENTS_REVALIDATE_SECONDS },
        headers: { 'x-api-key': STATIC_API_KEY },
      },
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const getRandomCommentsByScope = async (
  scope: CommentScope,
  limit: number = 9,
): Promise<Comment[]> => {
  try {
    const response = await fetch(
      `${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/comments?random=true&scope=${scope}&limit=${limit}`,
      {
        next: { revalidate: RANDOM_COMMENTS_REVALIDATE_SECONDS },
        headers: { 'x-api-key': STATIC_API_KEY },
      },
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const getMyComments = async (scope?: CommentScope): Promise<Comment[]> => {
  try {
    const token = await getAuthToken();

    if (!token) {
      return [];
    }

    const query = scope ? `?scope=${scope}` : '';
    const response = await fetch(
      `${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/comments/my${query}`,
      {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-api-key': STATIC_API_KEY,
        },
      },
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const createComment = async (
  eventId: number | undefined,
  message: string,
): Promise<Comment> => {
  try {
    const token = await getAuthToken();

    if (!token) {
      throw new Error('Необхідно увійти в систему');
    }

    const response = await fetch(
      `${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/comments`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-api-key': STATIC_API_KEY,
        },
        body: JSON.stringify({ eventId, message }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Помилка при створенні коментаря' }));
      throw new Error(errorData.message || 'Помилка при створенні коментаря');
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Помилка при створенні коментаря');
  }
};

export const createCompanyComment = async (message: string): Promise<Comment> => {
  return createComment(undefined, message);
};

