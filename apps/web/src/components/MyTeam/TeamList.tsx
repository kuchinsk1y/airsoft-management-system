"use client";

import { ItemTeamProps } from '@/interfaces';
import TeamListItem from './TeamListItem';
import PaginationTeamList from './PaginationTeamList';
import { useState, useEffect } from 'react'; 
import { getPartTeams } from '@/actions/get-part-teams';
import { getTeamsCount } from '@/actions/get-team-count';
import Loader from '../generics/loader/Loader';


export default function TeamList({
  onOpenModal,
  searchQuery,
  onJoinError,
}: {
  onOpenModal: () => void;
  searchQuery?: string;
  onJoinError?: (message: string | null) => void;
}) {
  const [teams, setTeams] = useState<ItemTeamProps[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const limit = 8; 

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const count = (await getTeamsCount(searchQuery)) || 0;
        setTotalPages(Math.ceil(count / limit));
      } catch (error) {
        console.error("Помилка при отриманні кількості команд:", error);
      }
    };
    fetchCount();
  }, [limit, searchQuery]);

  useEffect(() => {
    const fetchTeams = async () => {
      setIsLoading(true);
      try {
        const data = await getPartTeams(currentPage, limit, searchQuery);
        setTeams(data);
      } catch (error) {
        console.error("Помилка при завантаженні команд:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeams();
  }, [currentPage, limit, searchQuery]);

  if (isLoading && teams.length === 0) {
    return <div className="text-white p-5 text-center">Завантаження команд...</div>;
  }
  
  if (!isLoading && teams.length === 0) {
    return (
      <div className="text-white/70 p-5 text-center uppercase text-sm">
        {searchQuery && searchQuery.trim()
          ? 'Команду не знайдено'
          : 'Команд поки немає'}
      </div>
    );
  }

  return (
    <>
      <div className=" relative flex flex-col gap-3 min991:gap-0 min991:border-t min991:first:border-t border-[#999999]">
     
        <div className="hidden min991:flex items-center justify-between text-[#999999] font-semibold uppercase py-4.5 px-5 border-b border-x border-[#999999]">
          <div className="flex justify-between items-center gap-28.75 ">
            <span className="text-sm uppercase">#</span>
            <span className="text-sm uppercase">НАЗВА</span>
          </div>
          <div className="flex justify-between items-center gap-33.75 pr-12 ">
            <span className="text-sm uppercase">УЧАСНИКІВ</span>
            <span className="text-sm uppercase">ДІЯ</span>
          </div>
        </div>

          {teams.map((item, index) => (
            <TeamListItem 
              key={item.id || index} 
              item={item} 
              onOpenModal={onOpenModal}
              onJoinError={onJoinError}
            />
          ))}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[1px] z-10">
            <Loader text="Завантаження команд..." />
          </div>
        )}
      </div>

  
      {totalPages > 0 && (
        <PaginationTeamList 
        className=''
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={(page) => {
             setCurrentPage(page);
              window.scrollTo({ top: 500, behavior: 'smooth' });
             }} 
        />
      )}
    </>
  );
}