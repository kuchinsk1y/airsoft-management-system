import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { NEXT_PUBLIC_ADMIN_URL } from '@/utils/config';

const ACCESS_TOKEN = 'access_token';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN)?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const adminUrl = new URL('/events', NEXT_PUBLIC_ADMIN_URL);
  adminUrl.searchParams.set(ACCESS_TOKEN, token);

  return NextResponse.redirect(adminUrl);
}