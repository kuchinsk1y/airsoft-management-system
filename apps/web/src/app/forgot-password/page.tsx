import ForgotPasswordForm from '@/components/content/auth/ForgotPasswordForm';
import { buildNoIndexMetadata } from '../utils/noindex-metadata';

export const metadata = buildNoIndexMetadata({
  title: 'Відновлення пароля | Strike Shop Action',
  canonicalPath: '/forgot-password',
  description: 'Службова сторінка відновлення доступу до акаунта.',
});

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
