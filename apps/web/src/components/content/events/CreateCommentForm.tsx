'use client';

import { createComment } from '@/actions/comments';
import { GeneralButton } from '@/components/generics/button/Button';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface CreateCommentFormProps {
  eventId: number;
  onCommentCreated?: () => void;
  withTopBorder?: boolean;
}

export default function CreateCommentForm({
  eventId,
  onCommentCreated,
  withTopBorder = true,
}: CreateCommentFormProps) {
  const { user } = useUser();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerClassName = `${withTopBorder ? 'border-t border-white ' : ''}p-5 lg:p-10 1440:p-14`;

  if (!user) {
    return (
      <div className={containerClassName}>
        <p className="text-white mb-4 text-sm lg:text-base">
          Щоб залишити відгук, необхідно увійти в систему
        </p>
        <GeneralButton
          text="УВІЙТИ"
          variant="orange-bg"
          className="uppercase"
          onClick={() => router.push('/login')}
        />
      </div>
    );
  }

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

    try {
      await createComment(eventId, message.trim());
      setMessage('');
      onCommentCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка при створенні відгуку');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={containerClassName}>
      <h3 className="text-white text-lg lg:text-xl 1440:text-2xl font-bold mb-4 uppercase">
        Залишити відгук
      </h3>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            setError(null);
          }}
          placeholder="Напишіть ваш відгук про подію..."
          className="w-full min-h-[120px] p-4 bg-[#1A1A1A] border border-[#333333] text-white placeholder:text-gray-500 rounded focus:outline-none focus:border-orange-500 resize-y"
          maxLength={1000}
          disabled={isSubmitting}
        />
        
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
            <p className="text-gray-400 text-xs">
              {message.length}/1000 символів
            </p>
          </div>
          
          <GeneralButton
            text={isSubmitting ? 'ВІДПРАВЛЯЄТЬСЯ...' : 'ВІДПРАВИТИ ВІДГУК'}
            variant="orange-bg"
            type="submit"
            disabled={isSubmitting || !message.trim()}
            className="uppercase"
          />
        </div>
      </form>
      
      <p className="text-gray-400 text-xs mt-4">
        Ваш відгук буде опублікований після модерації
      </p>
    </div>
  );
}

