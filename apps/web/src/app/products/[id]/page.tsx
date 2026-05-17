import { getProduct, getProductBySlug } from '@/actions/products';
import { getTemplate } from '@/actions/template';
import { toAbsoluteUrl } from '@/app/utils/template-metadata';
import { getLocalizedAlternates, getRequestLocale, localizePath } from '@/app/utils/locale-seo';
import {
  extractProductIdFromRouteParam,
  getProductPath,
  getProductRouteParam,
} from '@/utils/product-url';
import type { Metadata } from 'next';
import ProductPage from '@/pages/ProductPage';
import { notFound, redirect } from 'next/navigation';

const toQueryString = (
  searchParams: Record<string, string | string[] | undefined>,
): string => {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
      return;
    }

    params.set(key, value);
  });

  const query = params.toString();
  return query ? `?${query}` : '';
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const locale = await getRequestLocale();
  const { id: routeParam } = await params;
  const productId = extractProductIdFromRouteParam(routeParam);
  const product =
    productId !== null ? await getProduct(productId) : await getProductBySlug(routeParam);

  if (!product) {
    return {
      title: 'Товар не знайдено | Strike Shop Action',
      robots: {
        index: false,
        follow: false,
      },
      alternates: {
        ...(await getLocalizedAlternates('/rental', locale)),
        canonical: toAbsoluteUrl(localizePath('/rental', locale)),
      },
    };
  }

  const canonicalPath = getProductPath(product);
  const canonical = toAbsoluteUrl(localizePath(canonicalPath, locale));
  const title = `${product.name} | Strike Shop Action`;
  const description = product.description;

  return {
    title,
    description,
    alternates: {
      ...(await getLocalizedAlternates(canonicalPath, locale)),
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      images: product.image ? [{ url: toAbsoluteUrl(product.image) }] : undefined,
    },
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id: routeParam }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const productId = extractProductIdFromRouteParam(routeParam);
  const product =
    productId !== null ? await getProduct(productId) : await getProductBySlug(routeParam);

  if (!product) notFound();

  const locale = await getRequestLocale();

  const canonicalRouteParam = getProductRouteParam(product);
  if (routeParam !== canonicalRouteParam) {
    redirect(`${getProductPath(product)}${toQueryString(resolvedSearchParams)}`);
  }

  const shareUrl = toAbsoluteUrl(localizePath(getProductPath(product), locale));

  const templateResult = await getTemplate('products');

  let template: { breadcrumbs: string[] } | undefined;
  if (templateResult.success) {
    const data = templateResult.data as { breadcrumbs?: string[] };
    if (data.breadcrumbs) {
      template = {
        breadcrumbs: data.breadcrumbs,
      };
    }
  }

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    sku: String(product.id),
    image: product.image ? [toAbsoluteUrl(product.image)] : undefined,
    brand: {
      '@type': 'Brand',
      name: 'Strike Shop Action',
    },
    offers: {
      '@type': 'Offer',
      url: toAbsoluteUrl(getProductPath(product)),
      priceCurrency: 'UAH',
      price: String(product.price),
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <ProductPage product={product} template={template} shareUrl={shareUrl} />
    </>
  );
}
