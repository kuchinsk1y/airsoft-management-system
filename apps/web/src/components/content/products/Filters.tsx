'use client';

import { SliderHandle } from '@/components/icons/SliderHandle';
import { Radio } from '@/components/ui/radio';
import {
  CategoryOption,
  DealType,
  FilterContentProps,
  ProductCategory,
  ProductsFiltersProps,
} from '@/interfaces';
import { formatPrice } from '@/utils/formatPrice';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const CATEGORY_OPTIONS: CategoryOption[] = [
  { category: 'ВСІ ТОВАРИ', dealType: null },
  { category: 'ОРЕНДА', dealType: DealType.RENT },
  { category: 'КУПІВЛЯ', dealType: DealType.SALE },
];

const FilterContent = ({
  category,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  maxAvailablePrice,
}: FilterContentProps) => {
  const minPercentage = maxAvailablePrice > 0 ? (priceRange.min / maxAvailablePrice) * 100 : 0;
  const maxPercentage = maxAvailablePrice > 0 ? (priceRange.max / maxAvailablePrice) * 100 : 0;

  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  const priceRangeRef = useRef(priceRange);

  useEffect(() => {
    priceRangeRef.current = priceRange;
  }, [priceRange]);

  const getValueFromPosition = (clientX: number) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    const newValue = Math.round((percentage / 100) * maxAvailablePrice);
    return Math.max(0, Math.min(maxAvailablePrice, newValue));
  };

  const handleMouseDown = (type: 'min' | 'max') => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(type);
  };

  const handleTouchStart = (type: 'min' | 'max') => (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(type);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleDragMove = (clientX: number) => {
      if (!trackRef.current) return;

      const rect = trackRef.current.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
      const newValue = Math.round((percentage / 100) * maxAvailablePrice);
      const clampedValue = Math.max(0, Math.min(maxAvailablePrice, newValue));

      const currentRange = priceRangeRef.current;

      if (isDragging === 'min') {
        if (clampedValue <= currentRange.max) {
          onPriceRangeChange({ ...currentRange, min: clampedValue });
        }
      } else {
        const finalValue = Math.max(clampedValue, currentRange.min);
        onPriceRangeChange({ ...currentRange, max: finalValue });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!e.touches || e.touches.length === 0) return;
      e.preventDefault();
      handleDragMove(e.touches[0].clientX);
    };

    const stopDragging = () => {
      setIsDragging(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopDragging);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', stopDragging);
    document.addEventListener('touchcancel', stopDragging);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopDragging);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', stopDragging);
      document.removeEventListener('touchcancel', stopDragging);
    };
  }, [isDragging, onPriceRangeChange, maxAvailablePrice]);

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.slider-handle')) {
      return;
    }
    const newValue = getValueFromPosition(e.clientX);
    const distanceToMin = Math.abs(newValue - priceRange.min);
    const distanceToMax = Math.abs(newValue - priceRange.max);

    if (distanceToMin < distanceToMax) {
      if (newValue <= priceRange.max) {
        onPriceRangeChange({ ...priceRange, min: newValue });
      }
    } else {
      const finalValue = Math.max(newValue, priceRange.min);
      onPriceRangeChange({ ...priceRange, max: finalValue });
    }
  };

  return (
    <>
      <div className="px-6 1440:px-10">
        <h3 className="font-semibold text-base lg:text-lg uppercase pb-3 lg:pb-4">КАТЕГОРІЇ</h3>
        <div className="flex flex-col gap-1 lg:gap-3 pb-0 lg:pb-10">
          {CATEGORY_OPTIONS.map(option => (
            <Radio
              key={option.category}
              name="category"
              value={option.category}
              checked={category === option.category}
              onChange={e => onCategoryChange(e.target.value as ProductCategory)}
              label={option.category}
            />
          ))}
        </div>
      </div>

      <div className="py-4 px-6 lg:py-10 border-t border-white lg:pl-6 1440:px-10 lg:pr-3">
        <h3 className="text-white uppercase text-base pb-3 lg:pb-4 lg:text-lg font-semibold leading-[120%] tracking-[1px]">
          ДІАПАЗОН ЦІН
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="relative flex items-center">
              <div className="relative flex items-center w-full">
                <div className="text-xs font-semibold leading-[150%] tracking-[0.96px] text-white pr-1 lg:pr-2 shrink-0">
                  0
                </div>
                <div
                  ref={trackRef}
                  className="relative h-1 flex-1 grow min-w-32.5 max-w-48.5 1440:w-48.5 1440:max-w-48.5 cursor-pointer touch-none"
                  onClick={handleTrackClick}
                >
                  <div className="absolute inset-0 rounded-2xl opacity-[0.32] bg-white" />
                  <div
                    className="absolute h-full rounded-2xl bg-[#FA4616]"
                    style={{
                      left: `${minPercentage}%`,
                      width: `${maxPercentage - minPercentage}%`,
                    }}
                  />
                  <div
                    className="slider-handle absolute shrink-0 z-30 cursor-grab active:cursor-grabbing touch-none"
                    style={{
                      left: minPercentage === 0 ? '0px' : `calc(${minPercentage}% - 10px)`,
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                    onMouseDown={handleMouseDown('min')}
                    onTouchStart={handleTouchStart('min')}
                  >
                    <SliderHandle />
                  </div>
                  <div
                    className="slider-handle absolute shrink-0 z-30 cursor-grab active:cursor-grabbing touch-none"
                    style={{
                      left:
                        maxPercentage === 100
                          ? 'calc(100% - 20px)'
                          : maxPercentage === minPercentage
                            ? minPercentage === 0
                              ? '0px'
                              : `calc(${maxPercentage}% - 10px)`
                            : `calc(${maxPercentage}% - 10px)`,
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                    onMouseDown={handleMouseDown('max')}
                    onTouchStart={handleTouchStart('max')}
                  >
                    <SliderHandle />
                  </div>
                </div>
                <div className="uppercase text-xs font-semibold leading-[150%] lg:tracking-[0.96px] text-white pl-1 lg:pl-2 whitespace-nowrap shrink-0">
                  {formatPrice(maxAvailablePrice, 0)}
                </div>
              </div>
            </div>
            <div className="text-white uppercase">
              <span className="text-xs font-semibold leading-[150%] lg:tracking-[0.96px]">
                ВІД {formatPrice(priceRange.min, 0)} ДО {formatPrice(priceRange.max, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const Filters = ({
  isOpen,
  onClose,
  category,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  maxAvailablePrice,
}: ProductsFiltersProps) => {
  return (
    <>
      <aside className="hidden lg:block shrink-0 pt-10 lg:col-span-1 min1441:col-span-1">
        <div className="lg:border-b lg:border-white 1440:border-b 1440:border-white lg:border-r-0">
          <FilterContent
            category={category}
            onCategoryChange={onCategoryChange}
            priceRange={priceRange}
            onPriceRangeChange={onPriceRangeChange}
            maxAvailablePrice={maxAvailablePrice}
          />
        </div>
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>

          <div className="absolute bottom-0 left-4 right-4 w-[88%] md:w-[80%] mx-auto bg-black border border-white max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between py-4 pl-6 pr-3">
              <h2 className="text-base font-semibold uppercase">ФІЛЬТРИ</h2>
              <button onClick={onClose} className="text-white hover:text-gray-300 transition" title="Закрити фільтри">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <FilterContent
                category={category}
                onCategoryChange={onCategoryChange}
                priceRange={priceRange}
                onPriceRangeChange={onPriceRangeChange}
                maxAvailablePrice={maxAvailablePrice}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
