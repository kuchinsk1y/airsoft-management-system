'use server';

import type { Product, ProductsFilters } from '@/interfaces';
import { NEXT_PUBLIC_API_URL, STATIC_API_KEY } from '@/utils/config';

export async function getProducts(
  filters?: ProductsFilters,
): Promise<Product[]> {
  try {
    const url = new URL(`${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/products`);

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'x-api-key': STATIC_API_KEY },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export const getProduct = async (id: number): Promise<Product | null> => {
  try {
    const response = await fetch(
      `${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/products/${id}`,
      {
        cache: 'no-store',
        headers: { 'x-api-key': STATIC_API_KEY },
      },
    );

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
};

export const getProductBySlug = async (slug: string): Promise<Product | null> => {
  try {
    const response = await fetch(
      `${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/products/${slug}`,
      {
        cache: 'no-store',
        headers: { 'x-api-key': STATIC_API_KEY },
      },
    );

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
};
