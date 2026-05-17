import Hero from '@/components/Main/Hero';
import { buildTemplateMetadata } from '@/app/utils/template-metadata';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import MainBanner from '@/components/Main/MainBanner';
import dynamicImport from 'next/dynamic';
import { getTemplate } from '@/actions/template';
import { getEvents } from '@/actions/events';
import { getProducts } from '@/actions/products';
import { getRandomCommentsByScope } from '@/actions/comments';
import {
  getOrganizerLeaderboard,
  getPlayerLeaderboard,
  getTeamLeaderboard,
} from '@/actions/ratings';
import type { Banner, Comment, Event, Product } from '@/interfaces';
import { DealType } from '@/interfaces';
import SeoTextBlock from '@/components/seo/SeoTextBlock';

export const dynamic = 'force-dynamic';

const EventBlock = dynamicImport(() => import('@/components/Main/EventBlock'));
const TopBlock = dynamicImport(() => import('@/components/Main/TopBlock'));
const TopEquipment = dynamicImport(() => import('@/components/Main/TopEquipment'));
const FeedbackBlock = dynamicImport(() => import('@/components/Main/FeedbackBlock'));
const PartnersBlock = dynamicImport(() => import('@/components/Main/PartnersBlock'));
const QuestionsBlock = dynamicImport(() => import('@/components/Main/QuestionsBlock'));

export async function generateMetadata(): Promise<Metadata> {
  return buildTemplateMetadata({
    pageKey: 'main',
    fallbackTitle: 'Strike Shop Action',
    fallbackCanonicalPath: '/',
  });
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ region?: string }>;
}) {
  const params = await searchParams;
  const regionSlug = params.region || undefined;

  const [
    templateResult,
    initialEvents,
    initialProducts,
    initialComments,
    initialPlayerLeaderboard,
    initialTeamLeaderboard,
    initialOrganizerLeaderboard,
  ] = await Promise.all([
    getTemplate('main').catch(() => ({ success: false, data: null })),
    getEvents({ isActive: true, regionSlug }).catch(() => []),
    getProducts({ regionSlug, dealType: DealType.RENT, isActive: true }).catch(() => []),
    getRandomCommentsByScope('COMPANY', 9).catch(() => []),
    getPlayerLeaderboard({ limit: 5, offset: 0 }).catch(() => undefined),
    getTeamLeaderboard({ limit: 5, offset: 0 }).catch(() => undefined),
    getOrganizerLeaderboard({ limit: 5, offset: 0 }).catch(() => undefined),
  ]);

  let heroTitle = '';
  let heroDescription = '';
  let heroImage = '';
  let banners: Banner[] = [];
  let seoText = '';

  if (templateResult.success) {
    const data = templateResult.data as {
      title?: string;
      description?: string;
      content?: Array<{ type: string; image?: string; items?: Banner[] }>;
    };

    if (typeof data?.title === 'string') {
      heroTitle = data.title;
    }

    if (typeof data?.description === 'string') {
      heroDescription = data.description;
    }

    if (Array.isArray(data?.content)) {
      const heroBlock = data.content.find((item) => item.type === 'hero');
      if (heroBlock?.image) {
        heroImage = heroBlock.image;
      }

      const bannersBlock = data.content.find((item) => item.type === 'banners') as
        | { items?: Banner[] }
        | undefined;
      if (Array.isArray(bannersBlock?.items)) {
        banners = bannersBlock.items.filter((banner) => banner.isActive);
      }
    }

    const rawSeo = (templateResult.data as { seo?: { seoText?: unknown } }).seo;
    if (typeof rawSeo?.seoText === 'string') {
      seoText = rawSeo.seoText;
    }
  }

  return (
    <div>
      <Suspense fallback={null}>
        <MainBanner initialBanners={banners} />
        <Hero
          initialTitle={heroTitle}
          initialDescription={heroDescription}
          initialHeroImage={heroImage}
        />
      </Suspense>
      <Suspense fallback={null}>
        <EventBlock
          initialEvents={Array.isArray(initialEvents) ? (initialEvents as Event[]) : []}
          initialRegionSlug={regionSlug}
        />
        <TopBlock
          initialPlayerLeaderboard={initialPlayerLeaderboard}
          initialTeamLeaderboard={initialTeamLeaderboard}
          initialOrganizerLeaderboard={initialOrganizerLeaderboard}
        />
        <TopEquipment
          initialProducts={Array.isArray(initialProducts) ? (initialProducts as Product[]).slice(0, 4) : []}
          initialRegionSlug={regionSlug}
        />
        <FeedbackBlock initialComments={Array.isArray(initialComments) ? (initialComments as Comment[]) : []} />
        <PartnersBlock />
        <QuestionsBlock />
      </Suspense>
      <SeoTextBlock text={seoText} className="min991:px-20" />
    </div>
  );
}
