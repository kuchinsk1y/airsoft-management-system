import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '404 — Сторінку не знайдено | Strike Shop Action',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-20 text-center select-none">
      <span
        className="text-[160px] min991:text-[220px] font-semibold leading-none text-white/5 pointer-events-none"
        aria-hidden="true"
      >
        404
      </span>

      <h1 className="text-3xl min991:text-5xl font-semibold uppercase -mt-6 mb-4 tracking-wide">
        Сторінку не знайдено
      </h1>

      <p className="text-gray-400 text-base max-w-sm mb-10">
        Сторінка, яку ви шукаєте, не існує або була переміщена.
      </p>

      <Link
        href="/"
        className="inline-block px-10 py-3 border border-white text-white text-sm font-semibold uppercase tracking-widest hover:bg-white hover:text-black transition-colors duration-200"
      >
        На головну
      </Link>
    </div>
  )
}
