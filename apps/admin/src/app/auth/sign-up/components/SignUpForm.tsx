'use client';

import { registerUser } from '@/actions/auth';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MdCheckCircle, MdVisibility, MdVisibilityOff } from 'react-icons/md';

const MIN_FULL_NAME_LENGTH = 2;
const MIN_NICKNAME_LENGTH = 2;
const MIN_LOCATION_LENGTH = 2;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 256;
const PASSWORD_STRENGTH_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,256}$/;

const PASSWORD_REQUIREMENTS_TEXT = `Мінімум ${MIN_PASSWORD_LENGTH} символів без пробілів. Обовʼязково: велика й мала латинські літери, цифра та хоча б один символ, що не є літерою чи цифрою (наприклад -, #, @)`;

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

export default function SignUpForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    nickName: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    country: 'Україна',
    region: '',
    city: '',
    userAgreement: false,
    ageConfirmation: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setError('');
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validateForm = () => {
    const fullName = formData.fullName.trim();
    const nickName = formData.nickName.trim();
    const country = formData.country.trim();
    const region = formData.region.trim();
    const city = formData.city.trim();
    const phone = formData.phoneNumber.trim();

    if (fullName.length < MIN_FULL_NAME_LENGTH) {
      return `Повне ім'я має містити щонайменше ${MIN_FULL_NAME_LENGTH} символи`;
    }

    if (nickName.length < MIN_NICKNAME_LENGTH) {
      return `Нікнейм має містити щонайменше ${MIN_NICKNAME_LENGTH} символи`;
    }

    if (country.length < MIN_LOCATION_LENGTH) {
      return `Країна має містити щонайменше ${MIN_LOCATION_LENGTH} символи`;
    }

    if (region.length < MIN_LOCATION_LENGTH) {
      return `Область має містити щонайменше ${MIN_LOCATION_LENGTH} символи`;
    }

    if (city.length < MIN_LOCATION_LENGTH) {
      return `Місто має містити щонайменше ${MIN_LOCATION_LENGTH} символи`;
    }

    if (!phone) {
      return "Номер телефону є обов'язковим";
    }

    if (!/^\+?380[0-9]{9}$/.test(phone)) {
      return 'Номер телефону має бути у форматі +380XXXXXXXXX (наприклад +380501234567)';
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) return passwordError;

    if (!formData.confirmPassword.trim()) {
      return 'Підтвердження пароля є обовʼязковим';
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Паролі не співпадають';
    }

    if (!formData.userAgreement || !formData.ageConfirmation) {
      return 'Необхідно прийняти всі угоди';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setIsLoading(false);
      return;
    }

    const result = await registerUser({
      ...formData,
      phoneNumber: formData.phoneNumber.trim(),
      frontendUrl: `${window.location.origin}/auth/verify`,
    });

    if (result.success) {
      setRegistered(true);
      setRegisteredEmail(formData.email);
    } else {
      setError(result.error || 'Помилка реєстрації');
    }

    setIsLoading(false);
  };

  if (registered) {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <MdCheckCircle size={48} className="text-orange-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Реєстрація успішна!
            </h2>
            <p className="text-gray-400">
              На адресу{' '}
              <span className="text-white font-medium">{registeredEmail}</span>{' '}
              відправлено посилання для підтвердження.
            </p>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
          <p className="text-sm text-gray-300">
            <span className="text-white font-medium">Крок 1:</span> Перевірте
            вашу поштову скриньку
          </p>
          <p className="text-sm text-gray-300">
            <span className="text-white font-medium">Крок 2:</span> Кликніть на
            посилання в листі
          </p>
          <p className="text-sm text-gray-300">
            <span className="text-white font-medium">Крок 3:</span> Повернетеся
            на сторінку входу
          </p>
        </div>

        <Link
          href="/auth/sign-in"
          className="w-full bg-(--color-primary) hover:bg-orange-700 text-white py-3 px-4 rounded-lg font-medium transition-colors text-center"
        >
          Повернутись на вхід
        </Link>

        <p className="text-center text-gray-400 text-sm">
          Не отримали лист? Перевірте папку Спам або спробуйте{' '}
          <button
            onClick={() => setRegistered(false)}
            className="text-orange-500 hover:text-orange-400 font-medium"
          >
            зареєструватись заново
          </button>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-100/10 rounded-lg">
          {error}
        </div>
      )}

      <label className="flex flex-col">
        <p className="text-white text-base font-medium pb-2">
          Повне ім&apos;я <span className="text-red-500">*</span>
        </p>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          value={formData.fullName}
          onChange={handleChange}
          className="form-input w-full rounded-lg p-4 text-white bg-transparent border border-white/30 focus:outline-none focus:ring-1 focus:ring-orange-500"
          placeholder="Імʼя Прізвище"
        />
        <p className="mt-1 text-xs text-white/50">Мінімум 2 символи</p>
      </label>

      <label className="flex flex-col">
        <p className="text-white text-base font-medium pb-2">
          Email <span className="text-red-500">*</span>
        </p>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
          className="form-input w-full rounded-lg p-4 text-white bg-transparent border border-white/30 focus:outline-none focus:ring-1 focus:ring-orange-500"
          placeholder="your@email.com"
        />
      </label>

      <label className="flex flex-col">
        <p className="text-white text-base font-medium pb-2">
          Нікнейм <span className="text-red-500">*</span>
        </p>
        <input
          id="nickName"
          name="nickName"
          type="text"
          required
          value={formData.nickName}
          onChange={handleChange}
          className="form-input w-full rounded-lg p-4 text-white bg-transparent border border-white/30 focus:outline-none focus:ring-1 focus:ring-orange-500"
          placeholder="nickname"
        />
        <p className="mt-1 text-xs text-white/50">Мінімум 2 символи</p>
      </label>

      <label className="flex flex-col">
        <p className="text-white text-base font-medium pb-2">
          Телефон <span className="text-red-500">*</span>
        </p>
        <input
          id="phoneNumber"
          name="phoneNumber"
          type="tel"
          required
          value={formData.phoneNumber}
          onChange={handleChange}
          className="form-input w-full rounded-lg p-4 text-white bg-transparent border border-white/30 focus:outline-none focus:ring-1 focus:ring-orange-500"
          placeholder="+380123456789"
        />
        <p className="mt-1 text-xs text-white/50">Формат +380XXXXXXXXX</p>
      </label>

      <label className="flex flex-col">
        <p className="text-white text-base font-medium pb-2">
          Дата народження <span className="text-red-500">*</span>
        </p>
        <input
          id="dateOfBirth"
          name="dateOfBirth"
          type="date"
          required
          value={formData.dateOfBirth}
          onChange={handleChange}
          className="form-input w-full rounded-lg p-4 text-white bg-transparent border border-white/30 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
      </label>

      <label className="flex flex-col">
        <p className="text-white text-base font-medium pb-2">
          Країна <span className="text-red-500">*</span>
        </p>
        <input
          id="country"
          name="country"
          type="text"
          required
          value={formData.country}
          onChange={handleChange}
          className="form-input w-full rounded-lg p-4 text-white bg-transparent border border-white/30 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
      </label>

      <label className="flex flex-col">
        <p className="text-white text-base font-medium pb-2">
          Область <span className="text-red-500">*</span>
        </p>
        <input
          id="region"
          name="region"
          type="text"
          required
          value={formData.region}
          onChange={handleChange}
          className="form-input w-full rounded-lg p-4 text-white bg-transparent border border-white/30 focus:outline-none focus:ring-1 focus:ring-orange-500"
          placeholder="Львівська"
        />
        <p className="mt-1 text-xs text-white/50">Мінімум 2 символи</p>
      </label>

      <label className="flex flex-col">
        <p className="text-white text-base font-medium pb-2">
          Місто <span className="text-red-500">*</span>
        </p>
        <input
          id="city"
          name="city"
          type="text"
          required
          value={formData.city}
          onChange={handleChange}
          className="form-input w-full rounded-lg p-4 text-white bg-transparent border border-white/30 focus:outline-none focus:ring-1 focus:ring-orange-500"
          placeholder="Львів"
        />
        <p className="mt-1 text-xs text-white/50">Мінімум 2 символи</p>
      </label>

      <label className="flex flex-col">
        <p className="text-white text-base font-medium pb-2">
          Пароль <span className="text-red-500">*</span>
        </p>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            value={formData.password}
            onChange={handleChange}
            className="form-input w-full rounded-lg p-4 pr-12 text-white bg-transparent border border-white/30 focus:outline-none focus:ring-1 focus:ring-orange-500"
            placeholder={`Мінімум ${MIN_PASSWORD_LENGTH} символів`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
            aria-label={showPassword ? 'Сховати пароль' : 'Показати пароль'}
            title={showPassword ? 'Сховати пароль' : 'Показати пароль'}
          >
            {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
          </button>
        </div>
        <p className="mt-1 text-xs text-white/50">
          {PASSWORD_REQUIREMENTS_TEXT}
        </p>
      </label>

      <label className="flex flex-col">
        <p className="text-white text-base font-medium pb-2">
          Підтвердження пароля <span className="text-red-500">*</span>
        </p>
        <div className="relative">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            className="form-input w-full rounded-lg p-4 pr-12 text-white bg-transparent border border-white/30 focus:outline-none focus:ring-1 focus:ring-orange-500"
            placeholder="Повторіть пароль"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
            aria-label={showConfirmPassword ? 'Сховати пароль' : 'Показати пароль'}
            title={showConfirmPassword ? 'Сховати пароль' : 'Показати пароль'}
          >
            {showConfirmPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
          </button>
        </div>
      </label>

      <div className="space-y-3">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="userAgreement"
            checked={formData.userAgreement}
            onChange={handleChange}
            required
            className="mt-1 w-4 h-4 rounded border-white/20 bg-white/10 text-orange-600 focus:ring-2 focus:ring-orange-500"
          />
          <span className="text-sm text-white">
            Я приймаю умови <span className="text-red-500">*</span>
          </span>
        </label>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="ageConfirmation"
            checked={formData.ageConfirmation}
            onChange={handleChange}
            required
            className="mt-1 w-4 h-4 rounded border-white/20 bg-white/10 text-orange-600 focus:ring-2 focus:ring-orange-500"
          />
          <span className="text-sm text-white">
            Підтверджую, що мені виповнилося 18 років{' '}
            <span className="text-red-500">*</span>
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 bg-(--color-primary) text-white rounded-lg font-bold hover:scale-[1.02] transition-transform duration-200 disabled:opacity-50"
      >
        {isLoading ? 'Реєстрація...' : 'Зареєструватися'}
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
