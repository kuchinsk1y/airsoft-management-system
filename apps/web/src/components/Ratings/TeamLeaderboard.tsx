'use client';

import { useEffect, useState } from 'react';
import { getTeamLeaderboard } from '@/actions/ratings';
import Image from 'next/image';
import {
  LeaderboardQuery,
  LeaderboardResponse,
  TeamRatingResponse,
} from '@/interfaces';
import { truncateName } from '@/utils/truncateName';
import Loader from '../generics/loader/Loader';

interface TeamLeaderboardProps {
  initialQuery?: LeaderboardQuery;
  initialData?: LeaderboardResponse<TeamRatingResponse>;
}

export default function TeamLeaderboard({
  initialQuery = {},
  initialData,
}: TeamLeaderboardProps) {
  const noRatingsMessage = 'Рейтингів ще немає, але скоро будуть.';
  const [data, setData] = useState<LeaderboardResponse<TeamRatingResponse> | null>(initialData ?? null);
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
        const result = await getTeamLeaderboard(query);
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
    return (
      <Loader text="Йде завантаження команд..." />
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-gray-400">{noRatingsMessage}</div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="py-8 text-center text-gray-400">
        {noRatingsMessage}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="">
        <table className="w-full border-collapse text-center text-sm min1127:text-base min1441:text-xl font-semibold text-white">
          <thead>
            <tr className="border-b border-[#262626] ">
              <th className=" w-10 pr-2 py-3 text-left min650:px-4  ">
                Місце
              </th>
              <th className="px-1 py-3 min650:text-left">
                Команда
              </th>
              <th className="px-1 py-3">
                Ігор
              </th>
              <th className="px-1 py-3">
                Очок
              </th>
            </tr>
          </thead>
          <tbody className='text-center uppercase text-[12px] min1127:text-lg min1441:text-2xl text-white font-semibold'>
            {data.items.map((team, index) => (
              <tr
                key={team.teamId}
                className="border-b border-[#262626]"
              >
                <td className="pr-1 pl-2 py-3 text-left min650:pl-5">
                  {index + 1}
                </td>
                <td className="px-1 py-3">
                  <div className="flex flex-col min650:flex-row items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      <Image
                        src={team.logoUrl || '/team-logo-avatar.png'}
                        alt={team.name}
                        title={team.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                        sizes="40px"
                      />
                    </div>
                    <span className="uppercase whitespace-nowrap">
                     {truncateName(team.name)} 
                    </span>
                  </div>
                </td>
                <td className="px-1 py-3 ">
                  {team.gamesPlayed}
                </td>
                <td className="px-1 py-3 text-[#FF4D1C]">
                  {team.totalPoints}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
