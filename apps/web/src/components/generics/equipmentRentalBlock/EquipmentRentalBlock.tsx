'use client';

import { getProducts } from '@/actions/products';
import ProductCard from '@/components/generics/productCard/ProductCard';
import { useUser } from '@/contexts/UserContext';
import { DealType, Product } from '@/interfaces';
import { useCartStore } from '@/stores/cartStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type EquipmentRentalBlockProps = {
  initialProducts?: Product[];
};

const EquipmentRentalBlock = ({ initialProducts = [] }: EquipmentRentalBlockProps) => {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const addItem = useCartStore(state => state.addItem);
  const regionSlug = searchParams?.get('region') || undefined;
  const [products, setProducts] = useState<Product[]>(initialProducts);

  useEffect(() => {
    if (initialProducts.length > 0) {
      setProducts(initialProducts);
      return;
    }

    const loadProducts = async () => {
      const fetchedProducts = await getProducts({
        regionSlug,
        dealType: DealType.RENT,
        isActive: true,
      });
      setProducts(fetchedProducts.slice(0, 4));
    };

    loadProducts();
  }, [regionSlug, initialProducts]);

  const handleAddToCart = (product: Product) => {
    if (!user) {
      router.push('/login');
      return;
    }
    addItem(product, 1);
  };

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <h2 className="text-white uppercase text-base min376:text-base 375:text-2xl lg:text-xl 1440:text-[32px] min1441:text-[30px] font-medium leading-[133.333%] 1440:leading-[125%] min376:py-3 py-3 p-5 lg:pl-[3vw] 1440:pl-20 1440:py-14 min1441:py-6">
        ПРОКАТ ОБЛАДНАННЯ
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border-l border-r border-white border-b sm:border-l-0 sm:border-r-0 border-t-0">
        {products.map((product, index) => {
          const isLastInRowMobile = index % 2 === 1;
          const isLastInRowDesktop = index % 4 === 3;

          return (
            <div
              key={product.id}
              className={`border-r border-white box-border  ${
                isLastInRowMobile ? 'border-r-0 sm:border-r' : ''
              } ${isLastInRowDesktop ? 'sm:border-r-0' : ''} [&>div]:box-border [&>div]:375:gap-0 [&_div.relative]:h-44 [&_div.relative]:min-[440px]:h-50 [&_div.relative]:min-[500px]:h-60 [&_div.relative]:sm:h-40 [&_div.relative]:md:h-[20vw] [&_div.relative]:1440:h-87 [&_div.relative]:min1441:h-[20vw]`}
            >
              <ProductCard product={product} onAddToCart={handleAddToCart} regionSlug={regionSlug} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EquipmentRentalBlock;
