import { getTemplate } from '@/actions/template';
import { NEXT_PUBLIC_WEB_URL } from '@/utils/config';
import type { Metadata } from 'next';
import { getLocalizedAlternates, getRequestLocale, localizePath } from './locale-seo';

type TemplateSeoConfig = {
  browserTitle?: string;
  ruBrowserTitle?: string;
  metaDescription?: string;
  ruMetaDescription?: string;
  ogImage?: string;
  index?: boolean;
  follow?: boolean;
  canonicalUrl?: string;
};

type BuildTemplateMetadataParams = {
  pageKey: string;
  fallbackTitle: string;
  fallbackCanonicalPath: string;
};

export function toAbsoluteUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;

  const normalizedBase = NEXT_PUBLIC_WEB_URL.replace(/\/$/, '');
  const normalizedPath = value.startsWith('/') ? value : `/${value}`;
  return `${normalizedBase}${normalizedPath}`;
}

export async function buildTemplateMetadata({
  pageKey,
  fallbackTitle,
  fallbackCanonicalPath,
}: BuildTemplateMetadataParams): Promise<Metadata> {
  const locale = await getRequestLocale();
  const result = await getTemplate(pageKey);

  if (!result.success) {
    const localizedFallbackCanonicalPath = localizePath(fallbackCanonicalPath, locale);

    return {
      title: fallbackTitle,
      alternates: {
        ...(await getLocalizedAlternates(fallbackCanonicalPath, locale)),
        canonical: toAbsoluteUrl(localizedFallbackCanonicalPath),
      },
    };
  }

  const config = result.data as Record<string, unknown>;
  const seo = (typeof config.seo === 'object' && config.seo !== null
    ? config.seo
    : {}) as TemplateSeoConfig;

  const localizedBrowserTitle =
    locale === 'ru'
      ? seo.ruBrowserTitle || seo.browserTitle
      : seo.browserTitle;
  const localizedMetaDescription =
    locale === 'ru'
      ? seo.ruMetaDescription || seo.metaDescription
      : seo.metaDescription;

  const title = localizedBrowserTitle || (typeof config.title === 'string' ? config.title : fallbackTitle);
  const description = localizedMetaDescription || (typeof config.description === 'string' ? config.description : undefined);
  const canonicalPath = seo.canonicalUrl || fallbackCanonicalPath;
  const localizedCanonicalPath = localizePath(canonicalPath, locale);
  const canonical = toAbsoluteUrl(localizedCanonicalPath);
  const ogImage = typeof seo.ogImage === 'string' && seo.ogImage.length > 0
    ? toAbsoluteUrl(seo.ogImage)
    : undefined;

  return {
    title,
    description,
    alternates: {
      ...(await getLocalizedAlternates(canonicalPath, locale)),
      canonical,
    },
    robots: {
      index: seo.index ?? true,
      follow: seo.follow ?? true,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
  };
}