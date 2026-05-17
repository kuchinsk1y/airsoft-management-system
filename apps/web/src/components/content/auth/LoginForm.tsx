'use client';

import { login, resendVerificationEmail } from '@/actions/auth';
import OAuthSection from '@/components/content/auth/OAuthSection';
import {
  LoginFormData,
  loginSchema,
} from '@/components/content/auth/schemas/authSchemas';
import BaseForm from '@/components/generics/form/BaseForm';
import { useUser } from '@/contexts/UserContext';
import { FormField } from '@/interfaces';
import { getAuthErrorMessage } from '@/utils/auth-errors';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useUser();
  const [showResendButton, setShowResendButton] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const [oauthError, setOauthError] = useState<string | null>(null);

  const fields: FormField[] = [
    {
      name: 'email',
      label: 'E-MAIL',
      placeholder: 'ВВЕДІТЬ СВІЙ E-MAIL',
      type: 'email',
      required: true,
    },
    {
      name: 'password',
      label: 'ПАРОЛЬ',
      placeholder: 'ВВЕДІТЬ СВІЙ ПАРОЛЬ',
      type: 'password',
      required: true,
    },
  ];

  useEffect(() => {
    const error = searchParams?.get('error');
    if (error) {
      setOauthError(error);
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading && user) {
      window.location.assign('/');
    }
  }, [isLoading, user]);

  const onSubmit = async (data: LoginFormData) => {
    const result = await login(data);

    if (result.success) {
      window.dispatchEvent(new CustomEvent('user-logged-in'));
      router.refresh();
      router.push('/');
    } else {
      if (result.error === 'INVALID_CREDENTIALS') {
        const error = new Error('INVALID_CREDENTIALS');
        (error as Error & { fields: string[] }).fields = ['email', 'password'];
        throw error;
      }

      if (result.error === 'EMAIL_NOT_VERIFIED') {
        setUserEmail(data.email);
        setShowResendButton(true);
        const error = new Error('EMAIL_NOT_VERIFIED');
        (error as Error & { field: string }).field = 'email';
        throw error;
      }

      throw new Error(result.error || 'ПОМИЛКА ПРИ ВХОДІ');
    }
  };

  const handleResendVerification = async () => {
    try {
      const result = await resendVerificationEmail(userEmail);
      if (result.success) {
        setShowResendButton(false);
        setResendMessage('Лист відправлено повторно!');
        setTimeout(() => setResendMessage(''), 3000);
      } else {
        setResendMessage('Помилка при відправці листа');
        setTimeout(() => setResendMessage(''), 3000);
      }
    } catch {
      setResendMessage('Помилка при відправці листа');
      setTimeout(() => setResendMessage(''), 3000);
    }
  };

  return (
    <>
      {oauthError && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-lg px-4">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded shadow-lg">
            <p className="text-sm">{getAuthErrorMessage(oauthError)}</p>
            <button
              onClick={() => setOauthError(null)}
              className="mt-2 text-xs underline hover:no-underline cursor-pointer"
            >
              Закрити
            </button>
          </div>
        </div>
      )}

      <BaseForm
        title="ВХІД"
        schema={loginSchema}
        fields={fields}
        submitText={showResendButton ? 'ВІДПРАВИТИ ПОВТОРНО' : 'УВІЙТИ'}
        onSubmit={showResendButton ? handleResendVerification : onSubmit}
        bypassValidation={showResendButton}
        topRightLink={{
          text: 'ЩЕ НЕ ЗАРЕЄСТРОВАНИЙ?',
          href: '/register',
          alwaysVisible: true,
        }}
        bottomLink={{
          text: 'СКИНУТИ ПАРОЛЬ',
          href: '/forgot-password',
        }}
        getLocalizedError={getAuthErrorMessage}
        additionalMessage={resendMessage}
        className="pb-4 lg:pb-4 min1441:pb-8"
      />

      <OAuthSection />
    </>
  );
}
