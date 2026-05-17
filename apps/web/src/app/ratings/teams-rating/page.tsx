import BannerCreateGame from '@/components/generics/banners/BannerCreateGame';
import BannerJoin from '@/components/generics/banners/BannerJoin';
import { toAbsoluteUrl } from '@/app/utils/template-metadata';
import type { Metadata } from 'next';
import RatingGenericPage from '@/pages/RatingGenericPage';
import { getLocalizedAlternates, getRequestLocale, localizePath } from '@/app/utils/locale-seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return {
    title: 'Рейтингова таблиця команд | Strike Shop Action',
    description: 'Поточний рейтинг страйкбольних команд.',
    alternates: {
      ...(await getLocalizedAlternates('/ratings/teams-rating', locale)),
      canonical: toAbsoluteUrl(localizePath('/ratings/teams-rating', locale)),
    },
  };
}

export default async function RatingTeamsPage() {
  return (
    <>
      <RatingGenericPage
        title="Рейтингова таблиця команд зі страйкболу"
        placeholder="Пошук команд..."
        path={[
          { label: 'Головна', href: '/' },
          { label: 'Рейтингова таблиця зі страйкболу', href: '/ratings' },
          { label: 'Рейтингова таблиця команд зі страйкболу', href: '/ratings/teams-rating' },
        ]}
      />
      <BannerCreateGame pageKey="events" />
      <BannerJoin pageKey="events" />
    </>
  )
}
