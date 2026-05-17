import type { Product } from '@/interfaces';

type ProductRouteData = Pick<Product, 'id' | 'slug'>;

export const getProductRouteParam = ({ id, slug }: ProductRouteData): string =>
  `${slug}-${id}`;

export const getProductPath = (product: ProductRouteData): string =>
  `/products/${getProductRouteParam(product)}`;

export const extractProductIdFromRouteParam = (
  routeParam: string,
): number | null => {
  if (/^\d+$/.test(routeParam)) {
    return Number(routeParam);
  }

  const match = routeParam.match(/-(\d+)$/);
  if (!match) {
    return null;
  }

  return Number(match[1]);
};
