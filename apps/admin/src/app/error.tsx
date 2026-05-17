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
    console.error('Admin route error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      <div className="text-center max-w-xl">
        <h1 className="text-3xl font-semibold mb-3">500 - Помилка сервера</h1>
        <p className="text-white/60 mb-8">
          В адмін-панелі сталася помилка. Спробуйте перезавантажити сторінку.
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
  );
}
