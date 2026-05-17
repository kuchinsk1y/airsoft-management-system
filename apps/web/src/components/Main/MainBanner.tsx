'use client';
import Image from 'next/image';
import { Banner } from '@/interfaces';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeftBannerIcon } from '../icons/ArrowLeftBannerIcon';
import { ArrowRightBannerIcon } from '../icons/ArrowRightBannerIcon';
import { AutoIndicatorIcon } from '../icons/AutoIndicatorIcon';
import { AutoIndicatorCircleIcon } from '../icons/AutoIndicatorСircleIcon';
import { toSeoSafeHref } from '@/utils/seo-hide';

type ThrottledAction = (() => void) & {
  cancel: () => void;
};

const createThrottle = (callback: () => void, delayMs: number): ThrottledAction => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastRun = 0;

  const throttled = (() => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRun;

    if (timeSinceLastRun >= delayMs) {
      lastRun = now;
      callback();
      return;
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      lastRun = Date.now();
      callback();
    }, delayMs - timeSinceLastRun);
  }) as ThrottledAction;

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return throttled;
};

type MainBannerProps = {
  initialBanners?: Banner[];
};

export default function MainBanner({ initialBanners = [] }: MainBannerProps) {
  const banners = useMemo(() => initialBanners, [initialBanners]);
  const [current, setCurrent] = useState(1);
  const [transition, setTransition] = useState(true);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    setCurrent(1);
  }, [banners.length]);

  useEffect(() => {
    const updateScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 991);
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);

    return () => {
      window.removeEventListener('resize', updateScreenSize);
    };
  }, []);

  const extendedBanners =
    banners.length > 0
      ? [banners[banners.length - 1], ...banners, banners[0]]
      : [];

  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      if (banners.length > 1) {
        setCurrent((prev) => prev + 1);
      }
    }, 5000);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    startAutoPlay();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [banners.length]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        startAutoPlay(); // перезапуск
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current); // стоп
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [startAutoPlay]);

  const throttledNext = useMemo(
    () =>
      createThrottle(() => {
        if (banners.length <= 1) return;
        setCurrent((prev) => prev + 1);
        startAutoPlay();
      }, 700),
    [banners.length, startAutoPlay],
  );

  const throttledPrev = useMemo(
    () =>
      createThrottle(() => {
        if (banners.length <= 1) return;

        setCurrent((prev) => prev - 1);
        startAutoPlay();
      }, 700),
    [banners.length, startAutoPlay],
  );

  useEffect(() => {
    return () => {
      throttledNext.cancel();
      throttledPrev.cancel();
    };
  }, [throttledNext, throttledPrev]);

  function handleTransitionEnd() {
    if (current === banners.length + 1) {
      setTransition(false);

      requestAnimationFrame(() => {
        setCurrent(1);

        requestAnimationFrame(() => {
          setTransition(true);
        });
      });
    }

    if (current === 0) {
      setTransition(false);

      requestAnimationFrame(() => {
        setCurrent(banners.length);

        requestAnimationFrame(() => {
          setTransition(true);
        });
      });
    }
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (banners.length <= 1) return;

    isDragging.current = true;
    startX.current = e.clientX;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return null;

    currentX.current = e.clientX;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current) return;

    const diff = startX.current - currentX.current;

    if (Math.abs(diff) > 50) {
      e.preventDefault();
    }

    if (diff > 50) {
      throttledNext();
    } else if (diff < -50) {
      throttledPrev();
    }

    isDragging.current = false;

    startAutoPlay();
  };

  if (banners.length === 0) {
    return null;
  }

  const useCircleIndicators = isSmallScreen || banners.length > 3;

  const bannerHeight =
    'h-[200px] min-[376px]:h-[220px] min-[401px]:h-[250px] min-[650px]:h-[320px] min-[991px]:h-[450px] min-[1127px]:h-[600px]';

  return (
    <>
      <div
        className={`relative overflow-hidden w-full ${bannerHeight} border-b border-white touch-pan-y`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div
          onTransitionEnd={handleTransitionEnd}
          className={`flex ${transition ? 'transition-transform duration-500 ease-in-out' : ''}`}
          style={{
            transform: `translateX(-${current * 100}%)`,
          }}
        >
          {extendedBanners.map((banner, index) => {
            const bannerHref = toSeoSafeHref(banner.link);
            // The carousel duplicates first/last slides; eager-load initial visible slide and its adjacent clones
            // so LCP is not attributed to a lazy duplicate.
            const shouldEagerLoad = index <= 2;

            return (
              <div
                key={index}
                className={`min-w-full ${bannerHeight} relative cursor-pointer`}
              >
                {bannerHref ? (
                  <a
                    href={bannerHref}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="block w-full h-full absolute"
                    aria-label={banner.description || 'Відкрити банер'}
                    title={banner.description || 'Відкрити банер'}
                  >
                    <Image
                      src={banner.image}
                      alt={banner.description}
                      fill
                      sizes="100vw"
                      quality={75}
                      priority={shouldEagerLoad}
                      loading={shouldEagerLoad ? 'eager' : 'lazy'}
                      fetchPriority={index === 1 ? 'high' : 'auto'}
                      className="object-cover "
                    />
                  </a>
                ) : (
                  <div className="block w-full h-full absolute">
                    <Image
                      src={banner.image}
                      alt={banner.description}
                      fill
                      sizes="100vw"
                      quality={75}
                      priority={shouldEagerLoad}
                      loading={shouldEagerLoad ? 'eager' : 'lazy'}
                      fetchPriority={index === 1 ? 'high' : 'auto'}
                      className="object-cover "
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={throttledPrev}
          type="button"
          title="Попередній банер"
          aria-label="Попередній банер"
          className="hidden min991:block absolute left-4 top-1/2 -translate-y-1/2"
        >
          <ArrowLeftBannerIcon />
        </button>
        <button
          onClick={throttledNext}
          type="button"
          title="Наступний банер"
          aria-label="Наступний банер"
          className="hidden min991:block absolute right-4 top-1/2 -translate-y-1/2"
        >
          <ArrowRightBannerIcon />
        </button>

        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-3">
          {useCircleIndicators
            ? banners.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  title={`Перейти до банера ${index + 1}`}
                  aria-label={`Перейти до банера ${index + 1}`}
                  onClick={() => setCurrent(index + 1)}
                >
                  <AutoIndicatorCircleIcon
                    className={`transition-all duration-300 ${
                      current - 1 === index
                        ? 'opacity-100 scale-100'
                        : 'opacity-30 scale-90'
                    }`}
                  />
                </button>
              ))
            : banners.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  title={`Перейти до банера ${index + 1}`}
                  aria-label={`Перейти до банера ${index + 1}`}
                  onClick={() => setCurrent(index + 1)}
                >
                  <AutoIndicatorIcon
                    className={`transition-all duration-300 ${
                      current - 1 === index
                        ? 'opacity-100 scale-100'
                        : 'opacity-30 scale-90'
                    }`}
                  />
                </button>
              ))}
        </div>
      </div>
    </>
  );
}
