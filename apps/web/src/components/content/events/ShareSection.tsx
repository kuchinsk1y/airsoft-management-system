'use client';

import {
  getSocialNetworkIcon,
  SOCIAL_NETWORKS_CONFIG,
} from '@/config/socialNetworks';
import { toSeoSafeHref } from '@/utils/seo-hide';

interface ShareSectionProps {
  socialLinks?: Record<string, string> | null;
}

const getHref = (key: string, value: string): string => {
  const v = value.trim();
  if (!v) return '#';
  if (key === 'phone') return `tel:${v.replace(/\s/g, '')}`;
  if (key === 'email') return v.includes('@') ? `mailto:${v}` : v;
  const normalized = v.startsWith('http') ? v : `https://${v}`;
  return toSeoSafeHref(normalized) ?? '#';
};

export const ShareSection = ({ socialLinks }: ShareSectionProps) => {
  const entries =
    socialLinks && Object.keys(socialLinks).length > 0
      ? SOCIAL_NETWORKS_CONFIG.filter((c) => socialLinks[c.key]?.trim()).map(
          (c) => [c.key, socialLinks[c.key].trim()] as [string, string],
        )
      : [];

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-5 md:h-full">
      <p className="text-white uppercase text-[16px] font-medium 375:text-[20px] min376:text-[16px] 1440:text-[24px] leading-[120%] 1440:leading-[116.667%] min1441:text-[16px]">
        Слідкуй за грою в наших соц мережах
      </p>
      <div className="flex flex-col flex-1 gap-3 375:gap-5 min376:justify-between">
        <p className="text-white text-xs 375:text-base min376:text-xs 1440:text-base min1441:text-xs font-normal leading-[137.5%]">
          ДІЗНАЙТЕСЬ, ЩО ЛЮДИ ДУМАЮТЬ І ГОВОРЯТЬ ПРО ЦЮ ПОДІЮ, І ПРИЄДНУЙТЕСЬ ДО
          РОЗМОВИ.
        </p>
        <div className="flex flex-col gap-2">
          <p>ЗВ'ЯЖІТЬСЯ З НАМИ</p>
          <div className="flex flex-wrap border-t border-l border-white w-fit">
            {entries.map(([key, url]) => {
              const config = SOCIAL_NETWORKS_CONFIG.find((c) => c.key === key);
              const label = config?.label ?? key;
              const Icon = getSocialNetworkIcon(key);
              const href = getHref(key, url);
              const isExternal = key !== 'phone' && key !== 'email';
              return (
                <a
                  key={key}
                  href={href}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'nofollow noopener noreferrer' : undefined}
                  aria-label={label}
                  className="flex h-10 w-10 sm:h-12 sm:w-12 1440:h-14 1440:w-14 shrink-0 items-center justify-center border-r border-b border-white text-white"
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 1440:w-7 1440:h-7 shrink-0" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
