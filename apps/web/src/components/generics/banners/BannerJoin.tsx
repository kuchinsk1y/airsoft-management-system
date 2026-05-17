import { getTemplate } from '@/actions/template';
import { UnionIcon } from '@/components/icons/UnionIcon';
import { BannerData, BannerProps } from '@/interfaces';
import Image from 'next/image';
import Link from 'next/link';

const BannerJoin = async ({ className, pageKey, region }: BannerProps) => {
  if (!pageKey) return null;

  const pageResult = await getTemplate(pageKey);
  if (!pageResult.success) return null;

  const pageTemplateData = pageResult.data as Record<string, any>;
  const data = pageTemplateData?.banners?.join as BannerData | undefined;
  if (!data) return null;

  const registerUrl = region ? `/register?region=${region}` : '/register';

  return (
    <Link
      href={registerUrl}
      className={`relative w-full bg-[#FA4616] overflow-hidden flex flex-col p-5 md:p-10 375:gap-5 min376:gap-3 gap-3 md:gap-5 lg:px-15 1440:gap-14 min1441:gap-5 1440:px-20 1440:py-20 min1441:py-10 border-t border-white cursor-pointer hover:opacity-90 transition-opacity ${className || ''}`}
    >
      {data.title && (
        <h2 className="text-white uppercase text-2xl lg:text-[32px] 1440:text-[64px] min1441:text-[40px] font-medium leading-[116.667%]">
          {data.title}
        </h2>
      )}
      {data.image && (
        <Image
          src={data.image}
          alt={data.title}
          className="object-cover 375:w-78.75 w-full min376:w-full h-39 md:h-50 lg:h-66.75"
          width={315}
          height={156}
          unoptimized
        />
      )}
      <UnionIcon
        className="absolute bottom-[9.96px] right-[10.45px] w-[53.545px] h-[21.036px] md:w-20 md:h-10 1440:w-[203.636px] 1440:h-20 min1441:w-[101.818px] min1441:h-[40.909px] 1440:bottom-10 1440:right-[40.36px] min1441:bottom-5 min1441:right-5"
        style={{ fill: 'white' }}
      />
    </Link>
  );
};

export default BannerJoin;
