import ResetPasswordForm from '@/components/content/auth/ResetPasswordForm';
import { Suspense } from 'react';
import { buildNoIndexMetadata } from '../utils/noindex-metadata';

export const metadata = buildNoIndexMetadata({
  title: 'Зміна пароля | Strike Shop Action',
  canonicalPath: '/reset-password',
  description: 'Службова сторінка зміни пароля.',
});

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
