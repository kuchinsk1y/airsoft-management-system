import { NewsCategory, Prisma } from '../generated/prisma-client';

export type NewsWithRelations = Prisma.NewsGetPayload<{
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

export interface NewsResponse {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category: NewsCategory;
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

export interface NewsListFilters {
  published?: boolean;
  searchQuery?: string;
  category?: NewsCategory;
  limit: number;
  offset: number;
}

export interface NewsListResult {
  items: NewsResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdjacentNewsResult {
  previous: NewsResponse[];
  next: NewsResponse[];
}
