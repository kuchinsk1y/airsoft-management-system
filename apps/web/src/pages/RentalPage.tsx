'use client';

import { getProducts } from '@/actions/products';
import TitleBlock from '@/components/TitleBlock/TitleBlock';
import Pagination from '@/components/generics/pagination/Pagination';
import ProductCard from '@/components/generics/productCard/ProductCard';
import { useUser } from '@/contexts/UserContext';
import {
  DealType,
  Product,
  ProductCategory,
  ProductsFilters,
  RentalPageProps,
} from '@/interfaces';
import { useCartStore } from '@/stores/cartStore';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import SeoTextBlock from '@/components/seo/SeoTextBlock';
import FaqBlock from '@/components/seo/FaqBlock';

const SearchAndFilters = dynamic(
  () => import('@/components/content/products/SearchAndFilters').then((module) => module.SearchAndFilters),
);
const Filters = dynamic(
  () => import('@/components/content/products/Filters').then((module) => module.Filters),
);

const DEAL_MAP: Record<ProductCategory, DealType | null> = {
  'ВСІ ТОВАРИ': null,
  ОРЕНДА: DealType.RENT,
  КУПІВЛЯ: DealType.SALE,
};

const PRODUCTS_PER_PAGE = 6;

const RentalPage = ({ initialProducts, template }: RentalPageProps) => {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const addItem = useCartStore((state) => state.addItem);

  const getInitialMaxPrice = (): number => {
    if (!initialProducts || initialProducts.length === 0) return 0;
    const maxPrice = Math.max(
      ...initialProducts.map((product) => product.price),
    );
    return Math.ceil(maxPrice);
  };

  const initialMaxPrice = getInitialMaxPrice();

  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<ProductCategory>('ВСІ ТОВАРИ');
  const [priceRange, setPriceRange] = useState({
    min: 0,
    max: initialMaxPrice,
  });
  const [debouncedPriceRange, setDebouncedPriceRange] = useState({
    min: 0,
    max: initialMaxPrice,
  });
  const [maxAvailablePrice, setMaxAvailablePrice] = useState(initialMaxPrice);
  const [sortBy, setSortBy] =
    useState<ProductsFilters['sortBy']>('recommended');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [visibleProductsCount, setVisibleProductsCount] =
    useState(PRODUCTS_PER_PAGE);
  const [currentPage, setCurrentPage] = useState(0);
  const productsContainerRef = useRef<HTMLDivElement>(null);
  const priceRangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestRequestIdRef = useRef(0);

  useEffect(() => {
    const fetchMaxPrice = async () => {
      const allProducts = await getProducts();
      if (allProducts.length > 0) {
        const maxPrice = Math.max(
          ...allProducts.map((product) => product.price),
        );
        const roundedMax = Math.ceil(maxPrice);
        setMaxAvailablePrice(roundedMax);
        setPriceRange({ min: 0, max: roundedMax });
        setDebouncedPriceRange({ min: 0, max: roundedMax });
      }
    };
    fetchMaxPrice();
  }, []);

  useEffect(() => {
    if (priceRangeTimeoutRef.current) {
      clearTimeout(priceRangeTimeoutRef.current);
    }

    priceRangeTimeoutRef.current = setTimeout(() => {
      setDebouncedPriceRange(priceRange);
    }, 500);

    return () => {
      if (priceRangeTimeoutRef.current) {
        clearTimeout(priceRangeTimeoutRef.current);
      }
    };
  }, [priceRange]);

  useEffect(() => {
    const requestId = ++latestRequestIdRef.current;

    const loadProducts = async () => {
      try {
        const dealTypeFilter = DEAL_MAP[category];
        const regionSlug = searchParams?.get('region') || undefined;
        const fetchedProducts = await getProducts({
          regionSlug,
          dealType:
            category === 'ВСІ ТОВАРИ' ? undefined : dealTypeFilter ?? undefined,
          searchQuery: searchQuery.trim() || undefined,
          minPrice:
            debouncedPriceRange.min > 0 ? debouncedPriceRange.min : undefined,
          maxPrice:
            debouncedPriceRange.max < maxAvailablePrice
              ? debouncedPriceRange.max
              : undefined,
          sortBy: sortBy !== 'recommended' ? sortBy : undefined,
        });

        if (requestId !== latestRequestIdRef.current) {
          return;
        }

        setProducts(fetchedProducts);
        setVisibleProductsCount(PRODUCTS_PER_PAGE);
        setCurrentPage(0);
      } catch (error) {
        if (requestId !== latestRequestIdRef.current) {
          return;
        }

        console.error('Failed to fetch products:', error);
        setProducts([]);
      }
    };

    loadProducts();
  }, [
    searchQuery,
    debouncedPriceRange,
    sortBy,
    category,
    maxAvailablePrice,
    searchParams,
  ]);

  useEffect(() => {
    if (productsContainerRef.current) {
      productsContainerRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [currentPage]);

  const handleAddToCart = (product: Product) => {
    if (!user) {
      router.push('/login');
      return;
    }
    addItem(product, 1);
  };

  const handleAddToWishlist = (product: Product) => {
    if (!user) {
      router.push('/login');
      return;
    }
  };

  const handleShowMore = () => {
    setVisibleProductsCount((prev) => prev + PRODUCTS_PER_PAGE);
  };

  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);
  const startIndex = currentPage * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;

  const mobileProducts = products.slice(0, visibleProductsCount);
  const hasMoreProducts = products.length > visibleProductsCount;
  const desktopProducts = products.slice(startIndex, endIndex);

  const regionSlug = searchParams?.get('region') || undefined;

  const renderProductCard = (product: Product) => (
    <ProductCard
      key={product.id}
      product={product}
      onAddToCart={handleAddToCart}
      onAddToWishlist={handleAddToWishlist}
      hideDescription
      forceDetailsButton
      regionSlug={regionSlug}
    />
  );

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  return (
    <div className="border-b border-white">
      {template && template.title && template.breadcrumbs && (
        <TitleBlock
          title={template.title}
          path={template.breadcrumbs}
          className="min320:pr-5 min320:pl-5 min320:py-5 lg:p-[3vw] 1440:py-14 1440:pl-20 1440:px-20 flex-col gap-3 1440:gap-10 min1441:p-[2vw] min1441:gap-5 1440:border-r 1440:border-white"
          titleClassName="text-white text-[5vw] 375:text-[40px] 375:leading-[120%] min376:text-[5vw] md:text-[5.21vw] lg:text-[3.91vw] 1440:text-[80px] 1440:leading-[100%] min1441:text-[3.5vw] min-[320px]:mb-0"
          breadcrumbClassName="min-[320px]:mb-0 min-[320px]:text-[8px] 375:text-[12px] min376:text-[8px] md:text-[10px] lg:text-[12px]"
        />
      )}

      <SearchAndFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onFiltersClick={() => setIsFiltersOpen(true)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4  min1441:grid-cols-4 lg:gap-0 min1441:gap-0 lg:border-t-0 lg:border-r lg:border-white ">
        <Filters
          isOpen={isFiltersOpen}
          onClose={() => setIsFiltersOpen(false)}
          category={category}
          onCategoryChange={setCategory}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          maxAvailablePrice={maxAvailablePrice}
        />

        <div
          ref={productsContainerRef}
          className="grid grid-cols-1 min-w-0 md:grid-cols-2 lg:col-span-3 lg:grid-cols-3 gap-0 375:gap-3 min376:gap-0 md:border-l md:border-r-0 "
        >
          {products.length > 0 ? (
            <>
              <div className="contents lg:hidden">
                {mobileProducts.map(renderProductCard)}
              </div>
              <div className="hidden lg:contents">
                {desktopProducts.map(renderProductCard)}
              </div>
            </>
          ) : (
            <div className="col-span-full text-center text-gray-400 py-10 border-y lg:border-t-0 border-white">
              <p>Товари не знайдено</p>
            </div>
          )}
        </div>

        <Pagination
          hasMoreItems={hasMoreProducts}
          totalPages={totalPages}
          currentPage={currentPage}
          onShowMore={handleShowMore}
          onNextPage={handleNextPage}
          onPrevPage={handlePrevPage}
          showMoreText="ПОКАЗАТИ БІЛЬШЕ ТОВАРІВ"
          className="min1441:col-span-4"
          paginationClassName="lg:col-start-2 lg:col-span-3"
        />
      </div>
      {currentPage === 0 && (
        <>
          <SeoTextBlock text={template?.seoText} className="min991:px-20" />
          <FaqBlock items={template?.seoFaq} className="min991:px-20" />
        </>
      )}
    </div>
  );
};

export default RentalPage;
