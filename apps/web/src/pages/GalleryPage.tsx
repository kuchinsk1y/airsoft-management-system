'use client';

import type { GalleryCompanyPhoto, GalleryEventPhoto } from '@/actions/gallery';
import TitleBlock from '@/components/TitleBlock/TitleBlock';
import Pagination from '@/components/generics/pagination/Pagination';
import { UnionIcon } from '@/components/icons/UnionIcon';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

type GalleryPageProps = {
  companyPhotos: GalleryCompanyPhoto[];
  eventPhotos: GalleryEventPhoto[];
  pageTitle?: string;
  pageSubtitle?: string;
  pageSeoText?: string;
};

type GalleryFilter = 'ALL' | 'COMPANY' | 'EVENTS';

type FeedItem = {
  uid: string;
  source: 'COMPANY' | 'EVENT';
  id: number;
  url: string;
  createdAt: string;
  event?: GalleryEventPhoto['event'];
};

const PHOTOS_PER_PAGE = 16;

const GalleryPage = ({
  companyPhotos = [],
  eventPhotos = [],
  pageTitle = 'ГАЛЕРЕЯ',
  pageSubtitle = 'Фото з життя клубу, івентів, полігонів та команди Strike Shop Action.',
  pageSeoText = '',
}: GalleryPageProps) => {
  const [filter, setFilter] = useState<GalleryFilter>('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const [preview, setPreview] = useState<FeedItem | null>(null);

  const companyItems = useMemo<FeedItem[]>(
    () =>
      companyPhotos.map((photo) => ({
        uid: `company-${photo.id}`,
        source: 'COMPANY',
        id: photo.id,
        url: photo.url,
        createdAt: photo.createdAt,
      })),
    [companyPhotos],
  );

  const eventItems = useMemo<FeedItem[]>(
    () =>
      eventPhotos.map((photo) => ({
        uid: `event-${photo.id}`,
        source: 'EVENT',
        id: photo.id,
        url: photo.url,
        createdAt: photo.createdAt,
        event: photo.event,
      })),
    [eventPhotos],
  );

  const filteredItems = useMemo(() => {
    const base =
      filter === 'EVENTS'
        ? eventItems
        : filter === 'COMPANY'
          ? companyItems
          : [...companyItems, ...eventItems];

    return [...base].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime;
    });
  }, [companyItems, eventItems, filter]);

  useEffect(() => {
    setCurrentPage(0);
  }, [filter]);

  const totalPages = Math.ceil(filteredItems.length / PHOTOS_PER_PAGE);
  const visibleItems = filteredItems.slice(
    currentPage * PHOTOS_PER_PAGE,
    currentPage * PHOTOS_PER_PAGE + PHOTOS_PER_PAGE,
  );

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  return (
    <div>
      <TitleBlock
        title={pageTitle}
        subtitle={pageSubtitle}
        path={[{ label: 'ГОЛОВНА', href: '/' }, { label: 'ГАЛЕРЕЯ' }]}
        className="min320:pr-5 min320:pl-5 min320:py-5 lg:p-[3vw] 1440:py-14 1440:pl-20 1440:px-20 flex-col gap-3 1440:gap-10 min1441:p-[2vw] min1441:gap-5 1440:border-r 1440:border-white"
        titleClassName="text-white text-[5vw] 375:text-[40px] 375:leading-[120%] min376:text-[5vw] md:text-[5.21vw] lg:text-[3.91vw] 1440:text-[80px] 1440:leading-[100%] min1441:text-[3.5vw] min-[320px]:mb-0"
        subtitleClassName="max-w-[950px] text-xs leading-[1.4] min991:text-base"
        breadcrumbClassName="min-[320px]:mb-0 min-[320px]:text-[8px] 375:text-[12px] min376:text-[8px] md:text-[10px] lg:text-[12px]"
      >
        <UnionIcon className="hidden h-10 sm:block min991:h-12" />
      </TitleBlock>

      <div className="border-t border-white px-5 py-5 1440:px-14">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`border px-4 py-2 text-xs font-semibold uppercase tracking-[1px] transition-colors 375:text-sm ${
              filter === 'ALL'
                ? 'border-[#FA4616] bg-[#FA4616] text-white'
                : 'border-white text-white hover:bg-white/10'
            }`}
          >
            Усі фото
          </button>
          <button
            type="button"
            onClick={() => setFilter('COMPANY')}
            className={`border px-4 py-2 text-xs font-semibold uppercase tracking-[1px] transition-colors 375:text-sm ${
              filter === 'COMPANY'
                ? 'border-[#FA4616] bg-[#FA4616] text-white'
                : 'border-white text-white hover:bg-white/10'
            }`}
          >
            Фото компанії
          </button>
          <button
            type="button"
            onClick={() => setFilter('EVENTS')}
            className={`border px-4 py-2 text-xs font-semibold uppercase tracking-[1px] transition-colors 375:text-sm ${
              filter === 'EVENTS'
                ? 'border-[#FA4616] bg-[#FA4616] text-white'
                : 'border-white text-white hover:bg-white/10'
            }`}
          >
            Події
          </button>
        </div>
      </div>

      <div className="border-t border-white px-5 py-5 1440:px-14">
        {visibleItems.length === 0 ? (
          <div className="py-14 text-center text-white/70">У галереї поки немає фото</div>
        ) : (
          <div
            key={`${filter}-${currentPage}`}
            className="columns-2 gap-3 md:columns-3 xl:columns-4"
            style={{ animation: 'galleryFadeSlide 320ms ease-out' }}
          >
            {visibleItems.map((item) => (
              <button
                key={item.uid}
                type="button"
                onClick={() => setPreview(item)}
                className="group relative mb-3 block w-full break-inside-avoid overflow-hidden border border-white/30 bg-black text-left"
              >
                <Image
                  src={item.url}
                  alt={item.event?.name || 'Фото галереї'}
                  width={0}
                  height={0}
                  className="h-auto w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                  sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                />

                {item.source === 'EVENT' && item.event && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 via-black/40 to-transparent p-2.5">
                    <p className="line-clamp-2 text-[10px] uppercase tracking-[1px] text-white/90 375:text-xs">
                      {item.event.name}
                    </p>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        onNextPage={handleNextPage}
        onPrevPage={handlePrevPage}
        title="ГАЛЕРЕЯ"
      />
      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        onNextPage={handleNextPage}
        onPrevPage={handlePrevPage}
      />

      {pageSeoText && (
        <section className="border-t border-white px-5 py-8 text-white 1440:px-14">
          <div className="max-w-5xl">
            <h2 className="mb-3 text-lg font-semibold uppercase tracking-[1px] 375:text-xl">
              Додаткова інформація
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-white/85 375:text-base">
              {pageSeoText}
            </p>
          </div>
        </section>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative h-[80vh] w-full max-w-6xl"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <Image
              src={preview.url}
              alt={preview.event?.name || 'Фото галереї'}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes galleryFadeSlide {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default GalleryPage;
