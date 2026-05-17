import { DealType, Prisma } from '../generated/prisma-client';

export { DealType };

export type ProductsWithCity = Prisma.ProductGetPayload<{
  include: { city: true };
}>;

export interface ProductsRequest {
  name: string;
  slug?: string;
  price: number;
  description: string;
  image: string;
  inStock: boolean;
  isActive: boolean;
  dealType?: DealType;
  city?: string;
}

export interface ProductsResponse {
  id: number;
  name: string;
  slug: string;
  price: number;
  description: string;
  image: string;
  inStock: boolean;
  isActive: boolean;
  dealType: DealType;
  cityId?: number;
  city?: {
    id: number;
    name: string;
    slug: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type ProductsFilters = {
  ids?: number[];
  slug?: string;
  cityId?: number;
  citySlug?: string;
  city?: string;
  regionSlug?: string;
  dealType?: DealType;
  searchQuery?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price-low' | 'price-high' | 'name' | 'recommended';
  isActive?: boolean;
  inStock?: boolean;
};
