'use client';

import { resetPassword } from '@/actions/auth';
import {
  ResetPasswordFormData,
  resetPasswordSchema,
} from '@/components/content/auth/schemas/authSchemas';
import { GeneralButton } from '@/components/generics/button/Button';
import BaseForm from '@/components/generics/form/BaseForm';
import { FormField } from '@/interfaces';
import { getAuthErrorMessage } from '@/utils/auth-errors';
import { removeTokenFromUrl } from '@/utils/url';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [isPasswordReset, setIsPasswordReset] = useState(false);

  useEffect(() => {
    const urlToken = searchParams?.get('token');
    if (urlToken && !token) {
      setToken(urlToken);
    }
  }, [searchParams, token]);

  const fields: FormField[] = [
    {
      name: 'password',
      label: 'НОВИЙ ПАРОЛЬ',
      placeholder: 'ВВЕДІТЬ НОВИЙ ПАРОЛЬ',
      type: 'password',
      required: true,
    },
    {
      name: 'confirmPassword',
      label: 'ПІДТВЕРДІТЬ ПАРОЛЬ',
      placeholder: 'ПІДТВЕРДІТЬ НОВИЙ ПАРОЛЬ',
      type: 'password',
      required: true,
    },
  ];

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (isPasswordReset) return;
    if (!token) {
      throw new Error('Токен відсутній. Будь ласка, перевірте посилання.');
    }

    const result = await resetPassword({ ...data, token });

    if (result.success) {
      setToken(null);
      const cleanUrl = removeTokenFromUrl(['token']);
      window.history.replaceState({}, '', cleanUrl);
      setIsPasswordReset(true);
    } else {
      throw new Error(result.error || 'ПОМИЛКА ПРИ СКИДАННІ ПАРОЛЮ');
    }
  };

  const successContent = (
    <div className="flex flex-col items-center text-center gap-1 375:gap-3 min376:gap-1 1440:gap-5 min1441:gap-2">
      <h1 className="text-white 375:text-[40px] min376:text-[28px] text-[28px] min1441:text-[40px] font-semibold leading-[100%] uppercase 1440:text-[80px]">
        ПАРОЛЬ УСПІШНО ЗМІНЕНО
      </h1>

      <div className="flex flex-col items-center gap-5 1440:gap-10 min1441:gap-6">
        <p className="text-white text-[10px] 375:text-xs min376:text-[10px] 1440:text-base min1441:text-sm font-normal leading-[150%]">
          Ваш пароль було успішно змінено. Тепер ви можете увійти в систему з
          новим паролем.
        </p>

        <GeneralButton
          type="button"
          text="ПЕРЕЙТИ ДО ВХОДУ"
          variant="gray-bg"
          onClick={() => router.push('/login')}
        />
      </div>
    </div>
  );

  return (
    <BaseForm
      title="ВІДНОВЛЕННЯ ПАРОЛЮ"
      schema={resetPasswordSchema}
      fields={fields}
      submitText="ВІДНОВИТИ ПАРОЛЬ"
      onSubmit={onSubmit}
      getLocalizedError={getAuthErrorMessage}
      successContent={successContent}
    />
  );
}
