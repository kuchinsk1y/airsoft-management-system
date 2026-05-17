
import { UnionIcon } from '@/components/icons/UnionIcon';
import { NewsItem } from '@/interfaces';
import { NewsCard } from './NewsCard';

export default function LatestNews({ lastNews }: { lastNews: NewsItem[] }) {
  return (
    <div className="w-full flex flex-col">
      <div className="flex justify-between p-6 min991:px-20 min991:py-14 border-t border-white">
        <div className="text-[32px] uppercase tracking-[8%] font-semibold">
          Читати інше
        </div>
        <UnionIcon className=" text-white h-12" />
      </div>
      <div className="grid grid-cols-1  lg:grid-cols-2 lg:grid-rows-2 xl:grid-cols-4 xl:grid-rows-1 border-t border-white">
        {lastNews?.length
          ? lastNews.map((item) => (
              <NewsCard key={item.id} item={item} isShowExcerpt={false} />
            ))
          : null}
      </div>
    </div>
  );
}
