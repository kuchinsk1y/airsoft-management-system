'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Web app global error:', error);
  }, [error]);

  return (
    <html lang="uk-UA">
      <body className="bg-black text-white">
        <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <h1 className="mb-4 text-3xl font-semibold uppercase min991:text-5xl">
            Критична помилка
          </h1>
          <p className="mb-8 max-w-md text-gray-400">
            Тимчасово не вдалося завантажити сторінку.
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
      </body>
    </html>
  );
}
