import { getEvents } from '@/actions/events';
import {
  getOrganizerLeaderboard,
  getPlayerLeaderboard,
  getTeamLeaderboard,
} from '@/actions/ratings';
import { getTemplate } from '@/actions/template';
import { toAbsoluteUrl } from '@/app/utils/template-metadata';
import { getLocalizedAlternates, getRequestLocale, localizePath } from '@/app/utils/locale-seo';
import BannerCreateGame from '@/components/generics/banners/BannerCreateGame';
import BannerJoin from '@/components/generics/banners/BannerJoin';
import TopBlock from '@/components/Main/TopBlock';
import type { EventsFilters, EventsPageProps } from '@/interfaces';
import type { Metadata } from 'next';
import EventsArchivePage from '@/pages/EventsArchivePage';

export async function generateMetadata({ searchParams }: EventsPageProps): Promise<Metadata> {
  const locale = await getRequestLocale();
  const params = await searchParams;
  const hasFilters = Boolean(
    params.region || params.competitionType || params.searchQuery || params.date,
  );

  return {
    title: 'Архів подій | Strike Shop Action',
    description: 'Архів завершених страйкбольних подій.',
    alternates: {
      ...(await getLocalizedAlternates('/events/archive', locale)),
      canonical: toAbsoluteUrl(localizePath('/events/archive', locale)),
    },
    robots: {
      index: !hasFilters,
      follow: true,
    },
  };
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams;

  const filters: EventsFilters = {
    isActive: false,
    regionSlug: params.region || undefined,
    competitionType: params.competitionType,
    searchQuery: params.searchQuery,
    date: params.date,
  };

  const [events, templateResult] = await Promise.all([
    getEvents(filters),
    getTemplate('events'),
  ]);
  const [initialPlayerLeaderboard, initialTeamLeaderboard, initialOrganizerLeaderboard] =
    await Promise.all([
      getPlayerLeaderboard({ limit: 5, offset: 0 }).catch(() => undefined),
      getTeamLeaderboard({ limit: 5, offset: 0 }).catch(() => undefined),
      getOrganizerLeaderboard({ limit: 5, offset: 0 }).catch(() => undefined),
    ]);

  let template: { title?: string; breadcrumbs?: string[]; seoText?: string } | undefined;
  if (templateResult.success) {
    const data = templateResult.data as {
      title?: string;
      breadcrumbs?: string[];
      seo?: { seoText?: string };
    };
    if (data.title || data.breadcrumbs) {
      template = {
        title: 'АРХІВ ПОДІЙ',
        breadcrumbs: ['ГОЛОВНА', 'АРХІВ ПОДІЙ'],
        seoText: typeof data.seo?.seoText === 'string' ? data.seo.seoText : '',
      };
    }
  } else {
    template = {
      title: 'АРХІВ ПОДІЙ',
      breadcrumbs: ['ГОЛОВНА', 'АРХІВ ПОДІЙ'],
    };
  }

  return (
    <>
      <EventsArchivePage initialEvents={events} template={template} />
      <BannerCreateGame pageKey="events" />
      <TopBlock
        initialPlayerLeaderboard={initialPlayerLeaderboard}
        initialTeamLeaderboard={initialTeamLeaderboard}
        initialOrganizerLeaderboard={initialOrganizerLeaderboard}
      />
      <BannerJoin pageKey="events" region={params.region} />
    </>
  );
}
