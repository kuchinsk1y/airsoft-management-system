import { getEvents } from '@/actions/events';
import { getRandomCommentsByScope } from '@/actions/comments';
import { getProducts } from '@/actions/products';
import {
  getOrganizerLeaderboard,
  getPlayerLeaderboard,
  getTeamLeaderboard,
} from '@/actions/ratings';
import { getTemplate } from '@/actions/template';
import { buildTemplateMetadata, toAbsoluteUrl } from '@/app/utils/template-metadata';
import { getLocalizedAlternates, getRequestLocale, localizePath } from '@/app/utils/locale-seo';
import BannerCreateGame from '@/components/generics/banners/BannerCreateGame';
import BannerJoin from '@/components/generics/banners/BannerJoin';
import EquipmentRentalBlock from '@/components/generics/equipmentRentalBlock/EquipmentRentalBlock';
import FeedbackBlock from '@/components/Main/FeedbackBlock';
import TopBlock from '@/components/Main/TopBlock';
import { DealType } from '@/interfaces';
import type { Comment, EventsFilters, EventsPageProps, FaqItem, Product } from '@/interfaces';
import type { Metadata } from 'next';
import EventsCalendarPage from '@/pages/EventsCalendarPage';

function normalizeFaq(value: unknown): FaqItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item !== 'object' || item === null) {
        return { question: '', answer: '' };
      }

      const obj = item as Record<string, unknown>;
      return {
        question: typeof obj.question === 'string' ? obj.question : '',
        answer: typeof obj.answer === 'string' ? obj.answer : '',
      };
    })
    .filter((item) => item.question.trim().length > 0 && item.answer.trim().length > 0);
}

export async function generateMetadata({ searchParams }: EventsPageProps): Promise<Metadata> {
  const locale = await getRequestLocale();
  const params = await searchParams;
  const hasFilters = Boolean(
    params.region ||
      params.competitionType ||
      params.searchQuery ||
      params.date ||
      params.isActive,
  );

  const baseMetadata = await buildTemplateMetadata({
    pageKey: 'events',
    fallbackTitle: 'Календар подій | Strike Shop Action',
    fallbackCanonicalPath: '/events',
  });

  if (!hasFilters) {
    return baseMetadata;
  }

  return {
    ...baseMetadata,
    alternates: {
      ...(await getLocalizedAlternates('/events', locale)),
      canonical: toAbsoluteUrl(localizePath('/events', locale)),
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams;

  const filters: EventsFilters = {
    isActive: params.isActive === 'false' ? false : true,
    regionSlug: params.region || undefined,
    competitionType: params.competitionType,
    searchQuery: params.searchQuery,
    date: params.date,
  };

  const [
    events,
    templateResult,
    initialProducts,
    initialComments,
    initialPlayerLeaderboard,
    initialTeamLeaderboard,
    initialOrganizerLeaderboard,
  ] = await Promise.all([
    getEvents(filters),
    getTemplate('events'),
    getProducts({
      regionSlug: params.region || undefined,
      dealType: DealType.RENT,
      isActive: true,
    }).catch(() => []),
    getRandomCommentsByScope('COMPANY', 9).catch(() => []),
    getPlayerLeaderboard({ limit: 5, offset: 0 }).catch(() => undefined),
    getTeamLeaderboard({ limit: 5, offset: 0 }).catch(() => undefined),
    getOrganizerLeaderboard({ limit: 5, offset: 0 }).catch(() => undefined),
  ]);

  let template: { title?: string; breadcrumbs?: string[]; seoText?: string; seoFaq?: FaqItem[] } | undefined;
  if (templateResult.success) {
    const data = templateResult.data as {
      title?: string;
      breadcrumbs?: string[];
      seo?: { seoText?: string; seoFaq?: unknown };
    };
    if (data.title || data.breadcrumbs) {
      template = {
        title: data.title,
        breadcrumbs: data.breadcrumbs,
        seoText: typeof data.seo?.seoText === 'string' ? data.seo.seoText : '',
        seoFaq: normalizeFaq(data.seo?.seoFaq),
      };
    }
  }

  return (
    <>
      <EventsCalendarPage initialEvents={events} template={template} />
      <BannerCreateGame pageKey="events" />
      <EquipmentRentalBlock
        initialProducts={Array.isArray(initialProducts) ? (initialProducts as Product[]).slice(0, 4) : []}
      />
      <TopBlock
        initialPlayerLeaderboard={initialPlayerLeaderboard}
        initialTeamLeaderboard={initialTeamLeaderboard}
        initialOrganizerLeaderboard={initialOrganizerLeaderboard}
      />
      <FeedbackBlock initialComments={Array.isArray(initialComments) ? (initialComments as Comment[]) : []} />
      <BannerJoin pageKey="events" region={params.region} />
    </>
  );
}
