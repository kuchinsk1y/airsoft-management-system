'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { GalleryIcon } from '@/components/icons/GalleryIcon';
import { ArrowLeftIcon } from '@/components/icons/ArrowLeftIcon';
import { ArrowRightIcon } from '@/components/icons/ArrowRightIcon';
import { ImageLightboxModal } from './ImageLightboxModal';
import type { EventGalleryItem } from '@/interfaces';
import styles from './EventGallerySection.module.css';

interface EventGallerySectionProps {
  eventId: number;
  gallery: EventGalleryItem[];
}

export const EventGallerySection = ({
  gallery,
}: EventGallerySectionProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  const images = gallery.map((item) => item.url);
  const slidesToShow = {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  };

  // Determine how many slides to show based on viewport
  const getSlidesToShow = () => {
    if (typeof window === 'undefined') return slidesToShow.mobile;
    if (window.innerWidth >= 1024) return slidesToShow.desktop;
    if (window.innerWidth >= 768) return slidesToShow.tablet;
    return slidesToShow.mobile;
  };

  const [currentSlidesToShow, setCurrentSlidesToShow] = useState(
    slidesToShow.mobile,
  );

  useEffect(() => {
    // Set initial value after mounting to match client viewport
    setMounted(true);
    setCurrentSlidesToShow(getSlidesToShow());

    const handleResize = () => {
      setCurrentSlidesToShow(getSlidesToShow());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxSlide = Math.max(0, images.length - currentSlidesToShow);

  // Auto-scroll
  useEffect(() => {
    if (isPaused || maxSlide === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev >= maxSlide ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused, maxSlide]);

  const handlePrevious = () => {
    setCurrentSlide((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => Math.min(maxSlide, prev + 1));
  };

  const handleImageClick = (index: number) => {
    setLightboxIndex(currentSlide + index);
    setLightboxOpen(true);
  };

  const handleLightboxPrevious = () => {
    setLightboxIndex((prev) => Math.max(0, prev - 1));
  };

  const handleLightboxNext = () => {
    setLightboxIndex((prev) => Math.min(images.length - 1, prev + 1));
  };

  if (!images.length) return null;

  return (
    <>
      <div className="border-b border-white p-5 lg:pt-8 1440:px-10 1440:pb-10 min1441:px-5 min1441:pb-5">
        <div className="flex items-center gap-3 375:gap-3 mb-5 1440:mb-7 min1441:mb-5">
          <GalleryIcon className="w-4 h-4 375:w-5 375:h-5 min376:w-4 min376:h-4 lg:w-5 lg:h-5 1440:w-6 1440:h-6 min1441:w-5 min1441:h-5 text-white" />
          <h3 className="text-white uppercase 375:text-[20px] leading-[120%] min376:text-[16px] text-[16px] 1440:text-[24px] 1440:leading-[116.667%] font-medium min1441:text-[16px]">
            ГАЛЕРЕЯ ПОДІЇ
          </h3>
        </div>

        {!mounted ? (
          <div className="relative w-full h-64 bg-white/5 animate-pulse rounded-lg" />
        ) : (
          <div
            className="relative"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Slider container */}
            <div className="overflow-hidden">
            <div
              className={styles.sliderTrack}
              style={
                {
                  '--slider-translate': `-${currentSlide * (100 / currentSlidesToShow + (currentSlidesToShow > 1 ? 1.5 : 0))}%`,
                } as React.CSSProperties
              }
            >
              {images.map((image, index) => (
                <div
                  key={gallery[index].id}
                  className={`${styles.slideItem} group`}
                  style={
                    {
                      '--slide-width': `calc(${100 / currentSlidesToShow}% - ${currentSlidesToShow > 1 ? '12px' : '0px'})`,
                    } as React.CSSProperties
                  }
                  onClick={() => handleImageClick(index - currentSlide)}
                >
                  <div className={styles.slideImage}>
                    <Image
                      src={image}
                      alt={`Фото події ${index + 1}`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm uppercase font-semibold">
                        Переглянути
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation arrows */}
          {maxSlide > 0 && (
            <>
              <button
                onClick={handlePrevious}
                disabled={currentSlide === 0}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 p-2 bg-black/70 hover:bg-[#FA4616] text-white rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-black/70"
                aria-label="Попередній слайд"
                type="button"
              >
                <ArrowLeftIcon className="w-5 h-5 1440:w-6 1440:h-6" />
              </button>
              <button
                onClick={handleNext}
                disabled={currentSlide >= maxSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 p-2 bg-black/70 hover:bg-[#FA4616] text-white rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-black/70"
                aria-label="Наступний слайд"
                type="button"
              >
                <ArrowRightIcon className="w-5 h-5 1440:w-6 1440:h-6" />
              </button>
            </>
          )}

          {/* Pagination dots */}
          {maxSlide > 0 && (
            <div className="flex justify-center gap-2 mt-5">
              {Array.from({ length: maxSlide + 1 }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    currentSlide === index
                      ? 'bg-[#FA4616] w-6'
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`Перейти до слайду ${index + 1}`}
                  type="button"
                />
              ))}
            </div>
          )}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <ImageLightboxModal
          images={images}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onPrevious={handleLightboxPrevious}
          onNext={handleLightboxNext}
        />
      )}
    </>
  );
};
