import { RegisterForm } from '@/components/content/auth/RegisterForm';
import { Suspense } from 'react';
import { buildNoIndexMetadata } from '../utils/noindex-metadata';

export const metadata = buildNoIndexMetadata({
  title: 'Реєстрація | Strike Shop Action',
  canonicalPath: '/register',
  description: 'Службова сторінка реєстрації нового користувача.',
});

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
