'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Web app route error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
      <span
        className="pointer-events-none text-[120px] font-semibold leading-none text-white/5 min991:text-[180px]"
        aria-hidden="true"
      >
        500
      </span>

      <h1 className="-mt-4 mb-4 text-3xl font-semibold uppercase tracking-wide min991:text-5xl">
        Сталася помилка
      </h1>

      <p className="mb-8 max-w-md text-base text-gray-400">
        Ми вже отримали інформацію про проблему. Спробуйте оновити сторінку або
        повернутися на головну.
      </p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-block border border-white px-8 py-3 text-sm font-semibold uppercase tracking-widest text-white transition-colors duration-200 hover:bg-white hover:text-black"
        >
          Спробувати ще раз
        </button>

        <Link
          href="/"
          className="inline-block border border-white/40 px-8 py-3 text-sm font-semibold uppercase tracking-widest text-white/90 transition-colors duration-200 hover:border-white hover:text-white"
        >
          На головну
        </Link>
      </div>
    </div>
  );
}
