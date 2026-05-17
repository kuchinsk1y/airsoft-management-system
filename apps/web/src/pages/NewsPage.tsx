'use client';

import Pagination from '@/components/generics/pagination/Pagination';
import { UnionIcon } from '@/components/icons/UnionIcon';
import { NewsCard } from '@/components/news/NewsCard';
import SeoTextBlock from '@/components/seo/SeoTextBlock';
import TitleBlock from '@/components/TitleBlock/TitleBlock';
import { NewsPageProps } from '@/interfaces';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';

const NewsTabs = dynamic(() => import('@/components/news/NewsTabs'));
const OnInput = dynamic(() => import('@/components/generics/on-input/OnInput'));

const newsCategories = [
  { id: 'news', label: 'Всі новини' },
  { id: 'airsoft', label: 'Новини страйкболу' },
  { id: 'shop', label: 'Новини StrikeShop Action' },
];

const CATEGORY_TO_TAB: Record<'AIRSOFT' | 'STRIKESHOP', string> = {
  AIRSOFT: 'airsoft',
  STRIKESHOP: 'shop',
};


export default function NewsPage({
  items,
  total,
  currentPage,
  limit,
  searchQuery,
  title,
  heroImage,
  seoText,
}: NewsPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeItems = Array.isArray(items) ? items : [];
  const safeTotal = typeof total === 'number' && Number.isFinite(total) ? total : 0;
  const safeLimit = typeof limit === 'number' && Number.isFinite(limit) && limit > 0 ? limit : 1;
  const safeCurrentPage =
    typeof currentPage === 'number' && Number.isFinite(currentPage) && currentPage >= 0
      ? currentPage
      : 0;
  const safeSearchQuery = typeof searchQuery === 'string' ? searchQuery : '';
  const activeCategory = searchParams?.get('category');
  const activeTabId =
    activeCategory === 'AIRSOFT' || activeCategory === 'STRIKESHOP'
      ? CATEGORY_TO_TAB[activeCategory]
      : 'news';
  const activeTabLabel =
    newsCategories.find((category) => category.id === activeTabId)?.label ?? 'Всі новини';
  const totalPages = Math.max(1, Math.ceil(safeTotal / safeLimit));
  const [isDirty, setIsDirty] = useState(false);

  const toGoPage = useCallback(
    (page: number) => {
      const nextPage = Math.max(0, Math.min(page, totalPages - 1));
      const params = new URLSearchParams(searchParams?.toString() || '');
      if (safeSearchQuery) {
        params.set('searchQuery', safeSearchQuery);
      } else {
        params.delete('searchQuery');
      }
      if (nextPage === 0) {
        params.delete('offset');
      } else {
        params.set('offset', String(nextPage * safeLimit));
      }

      const queryString = params.toString();
      router.push(queryString ? `?${queryString}` : '/news');
    },
    [router, safeLimit, safeSearchQuery, searchParams, totalPages],
  );

  const handleSearchResults = useCallback(
    (query: string) => {
      const nextQuery = query.trim();
      const currentSearchQuery = searchParams?.get('searchQuery')?.trim() || '';

      if (nextQuery === currentSearchQuery) {
        return;
      }

      const params = new URLSearchParams(searchParams?.toString() || '');
      if (nextQuery) {
        params.set('searchQuery', nextQuery);
      } else {
        params.delete('searchQuery');
      }
      params.delete('offset');

      const queryString = params.toString();
      router.push(queryString ? `?${queryString}` : '/news');
    },
    [router, searchParams],
  );

  return (
    <div className="flex flex-col border-white">
      <section className="grid grid-cols-1 min991:grid-cols-[60%_40%]  border-b">
        <div className="relative flex flex-col justify-center p-6 min991:px-20 min991:py-11 border-b border-white min991:border-b-0">
          <TitleBlock
            title={title ?? 'НОВИНИ'}
            path={[{ label: 'Головна', href: '/' }, { label: 'Новини' }]}
            className="flex-1! border-0! p-0!"
            titleClassName="text-5xl min991:text-7xl mb-0 mt-10"
            breadcrumbClassName="mb-6"
          >
            <UnionIcon className="hidden h-10 sm:block min991:h-12" />
          </TitleBlock>
        </div>
        <div className="relative min-h-56 min991:min-h-80">
          <Image
            src={heroImage ?? '/uploads/hero-event.png'}
            alt={title ?? 'Новини'}
            fill
            className="object-cover"
            sizes="(max-width: 991px) 100vw, 43vw"
            priority
          />
        </div>
      </section>

      <NewsTabs tabList={newsCategories} isDirty={isDirty} />
      <OnInput
        className="min991:px-20! py-8!"
        onDirtyChange={setIsDirty}
        onResults={handleSearchResults}
        placeholder="ПОШУК НОВИНИ..."
      />

      <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {safeItems.length > 0 ? (
          safeItems.map((item) => <NewsCard key={item.id} item={item} isShowExcerpt={true} />)
        ) : (
          <div className="col-span-full text-2xl p-10 text-center text-gray-400">
            Новин не знайдено.
          </div>
        )}
      </section>
      <div className="flex justify-center border-t border-white">
        <Pagination
          totalPages={totalPages}
          currentPage={safeCurrentPage}
          onNextPage={() => toGoPage(safeCurrentPage + 1)}
          onPrevPage={() => toGoPage(safeCurrentPage - 1)}
        />
      </div>

      {safeCurrentPage === 0 && !safeSearchQuery && (
        <SeoTextBlock text={seoText} className="min991:px-20" />
      )}
    </div>
  );
}
