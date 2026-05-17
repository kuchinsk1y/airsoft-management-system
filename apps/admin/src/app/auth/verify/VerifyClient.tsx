'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MdCheckCircle, MdError } from 'react-icons/md';

export default function VerifyClient({
  token,
  verificationResult,
}: {
  token: string | null;
  verificationResult: { success: boolean; error?: string } | null;
}) {
  const router = useRouter();

  const getInitialStatus = (): 'loading' | 'success' | 'error' => {
    if (!token) return 'error';
    if (verificationResult) {
      return verificationResult.success ? 'success' : 'error';
    }
    return 'loading';
  };

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    getInitialStatus(),
  );

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    if (verificationResult) {
      if (verificationResult.success) {
        setStatus('success');
        const timer = setTimeout(() => {
          router.push('/auth/sign-in?verified=true');
        }, 2000);
        return () => clearTimeout(timer);
      } else {
        setStatus('error');
      }
    } else if (token) {
      setStatus('loading');
    }
  }, [token, verificationResult, router]);

  if (status === 'success') {
    return (
      <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <MdCheckCircle size={48} className="text-orange-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">
              Успішно верифіковано!
            </h2>
            <p className="text-gray-400">
              Ваш email підтверджено. Перенаправлення на вхід...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          Верифікація Email
        </h1>
        <p className="text-gray-400">Підтвердіть вашу електронну адресу</p>
      </div>

      <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-8">
        {status === 'loading' && (
          <div className="text-center space-y-4">
            <div className="inline-block">
              <div className="w-12 h-12 rounded-full border-2 border-gray-800 border-t-orange-500 animate-spin"></div>
            </div>
            <p className="text-white">Верифікація в процесі...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <MdError size={48} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                Помилка верифікації
              </h2>
              <p className="text-gray-400 mb-4">
                Невалідний або прострочений токен верифікації
              </p>
              <div className="space-y-2">
                <Link
                  href="/auth/sign-in"
                  className="block w-full bg-(--color-primary) hover:bg-orange-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Повернутись на вхід
                </Link>
                <Link
                  href="/auth/sign-up"
                  className="block w-full bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Реєстрація заново
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {status === 'error' && (
        <div className="text-center">
          <p className="text-gray-400">
            Вже маєте аккаунт?{' '}
            <Link
              href="/auth/sign-in"
              className="text-orange-500 hover:text-orange-400 font-medium"
            >
              Увійти
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
