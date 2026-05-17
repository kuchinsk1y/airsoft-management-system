import BannerCreateGame from '@/components/generics/banners/BannerCreateGame';
import BannerJoin from '@/components/generics/banners/BannerJoin';
import { buildTemplateMetadata } from '@/app/utils/template-metadata';
import type { Metadata } from 'next';
import RatingMainPage from '@/pages/RatingMainPage';
import SeoTextBlock from '@/components/seo/SeoTextBlock';
import { getTemplate } from '@/actions/template';

export async function generateMetadata(): Promise<Metadata> {
  return buildTemplateMetadata({
    pageKey: 'ratings',
    fallbackTitle: 'Рейтингова таблиця | Strike Shop Action',
    fallbackCanonicalPath: '/ratings',
  });
}

export default async function Page() {
  const result = await getTemplate('ratings');
  let seoText = '';
  let h1Title: string | undefined;

  if (result.success) {
    const data = result.data as {
      title?: unknown;
      seo?: { seoText?: unknown };
    };

    if (typeof data.seo?.seoText === 'string') {
      seoText = data.seo.seoText;
    }

    if (typeof data.title === 'string' && data.title.trim()) {
      h1Title = data.title.trim();
    }
  }

  return (
    <>
      <RatingMainPage title={h1Title} />
      <BannerCreateGame pageKey='events' />
      <BannerJoin pageKey='events' />
      <SeoTextBlock text={seoText} className="min991:px-20" />
    </>
  );
}
