'use client';

import TitleBlock from '@/components/TitleBlock/TitleBlock';
import { useEffect, useState } from 'react';
import PaginationTeamList from '@/components/MyTeam/PaginationTeamList';
import OnInput from '@/components/generics/on-input/OnInput';
import Image from 'next/image';
import {
  RatingGenericPageProps,
  RatingTableRow,
  RatingType,
} from '@/interfaces';
import { usePathname } from 'next/navigation';
import { getTopRating } from '@/actions/ratings';
import { truncateName } from '@/utils/truncateName';
import Loader from '@/components/generics/loader/Loader';

function scrollUp() {
  window.scrollTo({ top: 270, behavior: 'smooth' });
}

export default function RatingGenericPage({
  title,
  placeholder = 'Пошук',
  path,
}: RatingGenericPageProps) {
  const pathName = usePathname()?.split('/').at(-1);
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<RatingTableRow[]>([]);
  const [responsivePerPage, setResponsivePerPage] = useState(10);
  const [total, setTotal] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        const ratingType: RatingType =
          pathName === 'teams-rating'
            ? 'teams'
            : pathName === 'organizers-rating'
              ? 'organizers'
              : 'players';

        const result = await getTopRating({
          type: ratingType,
          page: currentPage,
          limit: responsivePerPage,
          searchQuery: searchQuery,
        });

        if (!result.ok) {
          throw new Error(result.message || 'Помилка при завантаженні даних');
        }
        setData(result.data);
        setTotal(result.meta?.total ?? result.data.length);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : 'Невідома помилка мережі',
        );
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [currentPage, responsivePerPage, pathName, searchQuery]);

  useEffect(() => {
    const updatePerPage = () => {
      if (window.innerWidth < 991) {
        setResponsivePerPage(10);
      } else {
        setResponsivePerPage(20);
      }
    };
    updatePerPage();
    window.addEventListener('resize', updatePerPage);
    return () => window.removeEventListener('resize', updatePerPage);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / responsivePerPage));
  const isPlayersPage = pathName === 'players-rating';
  const isOrganizersPage = pathName === 'organizers-rating';

  return (
    <div className=" relative border-b border-white">
      <TitleBlock
        title={title}
        path={path ?? []}
        className="px-5 py-5 min991:px-8 min991:py-8 flex-col gap-3 min991:gap-5"
        titleClassName="text-white text-4xl leading-[120%] min991:text-6xl min991:leading-[100%]"
        breadcrumbClassName="text-[10px] min991:text-xs"
      />
      <OnInput
        onResults={(searchValue) => {
          if (searchValue.trim().length < 2) {
            setSearchQuery('');
            return;
          }
          setSearchQuery(searchValue.trim());
          setCurrentPage(1);
        }}
        placeholder={placeholder}
      />

      <div className="relative w-full overflow-x-auto ">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-white text-[12px] min650:text-sm min991:text-base min1127:text-lg min1441:text-xl text-white">
              <th className="w-12 pl-2 pr-1 min650:pl-5 py-3 text-left">
                Місце
              </th>
              <th className="px-1 py-3 min650:text-left ">
                {isPlayersPage ? 'Гравець' : isOrganizersPage ? 'Організатор' : 'Команда'}
              </th>
              <th className="px-1 py-3 text-center ">Ігор</th>
              <th className="px-1 py-3 text-center ">Очок</th>
            </tr>
          </thead>
          <tbody className="text-sm min650:text-base min991:text-lg min1127:text-xl min1441:text-2xl font-semibold text-white whitespace-nowrap">
            {data.map((item, index) => (
              <tr
                key={`${item.id}-${index}`}
                className="border-b border-[white]"
              >
                <td className="w-12 pl-3 pr-1 py-3 min650:pl-8">{item.rank}</td>
                <td className="px-1 py-3">
                  <div className="flex flex-col min650:flex-row items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      <Image
                        src={item.logoUrl || '/team-logo-avatar.png'}
                        alt={item.nickName || item.teamName || 'avatar'}
                        title={item.nickName || item.teamName || 'avatar'}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                        sizes="40px"
                      />
                    </div>
                    <span className="text-[12px] min650:text-sm uppercase">
                      {truncateName(
                        isPlayersPage || isOrganizersPage
                          ? item.nickName || ''
                          : item.teamName || '',
                      )}
                    </span>
                  </div>
                </td>
                <td className="px-1 py-3 text-center ">
                  {item.gamesPlayed ?? 0}
                </td>
                <td className="px-1 py-3 text-center text-sm min650:text-base min991:text-lg min1127:text-xl min1441:text-2xl font-semibold text-[#FF4D1C]">
                  {item.totalPoints ?? item.points ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          {isLoading && (
        <div className="absolute inset-0 flex justify-center bg-black/50 backdrop-blur-[1px]">
          <Loader />
        </div>
      )}
      </div>
    
      {error && <div className="text-red-500 text-center py-4">{error}</div>}

      {!data.length && searchQuery && !isLoading ? (
        <div className="flex justify-center whitespace-nowrap text-basu min991:text-2xl text-gray-400 pt-8 pb-8">{`Немає${
          pathName === 'players-rating'
            ? ' гравця '
            : pathName === 'organizers-rating'
              ? ' організатора '
              : ' команди'
        } з ${
          pathName === 'players-rating' || pathName === 'organizers-rating'
            ? 'нікнеймом'
            : 'назвою'
        } "${truncateName(searchQuery.toLocaleUpperCase(), 15)}"`}</div>
      ) : (
        <div className="flex justify-center py-5 min991:py-8">
          <PaginationTeamList
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              scrollUp();
            }}
            className="mt-0!"
          />
        </div>
      )}
    </div>
  );
}
