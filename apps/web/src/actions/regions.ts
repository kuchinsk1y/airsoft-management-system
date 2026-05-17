'use server';

import { NEXT_PUBLIC_API_URL, STATIC_API_KEY } from '@/utils/config';
import type { FaqItem } from '@/interfaces';

export interface Region {
  id: number;
  name: string;
  slug: string;
  seoText?: string | null;
  seoFaq?: FaqItem[] | null;
}

const BASE = () => NEXT_PUBLIC_API_URL.replace(/\/$/, '');

export const getRegionsWithEvents = async (): Promise<Region[]> => {
  try {
    const response = await fetch(`${BASE()}/regions?hasEvents=true`, {
      cache: 'no-store',
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

export const getAllRegions = async (): Promise<Region[]> => {
  try {
    const response = await fetch(`${BASE()}/regions`, {
      cache: 'no-store',
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

export const getRegionBySlug = async (slug: string): Promise<Region | null> => {
  try {
    const response = await fetch(`${BASE()}/regions?slug=${encodeURIComponent(slug)}`, {
      cache: 'no-store',
      headers: { 'x-api-key': STATIC_API_KEY },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data && !Array.isArray(data) ? (data as Region) : null;
  } catch {
    return null;
  }
};
