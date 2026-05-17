import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const ACCESS_TOKEN = 'access_token'
const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')
const API_KEY = process.env.NEXT_PUBLIC_API_KEY

async function validateAccessToken(token: string): Promise<boolean> {
  if (!API_URL) {
    return false
  }

  try {
    const response = await fetch(`${API_URL}/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
      },
      cache: 'no-store',
    })

    return response.ok
  } catch {
    return false
  }
}

export async function proxy(request: NextRequest) {
  const urlToken = request.nextUrl.searchParams.get(ACCESS_TOKEN)

  if (urlToken) {
    const isValidToken = await validateAccessToken(urlToken)

    if (!isValidToken) {
      const signInUrl = new URL('/auth/sign-in', request.url)
      signInUrl.searchParams.set('error', 'invalid-token')
      return NextResponse.redirect(signInUrl)
    }

    const cleanUrl = request.nextUrl.clone()
    cleanUrl.searchParams.delete(ACCESS_TOKEN)

    const response = NextResponse.redirect(cleanUrl)
    response.cookies.set(ACCESS_TOKEN, urlToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    })

    return response
  }

  const authToken = request.cookies.get('access_token')?.value
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')

  // Если нет токена и пытаемся получить доступ к защищенным маршрутам
  if (!authToken && !isAuthPage) {
    const signInUrl = new URL('/auth/sign-in', request.url);
    return NextResponse.redirect(signInUrl);
  }

  if (authToken && isAuthPage) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|uploads|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|avif|woff|woff2|ttf)$).*)',
  ],
};
