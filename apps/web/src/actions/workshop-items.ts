'use server';

import { WorkshopItem, WorkshopItemListResponse } from '@/interfaces';
import { NEXT_PUBLIC_API_URL, STATIC_API_KEY } from '@/utils/config';

const API_BASE = NEXT_PUBLIC_API_URL.replace(/\/$/, '');

export async function getWorkshopItemList(filters?: {
  searchQuery?: string;
  limit?: number;
  offset?: number;
  category?: 'SERVICES' | 'SUPPORT';
}): Promise<WorkshopItemListResponse> {
  const url = new URL(`${API_BASE}/workshop-items`);

  if (filters?.searchQuery) {
    url.searchParams.set('searchQuery', filters.searchQuery);
  }
  if (filters?.limit !== undefined) {
    url.searchParams.set('limit', String(filters.limit));
  }
  if (filters?.offset !== undefined) {
    url.searchParams.set('offset', String(filters.offset));
  }
  if (filters?.category) {
    url.searchParams.set('category', filters.category);
  }

  try {
    const response = await fetch(url, {
      headers: {
        'x-api-key': STATIC_API_KEY,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        items: [],
        total: 0,
        limit: filters?.limit ?? 0,
        offset: filters?.offset ?? 0,
      };
    }

    const data = await response.json();
    const itemsRaw = Array.isArray(data?.items) ? data.items : [];

    return {
      items: itemsRaw as WorkshopItem[],
      total: Number(data?.total ?? itemsRaw.length ?? 0),
      limit: Number(data?.limit ?? filters?.limit ?? itemsRaw.length ?? 0),
      offset: Number(data?.offset ?? filters?.offset ?? 0),
    };
  } catch {
    return {
      items: [],
      total: 0,
      limit: filters?.limit ?? 0,
      offset: filters?.offset ?? 0,
    };
  }
}

export async function getWorkshopItemBySlug(
  slug: string,
): Promise<WorkshopItem | null> {
  const trimmed = slug.trim();
  if (!trimmed) {
    return null;
  }

  const response = await fetch(
    `${API_BASE}/workshop-items/${encodeURIComponent(trimmed)}`,
    {
      headers: {
        'x-api-key': STATIC_API_KEY,
      },
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data as WorkshopItem;
}
