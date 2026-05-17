'use client';

import { HeartIcon } from '@/components/icons/HeartIcon';
import { ShoppingCartIcon } from '@/components/icons/ShoppingCartIcon';
import type { ProductCardProps } from '@/interfaces';
import { DealType } from '@/interfaces';
import { getProductPath } from '@/utils/product-url';
import { formatPrice } from '@/utils/formatPrice';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const ProductCard = ({
  product,
  onAddToCart,
  onAddToWishlist,
  variant = 'default',
  regionSlug,
  hideDescription = false,
  forceDetailsButton = false,
}: ProductCardProps) => {
  const router = useRouter();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const isCartVariant = variant === 'cart';
  const isRentalCard = product.dealType === DealType.RENT;
  const shouldShowDescription = !hideDescription && !isRentalCard;
  const showDetailsLayout = isRentalCard || forceDetailsButton;

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    if (onAddToWishlist) {
      onAddToWishlist(product);
    }
  };

  const handleCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  const productImageAlt = product.name;
  const productImageTitle = `${product.name} - Strike Shop Action`;

  const handleCardClick = () => {
    const productPath = getProductPath(product);
    router.push(
      regionSlug ? `${productPath}?region=${regionSlug}` : productPath,
    );
  };

  const isNew = () => {
    const createdAt = new Date(product.createdAt);
    const now = new Date();
    const daysDiff =
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 30;
  };

  if (isCartVariant) {
    return (
      <div className="flex flex-col border-r border-b border-t border-white bg-black overflow-hidden h-full">
        <div className="relative w-full 375:h-43.25 min376:h-43.25 md:h-43.25 1440:h-43.25 border-b border-white">
          <div className="absolute inset-0 p-1">
            <div className="relative h-full w-full">
              <Image
                src={product.image}
                alt={productImageAlt}
                title={productImageTitle}
                fill
                className="object-cover"
                sizes="(max-width: 767px) 100vw, (max-width: 1439px) 33vw, 25vw"
              />
            </div>
          </div>
        </div>
        <div className="p-4 min1441:p-2 flex flex-col flex-1 375:gap-5 1440:gap-5 gap-3 min376:gap-3 min1441:gap-3">
          <h3 className="text-white uppercase text-sm min376:text-sm 375:text-base 1440:text-base min1441:text-sm font-semibold leading-[125%] tracking-[1.28px] flex-1">
            {product.name}
          </h3>
          <p className="text-white uppercase 375:text-xl min376:text-base text-base 1440:text-xl min1441:text-base font-semibold leading-[120%] tracking-[1.6px] whitespace-nowrap">
            {formatPrice(product.price, 2)} ГРН
          </p>
          <button
            onClick={handleCartClick}
            className="flex items-center justify-center border border-white bg-black text-white w-full 375:p-3.5 1440:p-3.5 min376:p-2 p-2 min1441:p-2"
            aria-label="Додати до кошика"
            title="Додати до кошика"
          >
            <ShoppingCartIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border-t border-white bg-black gap-0 375:gap-5 min376:gap-0 md:w-full md:border-l md:border-b md:nth-[2n]:border-r md:last:border-r lg:w-full lg:border-l lg:border-b lg:nth-[3n]:border-r lg:last:border-r lg:gap-0 min1441:w-full min1441:border-l min1441:border-b min1441:nth-[3n]:border-r min1441:last:border-r">
      <div
        className="relative w-full h-88.25 lg:h-75 1440:h-75 min1441:aspect-video overflow-hidden border-b border-white cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="absolute inset-0 p-1">
          <div className="relative h-full w-full">
            <Image
              src={product.image}
              alt={productImageAlt}
              title={productImageTitle}
              fill
              className="object-cover"
              sizes="(max-width: 320px) 100vw, (max-width: 1440px) 100vw, 100vw"
            />
          </div>
        </div>
        {isNew() && (
          <div className="absolute left-2.5 top-2.5 1440:left-4 1440:top-4 flex flex-col justify-center items-start px-2.5 py-1.5 bg-[#FA4616]">
            <span className="text-white font-sans text-base leading-[100%] lg:text-sm 1440:text-xl min1441:text-sm 1440:leading-[120%] font-semibold uppercase">
              НОВЕ
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col flex-1 p-5 gap-2 375:gap-3 min376:gap-2 lg:py-4 1440:p-8 min1441:py-4 lg:gap-4 1440:gap-5 min1441:gap-3">
        <div className="flex flex-col flex-1 gap-1.5 375:gap-2 min376:gap-1.5 lg:gap-2 1440:gap-5 min1441:gap-1">
          <h3
            className="font-sans text-[15px] tracking-[0] font-semibold uppercase text-white 375:text-[20px] 375:leading-[120%] min376:tracking-[0] min376:text-[15px] 375:tracking-[1px] lg:text-base 1440:text-2xl min1441:text-base min1441:leading-tight 1440:leading-[125%] 1440:tracking-[1.92px] cursor-pointer hover:underline transition-colors"
            onClick={handleCardClick}
          >
            {product.name}
          </h3>
          {shouldShowDescription && (
            <p
              className="text-white uppercase font-sans text-sm font-light leading-[143%] 1440:text-xs min1441:text-[10px] min1441:font-light min1441:leading-[120%] 1440:font-light 1440:leading-[150%] min376:text-xs tracking-[1px] overflow-hidden"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 8,
                WebkitBoxOrient: 'vertical',
              }}
              title={product.description}
            >
              {product.description}
            </p>
          )}
        </div>
        <div className="mt-auto flex flex-col gap-2 375:gap-3 min376:gap-2 lg:gap-4 1440:gap-5 min1441:gap-3">
          <p className="font-sans font-semibold uppercase text-white text-xs 375:text-2xl 375:tracking-[1.92px] tracking-[1px] min376:text-xs min376:tracking-[1px] lg:text-base 1440:text-2xl min1441:text-base leading-[133.33%] 1440:tracking-[1.92px]">
            {formatPrice(product.price, 2)} ГРН
          </p>
          {showDetailsLayout ? (
            <div className="flex gap-2">
              <button
                onClick={handleCardClick}
                className="flex flex-1 items-center justify-center border border-white px-4 py-3 text-sm font-semibold uppercase tracking-[1px] text-white cursor-pointer transition-colors hover:bg-white/10 375:h-12 min376:h-8.75 lg:h-[3vw] 1440:h-12 min1441:h-[2vw]"
                aria-label="Детальніше"
              >
                <span className="lg:hidden">Деталі</span>
                <span className="hidden lg:block">Детальніше</span>
              </button>
              <button
                onClick={handleCartClick}
                className="flex w-12 shrink-0 items-center justify-center border border-white text-white cursor-pointer transition-colors hover:bg-white/10 375:h-12 min376:h-8.75 lg:h-[3vw] 1440:h-12 min1441:h-[2vw]"
                aria-label="Додати до кошика"
              >
                <ShoppingCartIcon className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex border border-white lg:h-[3vw] min376:h-8.75 h-8.75 375:h-12 1440:h-12 min1441:h-[2vw]">
              <button
                onClick={handleWishlistClick}
                className="hidden group items-center justify-center p-3.5 1440:px-6 border-r border-white text-white cursor-pointer transition-colors"
                aria-label="Додати до списку побажань"
              >
                <HeartIcon
                  filled={isWishlisted}
                  className="w-5 h-5 group-hover:fill-white"
                />
              </button>
              <button
                onClick={handleCartClick}
                className="flex flex-1 items-center justify-center py-3.5 text-white cursor-pointer transition-colors"
                aria-label="Додати до кошика"
              >
                <ShoppingCartIcon className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
