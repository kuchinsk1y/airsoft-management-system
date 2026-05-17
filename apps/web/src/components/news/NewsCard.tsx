import Link from 'next/link';
import Image from 'next/image';
import { NewsItem } from '@/interfaces';


export function NewsCard({
  item,
  isShowExcerpt,
}: {
  item: NewsItem;
  isShowExcerpt: boolean;
}) {

  return (
    <article className="relative border-r border-b border-white flex flex-col h-full">
      {item?.coverImage && (
        <Link href={`/news/${item.slug}`} className="relative h-80 w-full border-b border-white block">
          <Image
            src={item.coverImage}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </Link>
      )}

      <div className="flex flex-col flex-1 wrap-break-words">
        <div
          className={`flex flex-col gap-4 space-y-2 h-full ${isShowExcerpt ? 'p-6 md:py-6 md:px-12 lg:py-8 lg:px-10 xl:py-10' : 'p-6 md:py-6 md:px-10 lg:py-6 lg:px-8 xl:py-8'}`}
        >
          <Link href={`/news/${item.slug}`} className="block">
            <h2
              className={`uppercase font-semibold tracking-[6%] mb-0 wrap-break-word leading-tight ${isShowExcerpt ? 'text-lg min-[400px]:text-xl sm:text-2xl lg:text-xl 2xl:text-2xl' : 'text-lg sm:text-xl lg:text-base 2xl:text-lg'} `}
              title={item.title}
            >
              {item.title}
            </h2>
          </Link>
          {isShowExcerpt && (
            <p className="text-base lg:text-lg uppercase leading-6 wrap-break-word">
              {item.excerpt}
            </p>
          )}
        </div>

        <Link
          href={`/news/${item.slug}`}
          className="mt-auto py-6 border-t flex items-center justify-center font-bold tracking-widest uppercase text-white"
        >
          Детальніше
        </Link>
      </div>
    </article>
  );
}
