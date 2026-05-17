'use client';

import TitleBlock from '@/components/TitleBlock/TitleBlock';
import PlayerLeaderboard from '@/components/Ratings/PlayerLeaderboard';
import TeamLeaderboard from '@/components/Ratings/TeamLeaderboard';
import OrganizerLeaderboard from '@/components/Ratings/OrganizerLeaderboard';
import Link from 'next/link';
import { useLayoutEffect, useState } from 'react';

export default function RatingMainPage({ title = 'Рейтингові таблиці зі страйкболу' }: { title?: string }) {
  const [isMobile, setIsMobile] = useState(false);

  useLayoutEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 991);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="border-b border-white">
      <TitleBlock
        title="Рейтингові таблиці зі страйкболу"
        path={[
          { label: 'Головна', href: '/' },
          { label: 'Рейтингові таблиці зі страйкболу' },
        ]}
        className="px-5 py-5 min991:px-8 min991:py-8 flex-col gap-3 min991:gap-5"
        titleClassName="text-white text-4xl leading-[120%] min991:text-6xl min991:leading-[100%]"
        breadcrumbClassName="text-[10px] min991:text-xs"
      />
      <div className="border-t border-white w-full">
        <div className="grid grid-cols-3 max-[1200px]:grid-cols-1 border-b border-white">
          <section className="flex flex-col border-r border-white max-[1200px]:border-r-0 max-[1200px]:border-b">
            <h2 className="px-6 min991:px-6 py-4 text-white text-[32px] min991:text-3xl border-white border-b font-semibold">
              ТОП ГРАВЦІВ:
            </h2>
            <div className="flex-1 px-3 min991:px-2 pb-4">
              <PlayerLeaderboard
                key={`players-${isMobile ? 'mobile' : 'desktop'}`}
                initialQuery={{ limit: isMobile ? 5 : 10, offset: 0 }}
              />
            </div>
            <div className="mt-auto border-t border-white">
              <Link
                href="/ratings/players-rating"
                className="block w-full py-6 text-center font-bold uppercase text-white hover:text-white"
              >
                ПОКАЗАТИ БІЛЬШЕ
              </Link>
            </div>
          </section>

          <section className="flex flex-col border-r border-white max-[1200px]:border-r-0 max-[1200px]:border-b">
            <h2 className="px-6 min991:px-6 py-4 text-white text-[32px] min991:text-3xl border-white border-b font-semibold">
              ТОП КОМАНД:
            </h2>
            <div className="flex-1 px-3 min991:px-2 pb-4">
              <TeamLeaderboard
                key={`teams-${isMobile ? 'mobile' : 'desktop'}`}
                initialQuery={{ limit: isMobile ? 5 : 10, offset: 0 }}
              />
            </div>
            <div className="mt-auto border-t border-white">
              <Link
                href="/ratings/teams-rating"
                className="block w-full py-6 text-center  font-bold uppercase text-white hover:text-white"
              >
                ПОКАЗАТИ БІЛЬШЕ
              </Link>
            </div>
          </section>

          <section className="flex flex-col">
            <h2 className="px-6 min991:px-6 py-4 text-white text-[32px] min991:text-3xl border-white border-b font-semibold">
              ТОП ОРГАНІЗАТОРІВ:
            </h2>
            <div className="flex-1 px-3 min991:px-2 pb-4">
              <OrganizerLeaderboard
                key={`organizers-${isMobile ? 'mobile' : 'desktop'}`}
                initialQuery={{ limit: isMobile ? 5 : 10, offset: 0 }}
              />
            </div>
            <div className="mt-auto border-t border-white">
              <Link
                href="/ratings/organizers-rating"
                className="block w-full py-6 text-center font-bold uppercase text-white hover:text-white"
              >
                ПОКАЗАТИ БІЛЬШЕ
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
