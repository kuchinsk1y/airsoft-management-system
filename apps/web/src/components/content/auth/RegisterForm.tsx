'use client';

import { register as registerUser } from '@/actions/auth';
import OAuthSection from '@/components/content/auth/OAuthSection';
import {
  registerSchema,
  type RegisterFormData,
} from '@/components/content/auth/schemas/authSchemas';
import { GeneralButton } from '@/components/generics/button/Button';
import BaseForm from '@/components/generics/form/BaseForm';
import { FormField } from '@/interfaces';
import { getAuthErrorMessage } from '@/utils/auth-errors';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export const RegisterForm = () => {
  const searchParams = useSearchParams();
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    const error = searchParams?.get('error');
    if (error) {
      setOauthError(error);
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  const fields: FormField[] = [
    {
      name: 'email',
      label: 'E-MAIL',
      placeholder: 'ВВЕДІТЬ СВІЙ E-MAIL',
      type: 'email',
      required: true,
    },
    {
      name: 'fullName',
      label: "ПРІЗВИЩЕ ІМ'Я",
      placeholder: "ВВЕДІТЬ СВОЄ ПОВНЕ ІМ'Я",
      type: 'text',
      required: true,
    },
    {
      name: 'nickName',
      label: 'ПОЗИВНИЙ',
      placeholder: 'ВВЕДІТЬ СВІЙ ПОЗИВНИЙ',
      type: 'text',
      required: true,
    },
    {
      name: 'phoneNumber',
      label: 'НОМЕР ТЕЛЕФОНУ',
      placeholder: '+380XXXXXXXXX',
      type: 'tel',
      required: true,
    },
    {
      name: 'dateOfBirth',
      label: 'ДАТА НАРОДЖЕННЯ',
      placeholder: '',
      type: 'calendar',
      required: true,
    },
    {
      name: 'country',
      label: 'КРАЇНА',
      placeholder: 'ВВЕДІТЬ СВОЮ КРАЇНУ',
      type: 'text',
      required: true,
    },
    {
      name: 'region',
      label: 'РЕГІОН',
      placeholder: 'ВВЕДІТЬ СВІЙ РЕГІОН',
      type: 'text',
      required: true,
    },
    {
      name: 'city',
      label: 'МІСТО',
      placeholder: 'ВВЕДІТЬ СВОЄ МІСТО',
      type: 'text',
      required: true,
    },
    {
      name: 'password',
      label: 'ПАРОЛЬ',
      placeholder: 'ВВЕДІТЬ СВІЙ ПАРОЛЬ',
      type: 'password',
      required: true,
    },
    {
      name: 'confirmPassword',
      label: 'ПОВТОРИТИ ПАРОЛЬ',
      placeholder: 'ПОВТОРІТЬ СВІЙ ПАРОЛЬ',
      type: 'password',
      required: true,
    },
    {
      name: 'userAgreement',
      label: 'УГОДА КОРИСТУВАЧА',
      placeholder: '',
      type: 'checkbox',
      required: true,
      checkboxDescription: (
        <>
          Я приймаю{' '}
          <Link
            href="/terms"
            target="_blank"
            className="underline hover:no-underline"
          >
            умови використання
          </Link>{' '}
          та{' '}
          <Link
            href="/privacy-policy"
            target="_blank"
            className="underline hover:no-underline"
          >
            політику конфіденційності
          </Link>
        </>
      ),
    },
    {
      name: 'ageConfirmation',
      label: 'ПІДТВЕРДЖУЮ ВІК',
      placeholder: '',
      type: 'checkbox',
      required: true,
      checkboxDescription:
        'Підтверджую, що мені виповнилося 18 років, і я ознайомлений(а) з правилами страйкболу',
    },
  ];

  const onSubmit = async (data: RegisterFormData) => {
    const result = await registerUser(data);

    if (result.success) {
      setIsEmailSent(true);
    } else {
      if (result.error === 'Користувач з таким email або позивним вже існує') {
        const error = new Error('USER_ALREADY_EXISTS');
        (error as Error & { fields: string[] }).fields = ['email', 'nickName'];
        throw error;
      }

      throw new Error(result.error || 'ПОМИЛКА ПРИ РЕЄСТРАЦІЇ');
    }
  };

  if (isEmailSent) {
    return (
      <div className="relative">
        <div className="p-5 pt-10 sm:pt-16 sm:max-w-[70%] sm:mx-auto lg:max-w-[55%] lg:mx-auto desktop:max-w-none desktop:mx-0 desktop:px-80 flex flex-col items-center gap-6">
          <h1 className="text-white text-center text-3xl sm:text-5xl font-semibold uppercase">
            Перевірте свою пошту
          </h1>

          <p className="text-white text-center text-sm sm:text-lg">
            Ми надіслали лист із посиланням для підтвердження на Вашу електронну
            адресу.
          </p>

          <p className="text-white text-center text-sm sm:text-lg">
            Якщо лист не надійшов протягом кількох хвилин — перевірте папку
            «Спам».
          </p>

          <Link href="/login" className="mt-2">
            <GeneralButton
              type="button"
              text="Повернутися до входу"
              variant="gray-bg"
              className="cursor-pointer hover:bg-white hover:text-black transition-colors"
            />
          </Link>
        </div>
      </div>
    );
  }

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
        title="РЕЄСТРАЦІЯ"
        schema={registerSchema}
        fields={fields}
        submitText="ЗАРЕЄСТРУВАТИСЯ"
        onSubmit={onSubmit}
        topRightLink={{
          text: 'ВЖЕ МАЄТЕ АККАУНТ?',
          href: '/login',
        }}
        bottomLink={{
          text: 'ВЖЕ МАЄТЕ АККАУНТ?',
          href: '/login',
          className: 'block sm:hidden',
        }}
        getLocalizedError={(error) => {
          if (error === 'USER_ALREADY_EXISTS') {
            return 'КОРИСТУВАЧ З ТАКИМ EMAIL АБО ПОЗИВНИМ ВЖЕ ІСНУЄ';
          }
          return getAuthErrorMessage(error);
        }}
        className="pb-4 lg:pb-4 min1441:pb-8"
      />

      <OAuthSection />
    </>
  );
};
