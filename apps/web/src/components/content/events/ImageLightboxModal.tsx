'use client';

import { useEffect, useCallback } from 'react';
import Image from 'next/image';
import { CloseIcon } from '@/components/icons/CloseIcon';
import { ArrowLeftIcon } from '@/components/icons/ArrowLeftIcon';
import { ArrowRightIcon } from '@/components/icons/ArrowRightIcon';

interface ImageLightboxModalProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export const ImageLightboxModal = ({
  images,
  currentIndex,
  onClose,
  onPrevious,
  onNext,
}: ImageLightboxModalProps) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        onPrevious()
      } else if (e.key === 'ArrowRight') {
        onNext()
      }
    },
    [onClose, onPrevious, onNext],
  )

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Перегляд фото"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 text-white hover:text-[#FA4616] transition-colors"
        aria-label="Закрити"
        type="button"
      >
        <CloseIcon className="w-8 h-8" />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-4 z-10 text-white text-sm font-medium px-3 py-1 bg-black/50 rounded">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Previous button */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrevious();
          }}
          className="absolute left-4 z-10 p-3 text-white hover:text-[#FA4616] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Попереднє фото"
          type="button"
          disabled={currentIndex === 0}
        >
          <ArrowLeftIcon className="w-8 h-8" />
        </button>
      )}

      {/* Image */}
      <div
        className="relative w-full h-full flex items-center justify-center p-16"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={images[currentIndex]}
          alt={`Фото ${currentIndex + 1}`}
          fill
          className="object-contain"
          sizes="100vw"
          quality={95}
          priority
        />
      </div>

      {/* Next button */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 z-10 p-3 text-white hover:text-[#FA4616] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Наступне фото"
          type="button"
          disabled={currentIndex === images.length - 1}
        >
          <ArrowRightIcon className="w-8 h-8" />
        </button>
      )}
    </div>
  )
}
