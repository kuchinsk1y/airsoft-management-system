import { verifyEmail } from '@/actions/auth';
import { GeneralButton } from '@/components/generics/button/Button';
import { VerifyPageProps } from '@/interfaces';
import { getTokenFromUrl } from '@/utils/token-utils';
import Link from 'next/link';
import { buildNoIndexMetadata } from '../utils/noindex-metadata';

export const metadata = buildNoIndexMetadata({
  title: 'Підтвердження email | Strike Shop Action',
  canonicalPath: '/verify',
  description: 'Службова сторінка підтвердження email.',
});

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const token = getTokenFromUrl(await searchParams);

  if (!token) {
    return (
      <div className="relative">
        <div className="p-5 sm:max-w-[70%] sm:mx-auto lg:max-w-[55%] lg:mx-auto desktop:max-w-none desktop:mx-0 desktop:px-80 flex flex-col items-center gap-6 pt-10 sm:pt-16">
          <h2 className="text-white text-center text-3xl sm:text-5xl font-semibold uppercase">
            Помилка
          </h2>
          <p className="text-white text-center text-sm sm:text-lg">
            Неправильне посилання для підтвердження
          </p>
          <Link href="/login" className="mt-2">
            <GeneralButton
              type="button"
              text="ПЕРЕЙТИ ДО ВХОДУ"
              variant="gray-bg"
              className="cursor-pointer"
            />
          </Link>
        </div>
      </div>
    );
  }

  const result = await verifyEmail(token);

  if (!result.success) {
    return (
      <div className="relative">
        <div className="p-5 sm:max-w-[70%] sm:mx-auto lg:max-w-[55%] lg:mx-auto desktop:max-w-none desktop:mx-0 desktop:px-80 flex flex-col items-center gap-6 pt-10 sm:pt-16">
          <h2 className="text-white text-center text-3xl sm:text-5xl font-semibold uppercase">
            Помилка підтвердження
          </h2>
          <p className="text-white text-center text-sm sm:text-lg">
            {result.error || 'Не вдалося підтвердити email'}
          </p>
          <Link href="/login" className="mt-2">
            <GeneralButton
              type="button"
              text="ПЕРЕЙТИ ДО ВХОДУ"
              variant="gray-bg"
              className="cursor-pointer"
            />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="p-5 sm:max-w-[70%] sm:mx-auto lg:max-w-[55%] lg:mx-auto desktop:max-w-none desktop:mx-0 desktop:px-80 flex flex-col items-center gap-6 pt-10 sm:pt-16">
        <h2 className="text-white text-center text-3xl sm:text-5xl font-semibold uppercase">
          Email підтверджено
        </h2>
        <p className="text-white text-center text-sm sm:text-lg">
          Тепер ви можете увійти до свого акаунта.
        </p>
        <Link href="/login" className="mt-2">
          <GeneralButton
            type="button"
            text="ПЕРЕЙТИ ДО ВХОДУ"
            variant="gray-bg"
            className="cursor-pointer hover:bg-white hover:text-black transition-colors"
          />
        </Link>
      </div>
    </div>
  );
}
