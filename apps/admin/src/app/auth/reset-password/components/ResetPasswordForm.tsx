'use client';

import { resetPassword } from '@/actions/auth';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 256;
const PASSWORD_STRENGTH_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,256}$/;
const PASSWORD_REQUIREMENTS_TEXT = `Мінімум ${MIN_PASSWORD_LENGTH} символів без пробілів. Обовʼязково: велика й мала латинські літери, цифра та хоча б один символ, що не є літерою чи цифрою`;

const validatePassword = (password: string) => {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Пароль має містити щонайменше ${MIN_PASSWORD_LENGTH} символів`;
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Пароль не може бути довшим за ${MAX_PASSWORD_LENGTH} символів`;
  }

  if (!PASSWORD_STRENGTH_REGEX.test(password)) {
    return 'Пароль має містити велику й малу латинські літери, цифру та хоча б один символ, що не є літерою чи цифрою';
  }

  return null;
};

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isReset, setIsReset] = useState(false);

  const validate = () => {
    const passwordError = validatePassword(password);
    if (passwordError) return passwordError;

    if (!confirmPassword.trim()) {
      return 'Підтвердження пароля є обовʼязковим';
    }

    if (password !== confirmPassword) {
      return 'Паролі не співпадають';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Невалідне посилання для скидання пароля');
      return;
    }

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    const result = await resetPassword({ token, password });

    if (!result.success) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setIsReset(true);
    window.history.replaceState({}, '', '/auth/reset-password');
  };

  if (isReset) {
    return (
      <div className="space-y-5 text-center">
        <h2 className="text-2xl font-bold text-white">
          Пароль успішно змінено
        </h2>
        <p className="text-sm text-gray-300">
          Тепер ви можете увійти з новим паролем.
        </p>
        <Link
          href="/auth/sign-in"
          className="block w-full rounded-lg bg-(--color-primary) px-4 py-3 text-center font-medium text-white transition-colors hover:bg-orange-700"
        >
          Перейти до входу
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="space-y-5 text-center">
        <h2 className="text-2xl font-bold text-white">Невалідне посилання</h2>
        <p className="text-sm text-gray-300">
          Посилання для скидання пароля відсутнє або некоректне.
        </p>
        <div className="space-y-2">
          <Link
            href="/auth/forgot-password"
            className="block w-full rounded-lg bg-(--color-primary) px-4 py-3 text-center font-medium text-white transition-colors hover:bg-orange-700"
          >
            Запросити нове посилання
          </Link>
          <Link
            href="/auth/sign-in"
            className="block w-full rounded-lg bg-gray-800 px-4 py-3 text-center font-medium text-white transition-colors hover:bg-gray-700"
          >
            Повернутись на вхід
          </Link>
        </div>
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
        <p className="pb-2 text-base font-medium text-white">Новий пароль</p>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={`Мінімум ${MIN_PASSWORD_LENGTH} символів`}
            className="form-input w-full rounded-lg border border-white/30 bg-transparent p-4 pr-12 text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
            aria-label={showPassword ? 'Сховати пароль' : 'Показати пароль'}
            title={showPassword ? 'Сховати пароль' : 'Показати пароль'}
          >
            {showPassword ? (
              <MdVisibilityOff size={20} />
            ) : (
              <MdVisibility size={20} />
            )}
          </button>
        </div>
        <p className="mt-1 text-xs text-white/50">
          {PASSWORD_REQUIREMENTS_TEXT}
        </p>
      </label>

      <label className="flex flex-col">
        <p className="pb-2 text-base font-medium text-white">
          Підтвердіть пароль
        </p>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Повторіть новий пароль"
            className="form-input w-full rounded-lg border border-white/30 bg-transparent p-4 pr-12 text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
            aria-label={
              showConfirmPassword ? 'Сховати пароль' : 'Показати пароль'
            }
            title={showConfirmPassword ? 'Сховати пароль' : 'Показати пароль'}
          >
            {showConfirmPassword ? (
              <MdVisibilityOff size={20} />
            ) : (
              <MdVisibility size={20} />
            )}
          </button>
        </div>
      </label>

      <button
        type="submit"
        disabled={isLoading}
        className="h-12 w-full rounded-lg bg-(--color-primary) font-bold text-white transition-transform duration-200 hover:scale-[1.02] disabled:opacity-50"
      >
        {isLoading ? 'Оновлюємо...' : 'Оновити пароль'}
      </button>
      {isLoading ? (
        <div className=" flex items-center justify-center backdrop-blur-[1px]">
          <LoadingSpinner size="sm" thickness="thin" />
        </div>
      ) : (
        <div className="h-6"></div>
      )}
    </form>
  );
}
