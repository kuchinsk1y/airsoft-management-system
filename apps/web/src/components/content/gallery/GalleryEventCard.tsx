'use client';

import LocationIcon from '@/components/icons/LocationIcon';
import { ArrowLeftIcon } from '@/components/icons/ArrowLeftIcon';
import { ArrowRightIcon } from '@/components/icons/ArrowRightIcon';
import type { Event, EventGalleryItem } from '@/interfaces';
import { getEventPath } from '@/utils/event-url';
import { formatDate } from '@/utils/formatDate';
import { getLinkWithRegion } from '@/utils/url';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type GalleryEventCardProps = {
  event: Event;
  gallery: EventGalleryItem[];
  regionSlug?: string | null;
};

export const GalleryEventCard = ({
  event,
  gallery,
  regionSlug,
}: GalleryEventCardProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slidesToShow, setSlidesToShow] = useState(3);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const images = useMemo(() => {
    const galleryImages = gallery.map((item) => item.url).filter(Boolean);
    if (galleryImages.length > 0) {
      return galleryImages;
    }

    return event.image ? [event.image] : [];
  }, [gallery, event.image]);

  useEffect(() => {
    const updateSlidesToShow = () => {
      if (window.innerWidth < 768) {
        setSlidesToShow(1);
      } else if (window.innerWidth < 1200) {
        setSlidesToShow(2);
      } else {
        setSlidesToShow(3);
      }
    };

    updateSlidesToShow();
    window.addEventListener('resize', updateSlidesToShow);
    return () => window.removeEventListener('resize', updateSlidesToShow);
  }, []);

  useEffect(() => {
    setCurrentSlide(0);
  }, [event.id, slidesToShow]);

  if (!images.length) {
    return null;
  }

  const maxSlide = Math.max(0, images.length - slidesToShow);
  const canGoNext = currentSlide < maxSlide;
  const canGoPrev = currentSlide > 0;

  const showNextArrow = canGoNext;
  const showPrevArrow = canGoPrev;

  const goNext = () => {
    if (!canGoNext) return;
    setCurrentSlide((prev) => Math.min(maxSlide, prev + 1));
  };

  const goPrev = () => {
    if (!canGoPrev) return;
    setCurrentSlide((prev) => Math.max(0, prev - 1));
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(event.touches[0]?.clientX ?? null);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) return;
    const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX;
    const deltaX = touchStartX - touchEndX;

    if (Math.abs(deltaX) > 40) {
      if (deltaX > 0) {
        goNext();
      } else {
        goPrev();
      }
    }

    setTouchStartX(null);
  };

  const [datePart, timePart] = formatDate(event.gameStartDate ?? event.startDate)
    .split(',')
    .map((part) => part.trim());
  const dateTimeLabel = [datePart, timePart].filter(Boolean).join(', ');
  const location = [event.city.name, event.address?.trim()]
    .filter(Boolean)
    .join(', ');

  const eventHref = getLinkWithRegion(getEventPath(event), regionSlug);

  return (
    <article className="border-b border-white bg-black">
      <div className="flex items-start justify-between gap-4 border-b border-white px-4 py-4 min991:px-8 min991:py-6">
        <div className="min-w-0">
          <p className="mb-1.5 flex items-center gap-2 text-sm uppercase text-white/85 min991:text-xl">
            <LocationIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">{location || event.city.name}</span>
          </p>
          <Link
            href={eventHref}
            className="block text-2xl font-semibold uppercase tracking-[1.5px] text-white transition hover:text-[#FA4616] min991:text-5xl"
          >
            {event.name}
          </Link>
        </div>

        <div className="shrink-0 bg-[#FA4616] px-3.5 py-2 text-left text-white">
          <p className="text-[13px] font-bold leading-none min991:text-xl">
            {dateTimeLabel}
          </p>
          <p className="mt-1 text-[11px] font-bold uppercase leading-none min991:text-[18px]">
            ПОДІЯ ЗАВЕРШИЛАСЬ
          </p>
        </div>
      </div>

      <div className="relative px-4 py-4 min991:px-8 min991:py-6">
        <div
          className="overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex gap-3 transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${currentSlide * (100 / slidesToShow)}%)` }}
          >
            {images.map((url, index) => (
              <div
                key={`${event.id}-${index}`}
                className="relative h-56 shrink-0 overflow-hidden border border-white/10 min991:h-80"
                style={{ width: `calc(${100 / slidesToShow}% - ${(slidesToShow - 1) * 0.75}rem / ${slidesToShow})` }}
              >
                <Image
                  src={url}
                  alt={`Фото ${index + 1} для ${event.name}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 33vw"
                />
              </div>
            ))}
          </div>
        </div>

        {showNextArrow && (
          <button
            type="button"
            aria-label="Наступні фото"
            onClick={goNext}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 border border-white bg-black/70 p-2 text-white transition hover:bg-[#FA4616] min991:right-6"
          >
            <ArrowRightIcon className="h-5 w-5" />
          </button>
        )}

        {showPrevArrow && (
          <button
            type="button"
            aria-label="Попередні фото"
            onClick={goPrev}
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 border border-white bg-black/70 p-2 text-white transition hover:bg-[#FA4616] min991:left-6"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </article>
  );
};
