import { buildTemplateMetadata } from '@/app/utils/template-metadata';
import BannerJoin from '@/components/generics/banners/BannerJoin';
import InfoTemplatePage from '@/components/info/InfoTemplatePage';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return buildTemplateMetadata({
    pageKey: 'privacy',
    fallbackTitle: 'Політика конфіденційності | Strike Shop Action',
    fallbackCanonicalPath: '/privacy-policy',
  });
}

export default function Page() {
  return (
    <>
      <InfoTemplatePage
        pageKey="privacy"
        fallbackTitle="Політика конфіденційності"
        breadcrumbPath={[
          { label: 'Головна', href: '/' },
          { label: 'Політика конфіденційності' },
        ]}
      />
      <BannerJoin pageKey="rental" />
    </>
  );
}
