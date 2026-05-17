import { NextRequest, NextResponse } from 'next/server';

const FILE_EXTENSION_RE = /\.[a-zA-Z0-9]+$/;
const RU_PREFIX = '/ru';

function shouldNormalizePath(pathname: string): boolean {
  if (/\/index\.php$/i.test(pathname)) {
    return true;
  }

  const normalized = normalizePathname(pathname);
  const segments = normalized.split('/').filter(Boolean);

  if (segments.length === 0) {
    return true;
  }

  if (segments.length === 1) {
    return true;
  }

  if (segments.length === 2 && segments[0] === 'ratings') {
    return segments[1] === 'teams-rating' || segments[1] === 'players-rating';
  }

  return false;
}

function normalizePathname(pathname: string): string {
  let normalized = pathname;

  normalized = normalized.replace(/\/index\.php$/i, '');
  if (!normalized) {
    normalized = '/';
  }

  normalized = normalized.replace(/_/g, '-');
  normalized = normalized.replace(/\/+/g, '/');
  normalized = normalized.toLowerCase();

  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

function normalizeSearchParams(url: URL): URLSearchParams {
  const params = new URLSearchParams(url.searchParams);
  const page = params.get('page');
  const offset = params.get('offset');

  if (page === '0' || page === '1') {
    params.delete('page');
  }

  // offset=0 is the first page — same as no parameter
  if (offset === '0') {
    params.delete('offset');
  }

  return params;
}

export function proxy(request: NextRequest): NextResponse {
  const { nextUrl } = request;
  const pathname = nextUrl.pathname;
  const isIndexPhpPath = /\/index\.php$/i.test(pathname);
  const method = request.method.toUpperCase();

  // Server actions and other non-idempotent requests must not be rewritten/redirected.
  if (method !== 'GET' && method !== 'HEAD') {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  const isRuLocalePath = pathname === RU_PREFIX || pathname.startsWith(`${RU_PREFIX}/`);
  requestHeaders.set('x-locale', isRuLocalePath ? 'ru' : 'uk');
  requestHeaders.set('x-pathname', pathname);

  if (FILE_EXTENSION_RE.test(pathname) && !isIndexPhpPath) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  if (isRuLocalePath) {
    const rewriteUrl = nextUrl.clone();
    rewriteUrl.pathname = pathname.replace(/^\/ru(?=\/|$)/, '') || '/';

    return NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  const normalizedPathname = normalizePathname(pathname);
  const normalizedSearchParams = normalizeSearchParams(nextUrl);
  const normalizedSearch = normalizedSearchParams.toString();
  const currentSearch = nextUrl.searchParams.toString();
  const canNormalize = shouldNormalizePath(pathname);

  if (
    canNormalize &&
    (normalizedPathname !== pathname ||
      normalizedSearch !== currentSearch)
  ) {
    const redirectUrl = nextUrl.clone();
    redirectUrl.pathname = normalizedPathname;
    redirectUrl.search = normalizedSearch;

    return NextResponse.redirect(redirectUrl, 301);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico|sitemap.xml|robots.txt).*)'],
};