
'use server';
import { NEXT_PUBLIC_API_URL, STATIC_API_KEY } from '@/utils/config';

export const getTeamsCount = async (searchQuery?: string): Promise<number> => {
  try {
    const url = new URL(`${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/teams`);
    if (searchQuery && searchQuery.trim()) {
      url.searchParams.set('searchQuery', searchQuery.trim());
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': STATIC_API_KEY, 
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error('Не вдалося отримати кількість команд');
    }

    const data = await response.json();
    return Array.isArray(data) ? data.length : 0;
  } catch (error) {
    console.error('Error fetching teams count:', error);
    return 0;
  }
};