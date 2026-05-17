import BannerCreateGame from '@/components/generics/banners/BannerCreateGame';
import BannerJoin from '@/components/generics/banners/BannerJoin';
import { toAbsoluteUrl } from '@/app/utils/template-metadata';
import type { Metadata } from 'next';
import RatingGenericPage from '@/pages/RatingGenericPage';
import { getLocalizedAlternates, getRequestLocale, localizePath } from '@/app/utils/locale-seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return {
    title: 'Рейтингова таблиця гравців | Strike Shop Action',
    description: 'Поточний рейтинг гравців зі страйкболу.',
    alternates: {
      ...(await getLocalizedAlternates('/ratings/players-rating', locale)),
      canonical: toAbsoluteUrl(localizePath('/ratings/players-rating', locale)),
    },
  };
}

export default async function RatingPlayersPage() {
  return (
    <>
      <RatingGenericPage
        title="Рейтингова таблиця гравців зі страйкболу"
        placeholder="Пошук гравців..."
        path={[
          { label: 'Головна', href: '/' },
          { label: 'Рейтингова таблиця зі страйкболу', href: '/ratings' },
          { label: 'Рейтингова таблиця гравців зі страйкболу', href: '/ratings/players-rating' },
        ]}
      />
      <BannerCreateGame pageKey="events" />
      <BannerJoin pageKey="events" />
    </>
  )
}
