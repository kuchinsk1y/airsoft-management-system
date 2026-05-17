'use client';

import TitleBlock from '@/components/TitleBlock/TitleBlock';
import { InfoSection } from '@/components/content/products/InfoSection';
import { HeartIcon } from '@/components/icons/HeartIcon';
import { MinusIcon } from '@/components/icons/MinusIcon';
import { PlusIcon } from '@/components/icons/PlusIcon';
import { ShoppingCartIcon } from '@/components/icons/ShoppingCartIcon';
import { UnionIcon } from '@/components/icons/UnionIcon';
import { useUser } from '@/contexts/UserContext';
import { ProductPageProps } from '@/interfaces';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice } from '@/utils/formatPrice';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
const ProductPage = ({ product, template, shareUrl }: ProductPageProps) => {
  const { user } = useUser();
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  if (!product) {
    return null;
  }

  const productImageAlt = product.name;
  const productImageTitle = `${product.name} - Strike Shop Action`;
  const fullDescription = (product.description || '').trim();

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleIncreaseQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleAddToCart = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    addItem(product, quantity);
  };

  const handleAddToWishlist = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setIsWishlisted(!isWishlisted);
  };

  const getBreadcrumbs = () => {
    if (!template?.breadcrumbs) return [];
    return [...template.breadcrumbs, product.name.toUpperCase()];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="border-b border-white">
      {breadcrumbs.length > 0 && (
        <div className="border-b border-white px-5 py-3 md:hidden">
          <div className="flex flex-wrap items-center gap-1 uppercase text-[10px] text-gray-400">
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;

              return (
                <div key={`${item}-${index}`} className="flex items-center">
                  <span className={isLast ? 'text-white' : 'text-gray-400'}>
                    {item}
                  </span>

                  {!isLast && <span className="mx-1 text-gray-400">-</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div
        className="
        grid grid-cols-1 
             md:grid-cols-2
             lg:grid-cols-2 
             1440:grid-cols-[1fr_800px] 
             min1441:grid-cols-2 
             border-b border-white

             md:grid-rows-[1fr_auto]
             lg:grid-rows-[1fr_auto]
             1440:grid-rows-[1fr_auto] 
             min1441:grid-rows-[1fr_auto]
             "
      >
        <div
          className=" 
                  relative 
                  w-full
                  overflow-hidden 

                  order-1 
                  lg:order-1 
         
                  h-[80vw] 
                  375:h-88.75 
                  min376:h-[80vw] 
                  md:h-auto
                  lg:h-auto
                  border-r border-b border-white lg:border-b-0 lg:border-l"
        >
          <Image
            src={product.image}
            alt={productImageAlt}
            title={productImageTitle}
            fill
            className="object-cover"
            sizes="(max-width: 1023px) 100vw, (max-width: 1440px) 620px, 740px"
            priority
          />
          <UnionIcon className="absolute bottom-2 right-2 min376:bottom-2 min376:right-2 375:right-[9.75px] 375:bottom-[9.18px] 375:w-[118.255px] 375:h-[47.824px] min376:w-17.5 min376:h-7.5 h-7.5 w-17.5 min-[890px]:hidden z-10" />
        </div>

        <div
          className="
                 relative 
                 order-2 
                 lg:order-2 
                 
                 p-5 min376:pt-5 375:pt-10 lg:px-10 lg:py-8 1440:px-12 1440:py-10 flex flex-col gap-6 lg:gap-7 1440:gap-8"
        >
          {breadcrumbs.length > 0 && (
            <div className="hidden md:block">
              <div className="flex flex-wrap items-center gap-1 uppercase text-[10px] 375:text-xs text-gray-400 ">
                {breadcrumbs.map((item, index) => {
                  const isLast = index === breadcrumbs.length - 1;
                  return (
                    <div key={`${item}-${index}`} className="contents">
                      <span className={isLast ? 'text-white' : 'text-gray-400'}>
                        {item}
                      </span>
                      {!isLast && <span className="text-gray-400"> - </span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <UnionIcon className="absolute md:right-2 md:top-2 md:w-[49.455px] md:h-5 1440:w-[118.25px] 1440:h-[47.82px] min1441:w-20 min1441:h-10 1440:right-[19.75px] 1440:top-5.25 min1441:right-[19.75px] min1441:top-4 hidden min-[890px]:block" />
          <TitleBlock
            title={product.name}
            path={[]}
            className="min320:p-0 min991:pl-[0!important] min991:pt-[0!important] min991:pb-[28px!important] min1441:pb-[52px!important] min376:pb-5 pb-5 min991:pr-[0!important] 1440:p-0 flex-col 375:gap-2.5 375:pb-2.5 min320:pb-5 min376:gap-5 gap-5 1440:gap-5 min320:mb-0 min320:border-0"
            titleClassName="
            text-white 
            text-[5vw] 
            375:text-[30px] leading-[100%] 
            min376:text-[5vw] 
            sm:text-[5vw] 
            md:text-[4vw] 
            lg:text-[4vw] 
            1440:text-[40px] 1440:leading-[100%] 
            min1441:text-[4vw] 
            min-[320px]:mb-0 font-semibold"
            breadcrumbClassName="min-[320px]:mb-0 min-[320px]:text-[8px] md:text-[10px] 375:text-xs lg:text-[12px] font-normal 375:!block [&_h3]:375:contents"
          />

          <div className="flex items-center gap-4">
            <p className="text-white font-semibold uppercase text-[20px] 375:text-[32px] min376:text-[20px] leading-[125%] 1440:text-[32px] min1441:text-[25px]">
              {formatPrice(product.price, 2)} ГРН
            </p>
          </div>

          <div className="grid grid-cols-[auto_1fr_auto] 375:gap-5 min376:gap-4 gap-4 py-5 lg:gap-8 1440:py-8">
            <div className="flex items-center border border-white h-7.5 375:h-12 min376:h-7.5 lg:h-10 1440:h-12 min1441:h-10">
              <button
                onClick={handleDecreaseQuantity}
                className="px-2 375:px-3.5 min376:px-2 1440:px-3.5 text-white flex items-center justify-center h-full cursor-pointer transition-colors"
                aria-label="Зменшити кількість"
              >
                <MinusIcon className="w-3.75 h-3.75 375:w-5 375:h-5" />
              </button>
              <div className="flex-[1_0_0] text-white border-r border-l 375:text-[20px] 1440:text-[20px] text-base min376:text-sm leading-[110%] font-bold border-white text-center 375:px-3.5 min376:px-2 lg:px-3 px-2 1440:px-6 h-full flex items-center justify-center">
                {quantity}
              </div>
              <button
                onClick={handleIncreaseQuantity}
                className="375:px-3.5 px-2 min376:px-2 1440:px-3.5 text-white flex items-center justify-center h-full cursor-pointer transition-colors"
                aria-label="Збільшити кількість"
              >
                <PlusIcon className="375:w-5 375:h-5 w-3.75 h-3.75" />
              </button>
            </div>

            <div className="grid grid-cols-[1fr_auto] border border-white h-7.5 375:h-12 min376:h-7.5 lg:h-10 1440:h-12 min1441:h-10 1440:w-fit min1440:justify-self-start">
              <button
                onClick={handleAddToCart}
                className="flex items-center justify-center gap-3 375:px-6 min376:px-6 px-6 lg:border-r 1440:px-6 border-white text-white cursor-pointer transition-colors h-full hover:bg-white/10"
              >
                <ShoppingCartIcon className="w-3.75 h-3.75 375:w-5 375:h-5" />
                <span className="uppercase  font-semibold 375:text-base 1440:text-base text-xs min376:text-xs 1440:leading-[137.5%]">
                  ДОДАТИ В КОРЗИНУ
                </span>
              </button>

              <button
                onClick={handleAddToWishlist}
                className="hidden 375:px-3.5 px-2 min376:px-2 1440:px-3.5 border-l lg:border-l-0 border-white text-white cursor-pointer transition-colors items-center justify-center h-full hover:bg-white/10"
                aria-label="Додати до списку побажань"
              >
                <HeartIcon
                  filled={isWishlisted}
                  className="w-3.75 h-3.75 375:w-5 375:h-5"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <section className="border-t border-white px-5 py-6 1440:px-14">
        <p className="mb-3 text-xl font-semibold uppercase tracking-[1px] text-white">
          ОПИС ТОВАРУ
        </p>
        <div className="max-w-300 text-base leading-7 text-white 375:text-base 1440:text-base wrap-anywhere whitespace-pre-wrap">
          {fullDescription || 'Опис відсутній'}
        </div>
      </section>

      <div className="border-t border-white">
        <InfoSection shareUrl={shareUrl} />
      </div>

      <section className="border-t border-white">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold uppercase tracking-[1px] text-white 375:text-base 1440:px-14">
            ДОСТАВКА ТА ОПЛАТА
            <span className="text-[#FA4616] transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <div className="px-5 pb-5 text-sm leading-7 text-gray-200 375:text-base 1440:px-14">
            <p className="uppercase">Доставка: 2-3 робочих дні</p>
            <p className="uppercase">Гарантія: 30-денне повернення коштів</p>
          </div>
        </details>
      </section>
    </div>
  );
};

export default ProductPage;
