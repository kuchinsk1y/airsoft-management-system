'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export interface NewsTabsProps {
  tabList: { id: string; label: string }[];
  isDirty?: boolean;
}

const TAB_TO_CATEGORY: Record<string, 'AIRSOFT' | 'STRIKESHOP' | null> = {
  news: null,
  airsoft: 'AIRSOFT',
  shop: 'STRIKESHOP',
};

const CATEGORY_TO_TAB: Record<'AIRSOFT' | 'STRIKESHOP', string> = {
  AIRSOFT: 'airsoft',
  STRIKESHOP: 'shop',
};

export default function NewsTabs({ tabList, isDirty }: NewsTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams?.get('category');
  const activeTabId =
    activeCategory === 'AIRSOFT' || activeCategory === 'STRIKESHOP'
      ? CATEGORY_TO_TAB[activeCategory]
      : 'news';

  const getNewUrl = (tabId: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    const category = TAB_TO_CATEGORY[tabId];

    if (category) {
      params.set('category', category);
    } else {
      params.delete('category');
    }

    // При смене вкладки всегда начинаем с первой страницы.
    params.delete('offset');

    const queryString = params.toString();
    return queryString ? `/news?${queryString}` : '/news';
  };

  return (
    <div className="grid grid-cols-1 min991:grid-cols-3 border-b text-xl font-semibold uppercase ">
      {tabList.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            onClick={() => {
              const newUrl = getNewUrl(tab.id);
              router.push(newUrl, { scroll: false });
            }}
            disabled={isDirty}
            className={`py-8 border-white border-r border-b min991:border-b-0 text-start min991:first:text-start min991:first:pl-20 px-5 uppercase cursor-pointer hover:bg-[#212529] transition-colors  ${isActive ? 'text-[#FF4D00]' : 'text-white'} disabled:cursor-not-allowed disabled:text-gray-500 disabled:hover:bg-transparent`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
