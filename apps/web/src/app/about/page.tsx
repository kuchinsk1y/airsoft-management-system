import { buildTemplateMetadata } from '@/app/utils/template-metadata';
import type { Metadata } from 'next';
import BannerJoin from '@/components/generics/banners/BannerJoin';
import InfoTemplatePage from '@/components/info/InfoTemplatePage';

export async function generateMetadata(): Promise<Metadata> {
  return buildTemplateMetadata({
    pageKey: 'about',
    fallbackTitle: 'Про компанію | Strike Shop Action',
    fallbackCanonicalPath: '/about',
  });
}

export default function Page() {
  return (
    <>
      <InfoTemplatePage
        pageKey="about"
        fallbackTitle="Про компанію"
        breadcrumbPath={[{ label: 'Головна', href: '/' }, { label: 'Про компанію' }]}
      />
      <BannerJoin pageKey="rental" />
    </>
  );
}
