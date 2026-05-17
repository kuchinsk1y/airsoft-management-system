"use client";

import { WorkshopCardData } from '@/interfaces';
import Image from 'next/image';
import OrderBtn from './OrderBtn';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

export interface WorkshopSectionProps {
  title: string;
  cards: WorkshopCardData[];
  showButton?: boolean;
}

function isWorkshopCard(card: unknown): card is WorkshopCardData {
  if (!card || typeof card !== 'object') {
    return false;
  }

  const candidate = card as Partial<WorkshopCardData>;

  return (
    typeof candidate.title === 'string' &&
    typeof candidate.description === 'string' &&
    typeof candidate.image === 'string'
  );
}

export default function WorkshopSection(props: WorkshopSectionProps) {
  const PAGE_SIZE = 3;
  const cards = props.cards.filter(isWorkshopCard).filter((card) => card.image.trim().length > 0);
  const shouldPaginate = cards.length > 4;
  const totalPages = shouldPaginate ? Math.ceil(cards.length / PAGE_SIZE) : 1;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const cardsToRender = useMemo(() => {
    if (!shouldPaginate) {
      return cards;
    }

    const start = (currentPage - 1) * PAGE_SIZE;
    return cards.slice(start, start + PAGE_SIZE);
  }, [cards, currentPage, shouldPaginate]);


  return (
    <div className="">
      <div className="w-full py-5 text-2xl min991:text-[32px] min991:py-14 border-white border-y uppercase leading-8 text-center">
        {props.title}
      </div>
      <div className="grid grid-cols-1 min991:grid-cols-3 min991:border-b min991:border-white">
        {cardsToRender.map((card, index) => {
          const absoluteIndex = shouldPaginate
            ? (currentPage - 1) * PAGE_SIZE + index
            : index;

          return (
          <div
            key={card.slug || `${card.title}-${absoluteIndex}`}
            className={`flex h-full flex-col border-x border-t border-b border-white min991:border-b-0 min991:border-r`}
          >
            <div className="relative h-80 w-full">
              <Image
                src={card.image}
                alt={card.title}
                fill
                className="object-cover"
                sizes="(max-width: 991px) 100vw, 33vw"
              />
            </div>
            <div className="flex flex-col justify-between grow p-5 min991:p-10 gap-2 min991:gap-6 border-t">
              <h3 className="text-2xl font-semibold uppercase leading-7">
                {card.title}
              </h3>
              <p className="uppercase font-light leading-7 min991:text-[20px]  ">
                {card.description}
              </p>
              <div className="mt-auto flex flex-col gap-2">
                {card.slug && (
                  <Link
                    href={`/workshop/${card.slug}`}
                    className="w-full border border-white px-4 py-3 text-center text-sm font-bold uppercase tracking-wider transition-colors hover:bg-white hover:text-black"
                  >
                    Детальніше
                  </Link>
                )}
                {props.showButton && <OrderBtn title={card.title} />}
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {shouldPaginate && (
        <div className="flex items-center justify-center gap-2 py-6 border-b border-x border-white">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="h-10 px-4 border border-white text-xs font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white hover:text-black transition-colors"
          >
            Назад
          </button>

          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              className={`h-10 min-w-10 px-3 border text-xs font-bold uppercase transition-colors ${
                page === currentPage
                  ? 'border-[#FA4616] bg-[#FA4616] text-white'
                  : 'border-white text-white hover:bg-white hover:text-black'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="h-10 px-4 border border-white text-xs font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white hover:text-black transition-colors"
          >
            Вперед
          </button>
        </div>
      )}
    </div>
  );
}
