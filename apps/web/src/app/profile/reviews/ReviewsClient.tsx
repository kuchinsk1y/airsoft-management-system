'use client';

import { createCompanyComment } from '@/actions/comments';
import type { Comment } from '@/interfaces';
import { useState } from 'react';

interface ReviewsClientProps {
  initialComments: Comment[];
}

export default function ReviewsClient({ initialComments }: ReviewsClientProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const latestCompanyComment = initialComments[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      setError('Будь ласка, введіть текст відгуку');
      return;
    }

    if (message.length > 1000) {
      setError('Відгук не може перевищувати 1000 символів');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await createCompanyComment(message.trim());
      setMessage('');
      setSuccess('Відгук відправлено на модерацію');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка при створенні відгуку');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold p-2.5 min991:px-0 min991:pt-0">МОЇ ВІДГУКИ</h1>

      <section className="space-y-5 p-6 rounded-xl border-2 border-white/10 bg-black/30">
        <div>
          <h2 className="text-lg font-semibold text-white">Відгук про компанію</h2>
          <p className="text-xs text-gray-400 mt-1">
            Відгук публікується тільки після модерації адміністратором.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setError(null);
              setSuccess(null);
            }}
            placeholder="Напишіть ваш відгук про компанію..."
            className="w-full min-h-30 p-4 bg-[#1A1A1A] border border-[#333333] text-white placeholder:text-gray-500 rounded focus:outline-none focus:border-orange-500 resize-y"
            maxLength={1000}
            disabled={isSubmitting}
          />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              {error && <p className="text-red-500 text-sm">{error}</p>}
              {success && <p className="text-green-500 text-sm">{success}</p>}
              <p className="text-gray-400 text-xs">{message.length}/1000 символів</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="h-10 px-4 rounded-lg bg-(--color-primary) text-white text-sm font-semibold hover:bg-(--color-primary-hover) transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'ВІДПРАВЛЯЄТЬСЯ...' : 'ВІДПРАВИТИ ВІДГУК'}
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-3 p-6 rounded-xl border-2 border-white/10 bg-black/30">
        <h2 className="text-lg font-semibold text-white">Останній відгук</h2>

        {!latestCompanyComment ? (
          <p className="text-sm text-gray-400">Ви ще не залишали відгук про компанію</p>
        ) : (
          <div className="min-w-0 rounded-xl border border-white/10 bg-black/20 p-4 space-y-3 overflow-hidden">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-gray-400">
                {new Date(latestCompanyComment.createdAt).toLocaleDateString('uk-UA')}
              </span>
              <span
                className={`text-[11px] px-2 py-1 rounded-full border ${
                  latestCompanyComment.status === 'APPROVED'
                    ? 'border-green-500/40 text-green-300 bg-green-500/10'
                    : latestCompanyComment.status === 'REJECTED'
                      ? 'border-red-500/40 text-red-300 bg-red-500/10'
                      : 'border-yellow-500/40 text-yellow-300 bg-yellow-500/10'
                }`}
              >
                {latestCompanyComment.status === 'APPROVED'
                  ? 'Опубліковано'
                  : latestCompanyComment.status === 'REJECTED'
                    ? 'Відхилено'
                    : 'На модерації'}
              </span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
              {latestCompanyComment.message}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
