import { getTemplate } from '@/actions/template';
import { UnionIcon } from '@/components/icons/UnionIcon';
import { BannerData, BannerProps } from '@/interfaces';
import Image from 'next/image';

const BannerCreateGame = async ({ className, pageKey }: BannerProps) => {
  if (!pageKey) return null;

  const pageResult = await getTemplate(pageKey);
  if (!pageResult.success) return null;

  const pageTemplateData = pageResult.data as Record<string, any>;
  const data = pageTemplateData?.banners?.creategame as BannerData | undefined;
  if (!data) return null;

  return (
    <div
      className={`relative w-full border-b border-white md:border-t overflow-hidden grid grid-cols-1 md:grid-cols-2 1440:grid-cols-[694px_1fr] h-140 md:h-75 lg:h-100 1440:h-140 min1441:h-125 ${className || ''}`}
      style={{
        background: data.backgroundImage
          ? `linear-gradient(0deg, rgba(0, 0, 0, 0.60) 0%, rgba(0, 0, 0, 0.60) 100%), url(${data.backgroundImage}) lightgray 50% / cover no-repeat`
          : '#000',
      }}
    >
      {data.backgroundImage && (
        <Image
          src={data.backgroundImage}
          alt={data.title}
          fill
          className="object-cover -z-10 w-full"
          unoptimized
        />
      )}
      <div className="1440:col-start-1 1440:col-end-2">
        <UnionIcon
          className="absolute top-4 left-4 375:w-20 375:h-8 min376:w-15 w-15 h-6 min376:h-6 lg:w-20 lg:h-10 1440:top-5 1440:left-3.5 1440:w-[186.055px] 1440:h-[75.243px] min1441:w-25 min1441:h-11"
          style={{ fill: '#FA4616' }}
        />
      </div>
      <div className="flex flex-col justify-end px-5 pb-5 md:pl-0 md:pr-10 md:pb-10 1440:col-start-2 1440:col-end-3 1440:justify-start 1440:pt-42 1440:pb-0 1440:pr-12.5 1440:gap-5 375:gap-3 min376:gap-2 gap-2 min1441:justify-end min1441:pt-0 min1441:pb-20">
        <h2 className="uppercase 375:text-[28px] min376:text-[25px] text-[25px] lg:text-[32px] 1440:text-[64px] min1441:text-[40px] font-semibold leading-[114.286%] w-full 1440:leading-[100%] 1440:w-auto">
          {data.title}
        </h2>
        <p className="uppercase 375:text-sm min376:text-xs text-xs lg:text-sm 1440:text-[20px] min1441:text-[16px] font-normal leading-[142.857%] w-full 1440:leading-[140%] 1440:w-auto">
          {data.description}
        </p>
      </div>
    </div>
  );
};

export default BannerCreateGame;
