'use client';

import { getTemplate } from '@/actions/template';
import FaqBlock from '@/components/seo/FaqBlock';
import SeoTextBlock from '@/components/seo/SeoTextBlock';
import TitleBlock from '@/components/TitleBlock/TitleBlock';
import { FaqItem, TemplateData } from '@/interfaces';
import { useEffect, useState } from 'react';

type WeekendGameContent = {
  title: string;
  content: string;
  seoText?: string;
  seoFaq?: FaqItem[];
};

function normalizeFaq(value: unknown): FaqItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item !== 'object' || item === null) {
        return { question: '', answer: '' };
      }

      const obj = item as Record<string, unknown>;
      return {
        question: typeof obj.question === 'string' ? obj.question : '',
        answer: typeof obj.answer === 'string' ? obj.answer : '',
      };
    })
    .filter((item) => item.question.trim().length > 0 && item.answer.trim().length > 0);
}

const WeekendGamePage = () => {
  const [data, setData] = useState<WeekendGameContent | null>(null);

  useEffect(() => {
    async function loadWeekendGame() {
      const result = await getTemplate('weekend-game');

      if (result.success) {
        const templateData = result.data as TemplateData<string>;

        setData({
          title: templateData.title || 'Гра вихідного дня',
          content: templateData.content || '',
          seoText:
            typeof (result.data as { seo?: { seoText?: unknown } })?.seo?.seoText ===
            'string'
              ? ((result.data as { seo?: { seoText?: string } }).seo?.seoText ?? '')
              : '',
          seoFaq: normalizeFaq((result.data as { seo?: { seoFaq?: unknown } })?.seo?.seoFaq),
        });
      } else {
        console.error('Error loading weekend-game template:', result.error);
      }
    }
    loadWeekendGame();
  }, []);

  return (
    <>
      <TitleBlock
        title={data?.title || 'Гра вихідного дня'}
        path={[
          { label: 'Календар подій', href: '/events' },
          { label: 'Гра вихідного дня' },
        ]}
      />
      <div className="px-5 py-8 min991:px-20 min991:py-12">
        <article className="w-full">
          {data?.content ? (
            <div
              className="rich-content max-w-none uppercase font-light text-lg text-gray-300 leading-relaxed space-y-4"
              dangerouslySetInnerHTML={{ __html: data.content }}
            />
          ) : (
            <p className="text-gray-500 text-center font-light italic">
              Контент відсутній
            </p>
          )}
        </article>
      </div>
      <SeoTextBlock text={data?.seoText} className="min991:px-20" />
      <FaqBlock items={data?.seoFaq} className="min991:px-20" />
    </>
  );
};

export default WeekendGamePage;