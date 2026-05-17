'use server';

import { NEXT_PUBLIC_API_URL, STATIC_API_KEY } from '@/utils/config';

type GalleryCompanyPhotoApi = {
  id: number;
  url: string;
  createdAt: string;
  source: 'COMPANY';
};

type GalleryEventPhotoApi = {
  id: number;
  url: string;
  createdAt: string;
  source: 'EVENT';
  event: {
    id: number;
    name: string;
    citySlug: string;
    cityName: string;
  };
};

export type GalleryCompanyPhoto = {
  id: number;
  url: string;
  createdAt: string;
  source: 'COMPANY';
};

export type GalleryEventPhoto = {
  id: number;
  url: string;
  createdAt: string;
  source: 'EVENT';
  event: {
    id: number;
    name: string;
    citySlug: string;
    cityName: string;
  };
};

export async function getCompanyGalleryPhotos(): Promise<GalleryCompanyPhoto[]> {
  try {
    const response = await fetch(
      `${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/gallery/company`,
      {
        cache: 'no-store',
        headers: { 'x-api-key': STATIC_API_KEY },
      },
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const items = Array.isArray(data) ? data : [];

    return items
      .filter((item): item is GalleryCompanyPhotoApi => Boolean(item?.id && item?.url))
      .map((item) => ({
        id: item.id,
        url: item.url,
        createdAt: item.createdAt,
        source: 'COMPANY',
      }));
  } catch {
    return [];
  }
}

export async function getEventGalleryPhotos(limit = 500): Promise<GalleryEventPhoto[]> {
  try {
    const url = new URL(`${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/gallery/events`);
    url.searchParams.set('limit', String(limit));

    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'x-api-key': STATIC_API_KEY },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const items = Array.isArray(data) ? data : [];

    return items
      .filter(
        (item): item is GalleryEventPhotoApi =>
          Boolean(item?.id && item?.url && item?.event?.id && item?.event?.name),
      )
      .map((item) => ({
        id: item.id,
        url: item.url,
        createdAt: item.createdAt,
        source: 'EVENT',
        event: item.event,
      }));
  } catch {
    return [];
  }
}
