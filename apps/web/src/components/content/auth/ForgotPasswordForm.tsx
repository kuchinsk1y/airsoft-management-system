'use client';

import { sendResetPasswordEmail } from '@/actions/auth';
import { GeneralButton } from '@/components/generics/button/Button';
import BaseForm from '@/components/generics/form/BaseForm';
import { FormField } from '@/interfaces';
import { getAuthErrorMessage } from '@/utils/auth-errors';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.email('НЕВІРНИЙ ФОРМАТ EMAIL'),
});

export default function ForgotPasswordForm() {
  const router = useRouter();

  const fields: FormField[] = [
    {
      name: 'email',
      label: 'E-MAIL',
      placeholder: 'ВВЕДІТЬ СВІЙ E-MAIL',
      type: 'email',
      required: true,
    },
  ];

  const getLocalizedError = getAuthErrorMessage;

  const onSubmit = async (data: z.infer<typeof forgotPasswordSchema>) => {
    await sendResetPasswordEmail(data.email);
  };

  const successContent = (
    <div className="flex flex-col items-center text-center gap-1 375:gap-3 min376:gap-1 1440:gap-5 min1441:gap-2">
      <h1 className="text-white 375:text-[40px] min376:text-[28px] text-[28px] min1441:text-[40px] font-semibold leading-[100%] uppercase 1440:text-[80px]">
        ПЕРЕВІРТЕ EMAIL
      </h1>

      <div className="flex flex-col items-center gap-5 1440:gap-10 min1441:gap-6">
        <p className="text-white text-[10px] 375:text-xs min376:text-[10px] 1440:text-base min1441:text-sm font-normal leading-[150%]">
          Якщо Ви вказали вірну електронну адресу, ми надіслали інструкції для скидання пароля на
          Вашу пошту.
        </p>

        <GeneralButton
          type="button"
          text="НАЗАД ДО ВХОДУ"
          variant="gray-bg"
          onClick={() => router.push('/login')}
        />
      </div>
    </div>
  );

  return (
    <BaseForm
      title="СКИНУТИ ПАРОЛЬ"
      schema={forgotPasswordSchema}
      fields={fields}
      submitText="СКИНУТИ ПАРОЛЬ"
      onSubmit={onSubmit}
      bottomLink={{
        text: 'НАЗАД ДО ВХОДУ',
        href: '/login',
      }}
      successContent={successContent}
      getLocalizedError={getLocalizedError}
    />
  );
}
