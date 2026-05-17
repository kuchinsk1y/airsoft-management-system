import BannerCreateGame from '@/components/generics/banners/BannerCreateGame';
import BannerJoin from '@/components/generics/banners/BannerJoin';
import { toAbsoluteUrl } from '@/app/utils/template-metadata';
import type { Metadata } from 'next';
import RatingGenericPage from '@/pages/RatingGenericPage';
import {
  getLocalizedAlternates,
  getRequestLocale,
  localizePath,
} from '@/app/utils/locale-seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return {
    title: 'Рейтингова таблиця організаторів | Strike Shop Action',
    description: 'Поточний рейтинг організаторів страйкбольних подій.',
    alternates: {
      ...(await getLocalizedAlternates('/ratings/organizers-rating', locale)),
      canonical: toAbsoluteUrl(
        localizePath('/ratings/organizers-rating', locale),
      ),
    },
  };
}

export default async function RatingOrganizersPage() {
  return (
    <>
      <RatingGenericPage
        title="Рейтингова таблиця організаторів зі страйкболу"
        placeholder="Пошук організаторів..."
        path={[
          { label: 'Головна', href: '/' },
          { label: 'Рейтингова таблиця зі страйкболу', href: '/ratings' },
          {
            label: 'Рейтингова таблиця організаторів зі страйкболу',
            href: '/ratings/organizers-rating',
          },
        ]}
      />
      <BannerCreateGame pageKey="events" />
      <BannerJoin pageKey="events" />
    </>
  );
}
