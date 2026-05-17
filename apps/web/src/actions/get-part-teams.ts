
'use server';

import { ItemTeamProps } from '@/interfaces';
import { NEXT_PUBLIC_API_URL, STATIC_API_KEY } from "@/utils/config";

function toItemTeam(team: any): ItemTeamProps | null {
  const id = Number(team?.id);
  const name = typeof team?.name === 'string' ? team.name : '';
  if (!id || !name) return null;

  const membersCount = Array.isArray(team?.members) ? team.members.length : 0;
  const rating = Math.max(1, Math.min(999, membersCount * 10 + name.length * 3));

  return {
    id,
    name,
    rating,
    teamMember: membersCount,
    logoUrl: team?.logoUrl || '/TopLogo.svg',
  };
}

export const getPartTeams = async (
  page: number = 1,
  limit: number = 8,
  searchQuery?: string,
): Promise<ItemTeamProps[]> => {
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
      next: { revalidate: 0 },
    });

    if (response.ok) {
      const all = await response.json();
      const listRaw: any[] = Array.isArray(all) ? all : [];
      const list: ItemTeamProps[] = listRaw
        .map(toItemTeam)
        .filter(Boolean) as ItemTeamProps[];
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      return list.slice(startIndex, endIndex);
    }
    
    throw new Error(`API returned ${response.status}`);

  } catch (error) {
    console.warn('Не вдалося отримати команди. Error:', error);
    return [];
  }
};