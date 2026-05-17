import { buildTemplateMetadata } from '@/app/utils/template-metadata';
import BannerJoin from '@/components/generics/banners/BannerJoin';
import InfoTemplatePage from '@/components/info/InfoTemplatePage';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return buildTemplateMetadata({
    pageKey: 'game-types',
    fallbackTitle: 'Типи ігор | Strike Shop Action',
    fallbackCanonicalPath: '/game-types',
  });
}

export default function Page() {
  return (
    <>
      <InfoTemplatePage
        pageKey="game-types"
        fallbackTitle="Типи ігор"
        breadcrumbPath={[
          { label: 'Головна', href: '/' },
          { label: 'Типи ігор' },
        ]}
      />
      <BannerJoin pageKey="rental" />
    </>
  );
}