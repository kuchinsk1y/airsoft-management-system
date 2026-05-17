'use client';

import { GeneralButton } from '@/components/generics/button/Button';
import { ArrowLeftIcon } from '@/components/icons/ArrowLeftIcon';
import { ArrowRightIcon } from '@/components/icons/ArrowRightIcon';
import { PaginationProps } from '@/interfaces';

const Pagination = ({
  hasMoreItems,
  totalPages,
  currentPage,
  onShowMore,
  onNextPage,
  onPrevPage,
  showMoreText,
  className,
  paginationClassName,
  title,
  titleClassName,
}: PaginationProps) => {
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage >= totalPages - 1;

  return (
    <>
      {hasMoreItems && onShowMore && showMoreText && (
        <GeneralButton
          text={showMoreText}
          variant="orange-bg"
          onClick={onShowMore}
          className={`lg:hidden border-x-0 ${className || ''}`}
        />
      )}

      {totalPages > 1 && (
        <div
          className={`flex items-center ${title ? 'justify-between gap-2.5 375:p-5 py-2 min376:py-2 px-5 border-t border-l border-white lg:hidden' : 'justify-center gap-4 lg:py-5 1440:py-10 min1441:py-8 hidden lg:flex'} ${title ? titleClassName || '' : paginationClassName || ''}`}
        >
          {title && (
            <h2 className="text-white uppercase 375:text-2xl text-sm min376:text-sm font-medium leading-[133.333%]">
              {title}
            </h2>
          )}
          <div className="flex items-center gap-3 shrink-0 lg:gap-4">
            <button
              onClick={onPrevPage}
              disabled={isFirstPage}
              className="flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
              aria-label="Попередня сторінка"
            >
              <ArrowLeftIcon
                className={`375:w-10 375:h-10 min376:w-6 min376:h-6 h-6 w-6 lg:w-4.5 lg:h-4.5 1440:w-5.5 1440:h-5.5 ${isFirstPage ? 'opacity-40' : ''}`}
              />
            </button>
            <div className="text-white text-center uppercase 375:text-2xl text-sm min376:text-sm font-medium leading-[166.67%] lg:text-base 1440:text-xl min1441:text-lg">
              {currentPage + 1} / {totalPages}
            </div>
            <button
              onClick={onNextPage}
              disabled={isLastPage}
              className="flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
              aria-label="Наступна сторінка"
            >
              <ArrowRightIcon
                className={`375:w-10 375:h-10 min376:w-6 min376:h-6 h-6 w-6 lg:w-4.5 lg:h-4.5 1440:w-5.5 1440:h-5.5 ${isLastPage ? 'opacity-40' : ''}`}
              />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Pagination;
