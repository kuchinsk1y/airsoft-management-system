'use client';

import { getProductShareLinks } from '@/utils/shareLinks';

export const ShareSection = ({ shareUrl = '' }: { shareUrl?: string }) => {
  const shareLinks = getProductShareLinks(shareUrl);

  const iconBaseClassName =
    'h-[36px] w-[36px] 375:w-[36px] min376:w-[30px] 375:h-[36px] min376:h-[30px] 1440:h-[36px] lg:h-[25px] 1440:w-[36px] lg:w-[25px] min1441:h-[30px] min1441:w-[30px] border-b border-t border-white flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors';

  return (
    <div className="flex flex-col gap-2 375:gap-5 min376:gap-2 1440:gap-6 px-6 py-4 lg:px-3 1440:px-6 375:py-6 min376:py-4 1440:py-6 w-fit md:w-full">
      <p className="text-white uppercase text-xs font-medium 375:text-base min376:text-xs 1440:text-base leading-[85%] min1441:leading-[100%]">
        ПОДІЛИТИСЯ
      </p>
      <div className="flex border-white border-l border-r w-full md:w-fit">
        {shareLinks.map(({ href, ariaLabel, Icon, rel }, index) => {
          const isLast = index === shareLinks.length - 1;
          return (
            <a
              key={ariaLabel}
              href={href}
              target={rel ? '_blank' : undefined}
              rel={rel}
              className={`${iconBaseClassName} ${!isLast ? 'border-r' : ''}`}
              aria-label={ariaLabel}
            >
              <Icon className="w-4 h-4" />
            </a>
          );
        })}
      </div>
    </div>
  );
};
