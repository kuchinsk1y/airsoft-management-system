'use client';

import { useState } from 'react';
import type { FaqItem } from '@/interfaces';

type FaqBlockProps = {
  items?: FaqItem[] | null;
  title?: string;
  className?: string;
};

const FaqBlock = ({
  items,
  title = 'Найчастіші питання',
  className = '',
}: FaqBlockProps) => {
  const [showAll, setShowAll] = useState(false);
  const [openQuestionId, setOpenQuestionId] = useState<number | null>(null);

  const normalizedItems = (items ?? [])
    .filter((item) => item.question.trim().length > 0 && item.answer.trim().length > 0)
    .map((item, index) => ({
      id: index + 1,
      question: item.question,
      answer: item.answer,
    }));

  if (normalizedItems.length === 0) {
    return null;
  }

  const visibleItems = showAll ? normalizedItems : normalizedItems.slice(0, 3);

  return (
    <section
      className={`border-t border-white text-white ${className}`}
      itemScope
      itemType="https://schema.org/FAQPage"
    >
      <div className="flex items-center justify-between p-5 gap-2.5 border-b uppercase min991:px-20 min991:py-12">
        <h2 className="text-2xl min991:text-3xl font-medium">{title}</h2>
      </div>

      <div className="flex flex-col">
        {visibleItems.map((item) => {
          const isOpen = openQuestionId === item.id;

          return (
            <div
              key={item.id}
              itemScope
              itemProp="mainEntity"
              itemType="https://schema.org/Question"
              className="border-t border-white uppercase"
            >
              <button
                type="button"
                onClick={() => setOpenQuestionId(isOpen ? null : item.id)}
                className={`w-full flex items-center justify-between px-5 min991:px-20 pt-5 min991:pt-10 ${
                  isOpen ? 'pb-0' : 'pb-5 min991:pb-10'
                }`}
              >
                <span
                  className={`text-left font-light text-2xl min991:text-4xl transition-colors uppercase ${
                    isOpen ? 'text-[#FA4616]' : 'text-white'
                  }`}
                  itemProp="name"
                >
                  {item.question}
                </span>
                <svg
                  className={`w-5 h-5 min991:w-6 min991:h-6 transition-all shrink-0 ${
                    isOpen ? 'rotate-180 text-[#FA4616]' : 'text-white'
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {isOpen && (
                <div
                  className="min991:px-20 min991:pb-10 px-5 pb-5 text-white text-base min991:text-xl font-light mt-3 min991:mt-5 whitespace-pre-line"
                  itemScope
                  itemProp="acceptedAnswer"
                  itemType="https://schema.org/Answer"
                >
                  <span itemProp="text">{item.answer}</span>
                </div>
              )}
            </div>
          );
        })}

        {normalizedItems.length > 3 && (
          <div className="border-t border-white">
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="w-full p-5 min991:py-10 min991:px-20 text-left uppercase text-white 1440:text-xl font-light underline"
            >
              {showAll ? 'Показати менше' : 'Показати більше'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default FaqBlock;
