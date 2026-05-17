import { getCompanyGalleryPhotos, getEventGalleryPhotos } from '@/actions/gallery';
import { getTemplate } from '@/actions/template';
import { buildTemplateMetadata, toAbsoluteUrl } from '@/app/utils/template-metadata';
import type { Metadata } from 'next';
import GalleryPage from '@/pages/GalleryPage';

const FALLBACK_GALLERY_TITLE = 'ГАЛЕРЕЯ';
const FALLBACK_GALLERY_SUBTITLE =
  'ОРГАНІЗАЦІЯ КОРПОРАТИВІВ, ПРИВАТНІ ІГРИ, АБО ОРЕНДА ОБЛАДНАННЯ. ГРУПОВІ І ПЕРСОНАЛЬНІ КУРСИ З ТАКТИКИ ТА МЕДИЦИНИ.';

const htmlToPlainText = (value: string): string =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

type GalleryRouteProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const hasRegionFilter = Boolean(params.region);

  const baseMetadata = await buildTemplateMetadata({
    pageKey: 'gallery',
    fallbackTitle: 'Галерея | Strike Shop Action',
    fallbackCanonicalPath: '/gallery',
  });

  if (!hasRegionFilter) {
    return baseMetadata;
  }

  return {
    ...baseMetadata,
    alternates: {
      canonical: toAbsoluteUrl('/gallery'),
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function GalleryRoute({ searchParams }: GalleryRouteProps) {
  const params = await searchParams;

  const [companyPhotos, eventPhotos, templateResult] = await Promise.all([
    getCompanyGalleryPhotos(),
    getEventGalleryPhotos(),
    getTemplate('gallery'),
  ]);

  let pageTitle = FALLBACK_GALLERY_TITLE;
  let pageSubtitle = FALLBACK_GALLERY_SUBTITLE;
  let pageSeoText = '';

  if (templateResult.success) {
    const template = templateResult.data as Record<string, unknown>;

    if (typeof template.title === 'string' && template.title.trim()) {
      pageTitle = template.title.trim();
    }

    if (typeof template.content === 'string' && template.content.trim()) {
      pageSubtitle = htmlToPlainText(template.content);
    }

    if (typeof template.seo === 'object' && template.seo !== null) {
      const seo = template.seo as Record<string, unknown>;
      if (typeof seo.seoText === 'string' && seo.seoText.trim()) {
        pageSeoText = seo.seoText.trim();
      }
    }
  }

  return (
    <GalleryPage
      companyPhotos={companyPhotos}
      eventPhotos={eventPhotos}
      pageTitle={pageTitle}
      pageSubtitle={pageSubtitle}
      pageSeoText={pageSeoText}
    />
  );
}
