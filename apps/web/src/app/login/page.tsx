import LoginForm from '@/components/content/auth/LoginForm';
import { buildNoIndexMetadata } from '../utils/noindex-metadata';
import { getAuthToken } from '@/utils/auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export const metadata = buildNoIndexMetadata({
  title: 'Вхід | Strike Shop Action',
  canonicalPath: '/login',
  description: 'Службова сторінка входу в акаунт.',
});

export default async function LoginPage() {
  const token = await getAuthToken();
  if (token) {
    redirect('/');
  }

  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
