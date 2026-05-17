import { Prisma, WorkshopItemCategory } from '../generated/prisma-client';

export type WorkshopItemWithRelations = Prisma.WorkshopItemGetPayload<{
  include: {
    author: {
      select: {
        id: true;
        nickName: true;
        fullName: true;
        logoUrl: true;
      };
    };
    updatedBy: {
      select: {
        id: true;
        nickName: true;
        fullName: true;
      };
    };
  };
}>;

export interface WorkshopItemResponse {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category: WorkshopItemCategory;
  published: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: number;
    nickName: string;
    fullName?: string;
    logoUrl?: string;
  };
  updatedBy?: {
    id: number;
    nickName: string;
    fullName?: string;
  };
}

export interface WorkshopItemListFilters {
  published?: boolean;
  searchQuery?: string;
  category?: WorkshopItemCategory;
  limit: number;
  offset: number;
}

export interface WorkshopItemListResult {
  items: WorkshopItemResponse[];
  total: number;
  limit: number;
  offset: number;
}
