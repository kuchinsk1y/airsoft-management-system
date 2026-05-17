'use client';

import { getProducts } from '@/actions/products';
import ProductCard from '@/components/generics/productCard/ProductCard';
import { CloseIcon } from '@/components/icons/CloseIcon';
import { MinusIcon } from '@/components/icons/MinusIcon';
import { PlusIcon } from '@/components/icons/PlusIcon';
import { RemoveIcon } from '@/components/icons/RemoveIcon';
import { Product } from '@/interfaces';
import { useCartStore } from '@/stores/cartStore';
import { getEventPath } from '@/utils/event-url';
import { formatPrice } from '@/utils/formatPrice';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export const Cart = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const regionSlug = searchParams?.get('region') || undefined;
  const isOpen = useCartStore((state) => state.isOpen);
  const closeCart = useCartStore((state) => state.closeCart);
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const addItem = useCartStore((state) => state.addItem);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  useEffect(() => {
    if (isOpen && items.length === 0) {
      getProducts().then((products) => {
        setSuggestedProducts(products.slice(0, 3));
      });
    }
  }, [isOpen, items.length]);

  useEffect(() => {
    const updateDisplayedProducts = () => {
      if (window.innerWidth >= 1024) {
        setDisplayedProducts(suggestedProducts.slice(0, 3));
      } else {
        setDisplayedProducts(suggestedProducts.slice(0, 2));
      }
    };

    updateDisplayedProducts();
    window.addEventListener('resize', updateDisplayedProducts);
    return () => window.removeEventListener('resize', updateDisplayedProducts);
  }, [suggestedProducts]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  const handleDecreaseQuantity = (itemId: string, currentQuantity: number) => {
    if (currentQuantity > 1) {
      updateQuantity(itemId, currentQuantity - 1);
    } else {
      removeItem(itemId);
    }
  };

  const handleIncreaseQuantity = (itemId: string, currentQuantity: number) => {
    updateQuantity(itemId, currentQuantity + 1);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 transition-opacity"
        style={{
          background: 'rgba(0, 0, 0, 0.40)',
          backdropFilter: 'blur(6px)',
        }}
        onClick={closeCart}
        aria-hidden="true"
      />
      <div className="fixed top-0 right-0 inset-y-0 w-full md:w-[50vw] lg:w-[40vw] 1440:max-w-130 min1441:w-[40vw] bg-background z-50 transform transition-transform duration-300 ease-in-out flex flex-col translate-x-0 md:border-l border-white min1441:border-b min1441:border-t min1441:border-r">
        <div className="flex items-center justify-between p-3 pl-4 375:p-5 min376:p-3 min376:pl-4 min1441:py-4 border-b 1440:px-10 min1441:px-4 1440:py-8 border-white min1441:pr-3">
          <h2 className="text-white text-[16px] min376:text-[16px] 375:text-2xl font-semibold uppercase leading-[116.667%] 1440:text-[32px] min1441:text-[16px] md:leading-[100%]">
            КОРЗИНА ({totalItems})
          </h2>
          <button
            onClick={closeCart}
            className="text-white shrink-0 cursor-pointer"
            aria-label="Закрити кошик"
          >
            <CloseIcon className="375:w-8 375:h-8 w-5 h-5 min376:w-6 min376:h-6 min1441:w-6 1440:w-8 min1441:h-6 1440:h-8" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white [scrollbar-width:thin] [scrollbar-color:white_transparent]">
          {items.length === 0 ? (
            <div className="flex flex-col h-full">
              <p className="text-sm min376:text-sm 375:text-base 1440:text-2xl font-semibold uppercase 375:py-5 py-3 min376:py-3 1440:py-10 min1441:py-5 h-full min376:h-full 1440:h-auto min1441:h-full text-center min376:text-center 1440:text-left min1441:text-center min1441:pl-0 min1441:text-base 375:pl-5 pl-0 min376:pl-0 1440:pl-10 opacity-40">
                ВАШ КОШИК ПУСТИЙ!
              </p>

              {displayedProducts.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-0">
                  {displayedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={addItem}
                      variant="cart"
                      regionSlug={regionSlug}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col">
              {items.map((item) => {
                const isEvent =
                  item.eventId !== undefined && item.event !== undefined;
                const isProduct =
                  item.productId !== undefined && item.product !== undefined;
                const name = isEvent
                  ? item.event!.name
                  : isProduct
                    ? item.product!.name
                    : '';
                const image = isEvent
                  ? item.event!.image
                  : isProduct
                    ? item.product!.image
                    : '';
                const selectedSide =
                  isEvent &&
                  item.eventSideId != null &&
                  item.event?.sides?.length
                    ? item.event.sides.find((s) => s.id === item.eventSideId)
                    : null;

                const itemHref = isProduct
                  ? item.product
                    ? `/products/${item.product.slug}-${item.product.id}`
                    : `/products/${item.productId}`
                  : isEvent
                    ? item.event
                      ? getEventPath(item.event)
                      : `/events/${item.eventId}`
                    : '#';

                return (
                  <div
                    key={item.id}
                    className="relative flex border-t border-b border-white"
                  >
                    <Link
                      href={itemHref}
                      className="relative 375:w-30 375:h-39.5 min376:w-[40vw] min376:h-[40vw] md:w-[20vw] md:h-[20vw] min1441:w-[15vw] min1441:h-[15vw] 1440:w-45 1440:h-45 shrink-0 border-r border-white block focus:outline-none focus:ring-2 focus:ring-[#FA4616]"
                      onClick={closeCart}
                    >
                      <Image
                        src={image}
                        alt={name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 40vw, (max-width: 767px) 40vw, (max-width: 1439px) 20vw, 180px"
                      />
                    </Link>

                    <div className="flex flex-col 375:gap-3 gap-3 py-3 px-5 375:py-3 375:px-5 min376:pr-9 1440:justify-between 1440:pr-5 flex-1 relative">
                      <div className="flex flex-col gap-1.5 items-start">
                        {isEvent && (
                          <p className="text-xs px-2 uppercase leading-[137.5%] tracking-[1.28px] text-center text-white bg-[#FA4616] font-semibold">
                            Подія
                          </p>
                        )}
                        <h3 className="text-white text-sm min376:text-sm 375:text-base font-semibold uppercase leading-[137.5%] tracking-[1.28px] 1440:text-[20px] min1441:text-[16px]">
                          <Link
                            href={itemHref}
                            className="hover:underline focus:outline-none focus:underline"
                            onClick={closeCart}
                          >
                            {name}
                          </Link>
                        </h3>
                        {selectedSide && (
                          <p className="text-gray-400 text-xs uppercase tracking-wide">
                            Сторона: {selectedSide.name}
                          </p>
                        )}
                      </div>

                      {isProduct ? (
                        <div className="1440:flex 1440:justify-between 1440:items-center flex flex-col gap-3 1440:gap-0 1440:flex-row">
                          <div className="flex border border-white w-fit self-start">
                            <button
                              onClick={() =>
                                handleDecreaseQuantity(item.id, item.quantity)
                              }
                              className="p-2.5 text-white cursor-pointer"
                              aria-label="Зменшити кількість"
                            >
                              <MinusIcon className="w-3 h-3" />
                            </button>
                            <div className="w-12 text-white px-5 py-1.25 375:text-base text-sm min376:text-sm font-bold leading-[137.5%] uppercase border-r border-l border-white flex items-center justify-center">
                              {item.quantity}
                            </div>
                            <button
                              onClick={() =>
                                handleIncreaseQuantity(item.id, item.quantity)
                              }
                              className="p-2.5 text-white cursor-pointer"
                              aria-label="Збільшити кількість"
                            >
                              <PlusIcon className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-white whitespace-nowrap 375:text-2xl min376:text-lg text-lg font-semibold leading-[133.333%] 375:tracking-[1.92px] uppercase 1440:text-2xl min1441:text-[16px]">
                            {formatPrice(item.price * item.quantity, 2)} ГРН
                          </p>
                        </div>
                      ) : (
                        <p className="text-white whitespace-nowrap 375:text-2xl min376:text-lg text-lg font-semibold leading-[133.333%] 375:tracking-[1.92px] uppercase 1440:text-2xl min1441:text-[16px] text-right">
                          {formatPrice(item.price * item.quantity, 2)} ГРН
                        </p>
                      )}

                      <button
                        onClick={() => removeItem(item.id)}
                        className="absolute top-3 right-4 min376:right- 375:top-3 375:right-5 text-white ml-2 cursor-pointer"
                        aria-label={
                          isEvent ? 'Видалити подію' : 'Видалити товар'
                        }
                      >
                        <RemoveIcon className="w-4 h-4 375:w-4 375:h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className=" shrink-0 pb-4 md:pb-6">
          <div className="flex justify-between items-center 375:p-5 p-3 px-4 min376:p-3 min376:px-4 1440:px-10 1440:py-8 min1441:px-4 min1441:py-4 text-white 375:text-2xl min376:text-base text-base 1440:text-[32px] min1441:text-[16px] md:leading-[100%] font-semibold leading-[116.667%] border-t border-white">
            <p>ВСЬОГО:</p>
            <p>
              {items.length > 0 ? `${formatPrice(totalPrice, 2)} ГРН` : '0'}
            </p>
          </div>
          <button
            onClick={() => {
              if (items.length > 0) {
                router.push('/checkout');
              }
            }}
            className={`w-full flex items-center justify-center border-t border-white text-white uppercase 375:text-xl min376:text-base text-base 1440:text-2xl min1441:text-base md:leading-[116.667%] font-bold leading-[140%] 375:py-4 py-3 px-8 min376:py-3 1440:py-5 min1441:py-4 gap-2.5 cursor-pointer ${items.length > 0 ? 'bg-[#FA4616]' : 'bg-[#727272]'}`}
          >
            ОПЛАТИТИ ЗАМОВЛЕННЯ
          </button>
        </div>
      </div>
    </>
  );
};
