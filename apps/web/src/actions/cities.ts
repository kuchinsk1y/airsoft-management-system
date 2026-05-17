'use server';

import type { City } from '@/interfaces';
import { NEXT_PUBLIC_API_URL, STATIC_API_KEY } from '@/utils/config';

const BASE = () => NEXT_PUBLIC_API_URL.replace(/\/$/, '');

export const getCities = async (regionSlug?: string): Promise<City[]> => {
  try {
    const url = regionSlug
      ? `${BASE()}/cities?regionSlug=${encodeURIComponent(regionSlug)}`
      : `${BASE()}/cities`;
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'x-api-key': STATIC_API_KEY },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [data];
  } catch {
    return [];
  }
};

export const getCityBySlug = async (slug: string): Promise<City | null> => {
  try {
    const response = await fetch(
      `${BASE()}/cities?slug=${encodeURIComponent(slug)}`,
      {
        cache: 'no-store',
        headers: { 'x-api-key': STATIC_API_KEY },
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data && !Array.isArray(data) ? (data as City) : null;
  } catch {
    return null;
  }
};
