import { buildTemplateMetadata } from '@/app/utils/template-metadata';
import type { Metadata } from 'next';
import BannerJoin from '@/components/generics/banners/BannerJoin';
import InfoTemplatePage from '@/components/info/InfoTemplatePage';

export async function generateMetadata(): Promise<Metadata> {
  return buildTemplateMetadata({
    pageKey: 'payment',
    fallbackTitle: 'Оплата і доставка | Strike Shop Action',
    fallbackCanonicalPath: '/payment-delivery',
  });
}

export default function Page() {
  return (
    <>
      <InfoTemplatePage
        pageKey="payment"
        fallbackTitle="Оплата і доставка"
        breadcrumbPath={[
          { label: 'Головна', href: '/' },
          { label: 'Оплата і доставка' },
        ]}
      />
      <BannerJoin pageKey="rental" />
    </>
  );
}
