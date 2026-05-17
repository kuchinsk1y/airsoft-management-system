import { NEXT_PUBLIC_WEB_URL } from '@/utils/config';
import { headers } from 'next/headers';

export type SiteLocale = 'uk' | 'ru';

const DEFAULT_LOCALE: SiteLocale = 'uk';
const RU_PREFIX = '/ru';
const WEB_BASE_URL = NEXT_PUBLIC_WEB_URL.replace(/\/$/, '');

function normalizePathname(pathname: string): string {
  const withoutQuery = pathname.split('?')[0]?.split('#')[0] ?? '/';
  if (!withoutQuery.startsWith('/')) return `/${withoutQuery}`;
  return withoutQuery || '/';
}

function stripLocalePrefix(pathname: string): string {
  if (pathname === RU_PREFIX) return '/';
  if (pathname.startsWith(`${RU_PREFIX}/`)) {
    return pathname.slice(RU_PREFIX.length) || '/';
  }
  return pathname;
}

function withLocalePrefix(pathname: string, locale: SiteLocale): string {
  const normalized = normalizePathname(pathname);
  const basePath = stripLocalePrefix(normalized);

  if (locale === 'ru') {
    return basePath === '/' ? RU_PREFIX : `${RU_PREFIX}${basePath}`;
  }

  return basePath;
}

function absoluteUrl(pathname: string): string {
  const normalized = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
  return `${WEB_BASE_URL}${normalized}`;
}

export async function getRequestLocale(): Promise<SiteLocale> {
  try {
    const localeHeader = (await headers()).get('x-locale');
    return localeHeader === 'ru' ? 'ru' : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function localizePath(pathname: string, locale: SiteLocale = DEFAULT_LOCALE): string {
  return withLocalePrefix(pathname, locale);
}

export async function getLocalizedAlternates(
  pathname: string,
  locale?: SiteLocale,
) {
  const resolvedLocale = locale ?? (await getRequestLocale());
  const canonicalPath = withLocalePrefix(pathname, resolvedLocale);
  const ukPath = withLocalePrefix(pathname, 'uk');
  const ruPath = withLocalePrefix(pathname, 'ru');

  return {
    canonical: absoluteUrl(canonicalPath),
    languages: {
      uk: absoluteUrl(ukPath),
      ru: absoluteUrl(ruPath),
      'x-default': absoluteUrl(ukPath),
    },
  };
}
