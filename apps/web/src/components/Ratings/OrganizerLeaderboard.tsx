'use client';

import { useEffect, useState } from 'react';
import { getOrganizerLeaderboard } from '@/actions/ratings';
import Image from 'next/image';
import {
  LeaderboardQuery,
  LeaderboardResponse,
  OrganizerRatingResponse,
} from '@/interfaces';
import Loader from '../generics/loader/Loader';
import { truncateName } from '@/utils/truncateName';

interface OrganizerLeaderboardProps {
  initialQuery?: LeaderboardQuery;
  initialData?: LeaderboardResponse<OrganizerRatingResponse>;
}

export default function OrganizerLeaderboard({
  initialQuery = {},
  initialData,
}: OrganizerLeaderboardProps) {
  const noRatingsMessage = 'Рейтингів ще немає, але скоро будуть.';
  const [data, setData] = useState<LeaderboardResponse<OrganizerRatingResponse> | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [query] = useState<LeaderboardQuery>({
    limit: 50,
    offset: 0,
    sortBy: 'totalPoints',
    order: 'desc',
    ...initialQuery,
  });

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setLoading(false);
      return;
    }

    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getOrganizerLeaderboard(query);
        if (!mounted) return;
        setData(result);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Помилка при завантаженні рейтингу');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [initialData, query]);

  if (loading) {
    return <Loader text="Йде завантаження організаторів..." />;
  }

  if (error) {
    return (
      <div className="py-8 text-center text-gray-400">{noRatingsMessage}</div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="py-8 text-center text-gray-400">{noRatingsMessage}</div>
    );
  }

  return (
    <div className="w-full">
      <table className="w-full border-collapse text-center text-sm min1127:text-base min1441:text-xl font-semibold text-white">
        <thead>
          <tr className="border-b border-[#262626]">
            <th className="w-10 pr-2 py-3 text-left min650:px-4">Місце</th>
            <th className="px-1 py-3 min650:text-left">Організатор</th>
            <th className="px-1 py-3">Ігор</th>
            <th className="px-1 py-3">Очок</th>
          </tr>
        </thead>
        <tbody className="text-center uppercase text-[12px] min1127:text-lg min1441:text-2xl text-white font-semibold">
          {data.items.map((organizer, index) => (
            <tr key={organizer.userId} className="border-b border-[#262626]">
              <td className="pr-1 pl-2 py-3 text-left min650:pl-5">{index + 1}</td>
              <td className="px-1 py-3">
                <div className="flex flex-col min650:flex-row items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <Image
                      src={organizer.logoUrl || '/team-logo-avatar.png'}
                      alt={organizer.nickName}
                      title={organizer.nickName}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                      sizes="40px"
                    />
                  </div>
                  <span className="uppercase whitespace-nowrap">
                    {truncateName(organizer.nickName)}
                  </span>
                </div>
              </td>
              <td className="px-1 py-3">{organizer.gamesOrganized}</td>
              <td className="px-1 py-3 text-[#FF4D1C]">{organizer.totalPoints}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
