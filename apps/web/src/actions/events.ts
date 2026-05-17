'use server';

import type { Event, EventGalleryItem, EventsFilters, EventsRequest } from '@/interfaces';
import { getAuthToken } from '@/utils/auth';
import { NEXT_PUBLIC_API_URL, STATIC_API_KEY } from '@/utils/config';

const EVENTS_REVALIDATE_SECONDS = 15;

export const getEvents = async (filters?: EventsFilters): Promise<Event[]> => {
  try {
    const url = new URL(`${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/events`);

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(url, {
      next: { revalidate: EVENTS_REVALIDATE_SECONDS },
      headers: { 'x-api-key': STATIC_API_KEY },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const getEvent = async (id: number): Promise<Event | null> => {
  try {
    const response = await fetch(
      `${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/events/${id}`,
      {
        next: { revalidate: EVENTS_REVALIDATE_SECONDS },
        headers: { 'x-api-key': STATIC_API_KEY },
      },
    );

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
};

export const updateEvent = async (
  id: number,
  data: Partial<EventsRequest>,
): Promise<Event | null> => {
  try {
    const response = await fetch(
      `${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/events/${id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': STATIC_API_KEY,
        },
        body: JSON.stringify(data),
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
};

export const getEventGallery = async (eventId: number): Promise<EventGalleryItem[]> => {
  try {
    const response = await fetch(`${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/events/${eventId}/gallery`,
      {
        next: { revalidate: EVENTS_REVALIDATE_SECONDS },
        headers: { 'x-api-key': STATIC_API_KEY },
      },
    );

    if (!response.ok) return []

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export const getUserEvents = async (): Promise<Event[]> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      return [];
    }

    const response = await fetch(
      `${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/events/user/my-events`,
      {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
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

export type MyEventRegistrationStatus = {
  isRegistered: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | null;
};

export const getMyEventRegistrationStatus = async (
  eventId: number,
): Promise<MyEventRegistrationStatus> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { isRegistered: false, status: null };
    }

    const response = await fetch(
      `${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/events/${eventId}/my-registration-status`,
      {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-api-key': STATIC_API_KEY,
        },
      },
    );

    if (!response.ok) {
      return { isRegistered: false, status: null };
    }

    const data = (await response.json()) as Partial<MyEventRegistrationStatus>;
    return {
      isRegistered: Boolean(data?.isRegistered),
      status: data?.status ?? null,
    };
  } catch {
    return { isRegistered: false, status: null };
  }
};

export type CancelEventRegistrationResult =
  | { ok: true }
  | { ok: false; error: string };

export async function cancelEventRegistration(
  eventId: number,
): Promise<CancelEventRegistrationResult> {
  const token = await getAuthToken();
  if (!token) {
    return { ok: false, error: 'Потрібна авторизація' };
  }

  try {
    const response = await fetch(
      `${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/events/${eventId}/cancel-my-registration`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-api-key': STATIC_API_KEY,
        },
      },
    );

    const body = await response.json().catch(() => ({}));
    const msg =
      (body && typeof body.message === 'string' ? body.message : null) ||
      'Не вдалося скасувати участь';

    if (!response.ok) {
      if (msg === 'ALREADY_CANCELLED') {
        return { ok: false, error: 'Участь вже скасована' };
      }
      if (msg === 'REGISTRATION_NOT_FOUND') {
        return { ok: false, error: 'Реєстрацію не знайдено' };
      }
      return { ok: false, error: msg };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: 'Помилка мережі. Спробуйте ще раз.' };
  }
}

