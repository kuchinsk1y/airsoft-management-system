'use server';

import { NewsItem, NewsListResponse } from '@/interfaces';
import { NEXT_PUBLIC_API_URL, STATIC_API_KEY } from '@/utils/config';

const API_BASE = NEXT_PUBLIC_API_URL.replace(/\/$/, '');


export async function getNewsList(filters?: {
  searchQuery?: string;
  limit?: number;
  offset?: number;
  category?: 'AIRSOFT' | 'STRIKESHOP';
}): Promise<NewsListResponse> {
  const url = new URL(`${API_BASE}/news`);

  if (filters?.searchQuery) url.searchParams.set('searchQuery', filters.searchQuery);
  if (filters?.limit !== undefined) url.searchParams.set('limit', String(filters.limit));
  if (filters?.offset !== undefined) url.searchParams.set('offset', String(filters.offset));
  if (filters?.category) url.searchParams.set('category', filters.category);

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
      items: itemsRaw,
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

export async function getNewsBySlug(slug: string): Promise<NewsItem | null> {
  const trimmed = slug.trim();
  if (!trimmed) return null;

  const response = await fetch(`${API_BASE}/news/${encodeURIComponent(trimmed)}`, {
    headers: {
      'x-api-key': STATIC_API_KEY,
    },
    cache: 'no-store',
  });

  if (!response.ok) return null;

  const data = await response.json();
  return data;
}

export async function getAdjacentNewsBySlug(
  slug: string,
  limit = 2,
): Promise<NewsItem[]> {
  const trimmed = slug.trim();
  if (!trimmed) return [];

  const safeLimit = Math.max(1, Math.min(limit, 10));

  try {
    const response = await fetch(
      `${API_BASE}/news/${encodeURIComponent(trimmed)}/adjacent?limit=${safeLimit}`,
      {
        headers: {
          'x-api-key': STATIC_API_KEY,
        },
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const previous = Array.isArray(data?.previous) ? data.previous : [];
    const next = Array.isArray(data?.next) ? data.next : [];

    const ordered = [...previous.slice().reverse(), ...next];
    const deduped = ordered.filter(
      (item, index, array) =>
        item?.slug &&
        item.slug !== trimmed &&
        array.findIndex((candidate) => candidate?.slug === item.slug) === index,
    );

    return deduped.slice(0, safeLimit * 2);
  } catch {
    return [];
  }
}