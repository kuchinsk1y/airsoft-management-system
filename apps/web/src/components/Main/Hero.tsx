'use client';
import { useUser } from '@/contexts/UserContext';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { GeneralButton } from '../generics/button/Button';

type HeroProps = {
  initialTitle?: string;
  initialDescription?: string;
  initialHeroImage?: string;
};

export default function Hero({
  initialTitle,
  initialDescription,
  initialHeroImage,
}: HeroProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();

  const title = useMemo(() => initialTitle?.trim() || '', [initialTitle]);
  const description = useMemo(
    () => initialDescription?.trim() || '',
    [initialDescription],
  );
  const heroImage = useMemo(
    () => initialHeroImage?.trim() || '',
    [initialHeroImage],
  );

  const handleRegisterClick = () => {
    const regionSlug = searchParams?.get('region');
    const regionParam = regionSlug ? `?region=${regionSlug}` : '';

    if (user) {
      router.push(`/events${regionParam}`);
    } else {
      router.push(`/register${regionParam}`);
    }
  };

  if (!title || !heroImage) {
    return null;
  }

  return (
    <div className="w-full flex flex-col min1127:flex-row">
      <div className="flex flex-col border-b border-r min1127:w-3/5 uppercase">
        <div className=" flex flex-col items-start px-5 py-5 mt-8 mb-8 min1127:px-20 min1127:py-20">
          <span className="font-semibold text-4xl min650:text-7xl max-w-[90%] min1127:max-w-[80%]">
            {title}
          </span>
          {description && (
            <p className="font-normal text-base mt-3 min1127:text-xl min1127:mt-5 max-w-[90%] min1127:max-w-[80%]">
              {description}
            </p>
          )}

          <div className="flex flex-wrap gap-5 mt-5 min1127:gap-10 min1127:mt-14">
            <GeneralButton
              onClick={handleRegisterClick}
              text="Зареєструватися на гру"
              variant="orange-bg"
              className="border-none text-base! min-w-[320px] min-[718px]:min-w-[256px]"
            />
          </div>
        </div>
        <div className="w-full flex justify-end px-6 relative">
          <Image
            src="/Union-event.svg"
            alt="Union-event"
            width={118}
            height={47}
            className="absolute z-10 top-70 min1127:-top-16 w-31 h-12.25"
          />
        </div>
      </div>

      <div className="relative h-88.75 border-b min1127:w-2/5 min1127:h-auto">
        <Image
          src={heroImage}
          alt={title}
          fill
          className="object-cover object-[center_5%] min1127:object-[center_10%]"
          sizes="(max-width: 1126px) 100vw, 40vw"
          priority
          quality={75}
        />
      </div>
    </div>
  );
}
