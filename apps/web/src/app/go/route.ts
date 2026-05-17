import { NextRequest, NextResponse } from 'next/server';

const FALLBACK_PATH = '/';

const parseRedirectTarget = (value: string | null): URL | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export function GET(request: NextRequest) {
  const target = parseRedirectTarget(request.nextUrl.searchParams.get('to'));

  if (!target) {
    return NextResponse.redirect(new URL(FALLBACK_PATH, request.url));
  }

  const response = NextResponse.redirect(target);
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  return response;
}
