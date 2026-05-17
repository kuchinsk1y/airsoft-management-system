import { getProducts } from '@/actions/products';
import { getEvents } from '@/actions/events';
import { getTemplate } from '@/actions/template';
import { buildTemplateMetadata, toAbsoluteUrl } from '@/app/utils/template-metadata';
import { getLocalizedAlternates, getRequestLocale, localizePath } from '@/app/utils/locale-seo';
import BannerCreateGame from '@/components/generics/banners/BannerCreateGame';
import BannerJoin from '@/components/generics/banners/BannerJoin';
import EventBlock from '@/components/Main/EventBlock';
import type { FaqItem } from '@/interfaces';
import type { Metadata } from 'next';
import RentalPage from '@/pages/RentalPage';

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

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ region?: string }>;
}): Promise<Metadata> {
  const locale = await getRequestLocale();
  const params = await searchParams;
  const hasRegionFilter = Boolean(params.region);
  const baseMetadata = await buildTemplateMetadata({
    pageKey: 'rental',
    fallbackTitle: 'Прокат спорядження | Strike Shop Action',
    fallbackCanonicalPath: '/rental',
  });

  if (!hasRegionFilter) {
    return baseMetadata;
  }

  return {
    ...baseMetadata,
    alternates: {
      ...(await getLocalizedAlternates('/rental', locale)),
      canonical: toAbsoluteUrl(localizePath('/rental', locale)),
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ region?: string }>;
}) {
  const params = await searchParams;
  const regionSlug = params.region || undefined;
  const [products, templateResult, upcomingEvents] = await Promise.all([
    getProducts({ regionSlug }),
    getTemplate('rental'),
    getEvents({ isActive: true, regionSlug }),
  ]);

  let template: { title: string; breadcrumbs: string[]; seoText?: string; seoFaq?: FaqItem[] } | undefined;
  if (templateResult.success) {
    const data = templateResult.data as {
      title?: string;
      breadcrumbs?: string[];
      seo?: { seoText?: string; seoFaq?: unknown };
    };
    if (data.title && data.breadcrumbs) {
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
      <RentalPage initialProducts={products} template={template} />
      <EventBlock initialEvents={upcomingEvents} initialRegionSlug={regionSlug} />
      <BannerCreateGame pageKey="rental" />
      <BannerJoin pageKey="rental" region={params.region} />
    </>
  );
}
