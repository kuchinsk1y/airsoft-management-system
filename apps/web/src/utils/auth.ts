'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { OAUTH_PROTECTED_PAGES } from './auth-constants';
import { NODE_ENV } from './config';

const ACCESS_TOKEN = 'access_token';

const revalidateAuthSensitivePaths = () => {
  revalidatePath('/profile', 'layout');
  revalidatePath('/checkout');
  revalidatePath('/login');
};

export const getAuthToken = async (): Promise<string | null> => {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(ACCESS_TOKEN)?.value || null;
  } catch {
    return null;
  }
};

export const setAuthToken = async (token: string): Promise<void> => {
  try {
    const cookieStore = await cookies();
    cookieStore.set(ACCESS_TOKEN, token, {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24,
    });
    revalidateAuthSensitivePaths();
  } catch {}
};

export const removeAuthToken = async (): Promise<void> => {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(ACCESS_TOKEN);
    revalidateAuthSensitivePaths();
  } catch {}
};

export const requireAuth = async (
  redirectTo: string = '/login',
): Promise<string> => {
  const token = await getAuthToken();
  if (!token) {
    redirect(redirectTo);
  }
  return token;
};

export const processAccessToken = async (token: string): Promise<void> => {
  await setAuthToken(token);
};

export const processAccessTokenFromUrl = async (
  searchParams: { [key: string]: string | string[] | undefined },
  pathname?: string,
): Promise<boolean> => {
  if (
    pathname &&
    OAUTH_PROTECTED_PAGES.includes(
      pathname as (typeof OAUTH_PROTECTED_PAGES)[number],
    )
  ) {
    return false;
  }

  const oauthToken =
    typeof searchParams.oauth_token === 'string'
      ? searchParams.oauth_token
      : null;
  const accessToken =
    typeof searchParams.access_token === 'string'
      ? searchParams.access_token
      : null;
  const verificationToken =
    typeof searchParams.token === 'string' ? searchParams.token : null;
  const token = oauthToken || accessToken || verificationToken;

  if (!token) {
    return false;
  }

  await processAccessToken(token);
  return true;
};
