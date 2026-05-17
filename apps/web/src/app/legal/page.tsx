import { buildTemplateMetadata } from '@/app/utils/template-metadata';
import type { Metadata } from 'next';
import BannerJoin from '@/components/generics/banners/BannerJoin';
import InfoTemplatePage from '@/components/info/InfoTemplatePage';

export async function generateMetadata(): Promise<Metadata> {
  return buildTemplateMetadata({
    pageKey: 'legal',
    fallbackTitle: 'Статутні документи | Strike Shop Action',
    fallbackCanonicalPath: '/legal',
  });
}

export default function Page() {
  return (
    <>
      <InfoTemplatePage
        pageKey="legal"
        fallbackTitle="Статутні документи"
        breadcrumbPath={[
          { label: 'Головна', href: '/' },
          { label: 'Статутні документи' },
        ]}
      />
      <BannerJoin pageKey="rental" />
    </>
  );
}
