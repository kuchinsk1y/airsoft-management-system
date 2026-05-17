'use client';

import { useRouter } from 'next/navigation';
import ArrowSection from '../ArrowSection/ArrowSection';
import OrganizerLeaderboard from '../Ratings/OrganizerLeaderboard';
import PlayerLeaderboard from '../Ratings/PlayerLeaderboard';
import TeamLeaderboard from '../Ratings/TeamLeaderboard';
import {
  LeaderboardResponse,
  OrganizerRatingResponse,
  PlayerRatingResponse,
  TeamRatingResponse,
} from '@/interfaces';

type TopBlockProps = {
  initialPlayerLeaderboard?: LeaderboardResponse<PlayerRatingResponse>;
  initialTeamLeaderboard?: LeaderboardResponse<TeamRatingResponse>;
  initialOrganizerLeaderboard?: LeaderboardResponse<OrganizerRatingResponse>;
};

export default function TopBlock({
  initialPlayerLeaderboard,
  initialTeamLeaderboard,
  initialOrganizerLeaderboard,
}: TopBlockProps) {
  const router = useRouter();

  return (
    <div className="w-full">
      <div className="hover:bg-[#1E2939] transition duration-500 cursor-pointer">
        <ArrowSection
          title="Наші топи"
          showArrows={false}
          onClick={() => router.push('/ratings')}
        />
      </div>
      <div className="border-t border-white w-full">
        <div className="grid grid-cols-3 max-[1200px]:grid-cols-1 border-b border-white">
          <section className="border-r border-white max-[991px]:border-r-0 max-[991px]:border-b">
            <h2 className="px-5 text-2xl min991:px-8 py-4 text-white border-white border-b min991:text-3xl font-semibold">
              ТОП 5 ГРАВЦІВ:
            </h2>
            <div className="px-3 min991:px-5 pb-4 ">
              <PlayerLeaderboard
                initialQuery={{ limit: 5, offset: 0 }}
                initialData={initialPlayerLeaderboard}
              />
            </div>
          </section>

          <section className="border-r border-white max-[1200px]:border-r-0 max-[1200px]:border-b">
            <h2 className="px-5 text-2xl min991:px-8 py-4 text-white border-white border-b min991:text-3xl font-semibold">
              ТОП 5 КОМАНД:
            </h2>
            <div className="px-3 min991:px-5 pb-4 ">
              <TeamLeaderboard
                initialQuery={{ limit: 5, offset: 0 }}
                initialData={initialTeamLeaderboard}
              />
            </div>
          </section>
          <section>
            <h2 className="px-5 text-2xl min991:px-8 py-4 text-white border-white border-b min991:text-3xl font-semibold">
              ТОП 5 ОРГАНІЗАТОРІВ:
            </h2>
            <div className="px-3 min991:px-5 pb-4 ">
              <OrganizerLeaderboard
                initialQuery={{ limit: 5, offset: 0 }}
                initialData={initialOrganizerLeaderboard}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
