'use client';

import { sendResetPasswordEmail } from '@/actions/auth';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError("Email є обов'язковим");
      return;
    }

    setIsLoading(true);
    const result = await sendResetPasswordEmail(
      normalizedEmail,
      `${window.location.origin}/auth/reset-password`,
    );

    if (!result.success) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setIsSent(true);
  };

  if (isSent) {
    return (
      <div className="space-y-5 text-center">
        <h2 className="text-2xl font-bold text-white">Перевірте email</h2>
        <p className="text-sm text-gray-300">
          Якщо вказана адреса існує, ми надіслали лист із посиланням для
          скидання пароля.
        </p>
        <Link
          href="/auth/sign-in"
          className="block w-full rounded-lg bg-(--color-primary) px-4 py-3 text-center font-medium text-white transition-colors hover:bg-orange-700"
        >
          Повернутись на вхід
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div className="rounded-lg bg-red-100/10 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      <label className="flex flex-col">
        <p className="pb-2 text-base font-medium text-white">Email</p>
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Введіть свою електронну адресу"
          className="form-input w-full rounded-lg border border-white/30 bg-transparent p-4 text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
          required
        />
      </label>

      <button
        type="submit"
        disabled={isLoading}
        className="h-12 w-full rounded-lg bg-(--color-primary) font-bold text-white transition-transform duration-200 hover:scale-[1.02] disabled:opacity-50"
      >
        {isLoading ? 'Надсилаємо...' : 'Надіслати посилання'}
      </button>
      {isLoading ? (
        <div className=" flex items-center justify-center backdrop-blur-[1px]">
          <LoadingSpinner size="sm" thickness="thin" />
        </div>
      ) : (
        <div className="h-6"></div>
      )}

      <div className="text-center">
        <p className="text-sm text-white/70">
          Згадали пароль?{' '}
          <Link
            href="/auth/sign-in"
            className="font-medium text-orange-500 hover:text-orange-400"
          >
            Увійти
          </Link>
        </p>
      </div>
    </form>
  );
}
