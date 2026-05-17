import { buildTemplateMetadata } from '@/app/utils/template-metadata';
import BannerJoin from '@/components/generics/banners/BannerJoin';
import InfoTemplatePage from '@/components/info/InfoTemplatePage';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return buildTemplateMetadata({
    pageKey: 'what-is-airsoft',
    fallbackTitle: 'Що таке страйкбол | Strike Shop Action',
    fallbackCanonicalPath: '/what-is-airsoft',
  });
}

export default function Page() {
  return (
    <>
      <InfoTemplatePage
        pageKey="what-is-airsoft"
        fallbackTitle="Що таке страйкбол"
        breadcrumbPath={[
          { label: 'Головна', href: '/' },
          { label: 'Що таке страйкбол' },
        ]}
      />
      <BannerJoin pageKey="rental" />
    </>
  );
}
