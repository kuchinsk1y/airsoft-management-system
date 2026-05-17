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
    console.error('Admin global error:', error);
  }, [error]);

  return (
    <html lang="uk-UA">
      <body className="bg-black text-white">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-xl">
            <h1 className="text-3xl font-semibold mb-3">Критична помилка</h1>
            <p className="text-white/60 mb-8">
              Не вдалося завантажити адмін-панель.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={reset}
                className="inline-block px-6 py-2 border border-white text-sm font-medium hover:bg-white hover:text-black transition-colors"
              >
                Спробувати ще раз
              </button>
              <Link
                href="/dashboard"
                className="inline-block px-6 py-2 border border-white/40 text-sm font-medium text-white/90 hover:text-white hover:border-white transition-colors"
              >
                На дашборд
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
