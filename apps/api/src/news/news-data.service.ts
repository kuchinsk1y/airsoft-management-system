import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma-client';
import { PrismaService } from '../prisma/prisma.service';
import { NewsListFilters, NewsWithRelations } from './interfaces';

@Injectable()
export class NewsDataService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly relationInclude = {
    author: {
      select: {
        id: true,
        nickName: true,
        fullName: true,
        logoUrl: true,
      },
    },
    updatedBy: {
      select: {
        id: true,
        nickName: true,
        fullName: true,
      },
    },
  } as const;

  async findById(id: number): Promise<NewsWithRelations | null> {
    return this.prisma.news.findUnique({
      where: { id },
      include: this.relationInclude,
    });
  }

  async findBySlug(
    slug: string,
    publishedOnly: boolean,
  ): Promise<NewsWithRelations | null> {
    return this.prisma.news.findFirst({
      where: {
        slug,
        ...(publishedOnly ? { published: true } : {}),
      },
      include: this.relationInclude,
    });
  }

  async findAdjacentBySlug(
    slug: string,
    limit: number,
  ): Promise<{
    previous: NewsWithRelations[];
    next: NewsWithRelations[];
  } | null> {
    const current = await this.prisma.news.findFirst({
      where: {
        slug,
        published: true,
      },
      select: {
        id: true,
        publishedAt: true,
        createdAt: true,
      },
    });

    if (!current) {
      return null;
    }

    const hasPublishedAt = Boolean(current.publishedAt);

    const orderBy: Prisma.NewsOrderByWithRelationInput[] = hasPublishedAt
      ? [{ publishedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }]
      : [{ createdAt: 'desc' }, { id: 'desc' }];

    const newerWhere: Prisma.NewsWhereInput = hasPublishedAt
      ? {
          published: true,
          OR: [
            { publishedAt: { gt: current.publishedAt! } },
            {
              publishedAt: current.publishedAt,
              createdAt: { gt: current.createdAt },
            },
            {
              publishedAt: current.publishedAt,
              createdAt: current.createdAt,
              id: { gt: current.id },
            },
          ],
        }
      : {
          published: true,
          OR: [
            { createdAt: { gt: current.createdAt } },
            { createdAt: current.createdAt, id: { gt: current.id } },
          ],
        };

    const olderWhere: Prisma.NewsWhereInput = hasPublishedAt
      ? {
          published: true,
          OR: [
            { publishedAt: { lt: current.publishedAt! } },
            {
              publishedAt: current.publishedAt,
              createdAt: { lt: current.createdAt },
            },
            {
              publishedAt: current.publishedAt,
              createdAt: current.createdAt,
              id: { lt: current.id },
            },
          ],
        }
      : {
          published: true,
          OR: [
            { createdAt: { lt: current.createdAt } },
            { createdAt: current.createdAt, id: { lt: current.id } },
          ],
        };

    const [previous, next] = await this.prisma.$transaction([
      this.prisma.news.findMany({
        where: newerWhere,
        include: this.relationInclude,
        orderBy,
        take: limit,
      }),
      this.prisma.news.findMany({
        where: olderWhere,
        include: this.relationInclude,
        orderBy,
        take: limit,
      }),
    ]);

    return { previous, next };
  }

  async findMany(
    filters: NewsListFilters,
  ): Promise<{ items: NewsWithRelations[]; total: number }> {
    const where: Prisma.NewsWhereInput = {
      ...(filters.published !== undefined
        ? { published: filters.published }
        : {}),
      ...(filters.category !== undefined ? { category: filters.category } : {}),
      ...(filters.searchQuery
        ? {
            OR: [
              {
                title: {
                  contains: filters.searchQuery,
                  mode: 'insensitive',
                },
              },
              {
                excerpt: {
                  contains: filters.searchQuery,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.news.findMany({
        where,
        include: this.relationInclude,
        orderBy: [
          { published: 'desc' },
          { publishedAt: 'desc' },
          { createdAt: 'desc' },
        ],
        take: filters.limit,
        skip: filters.offset,
      }),
      this.prisma.news.count({ where }),
    ]);

    return { items, total };
  }

  async create(
    data: Prisma.NewsUncheckedCreateInput,
  ): Promise<NewsWithRelations> {
    return this.prisma.news.create({
      data,
      include: this.relationInclude,
    });
  }

  async update(
    id: number,
    data: Prisma.NewsUncheckedUpdateInput,
  ): Promise<NewsWithRelations> {
    return this.prisma.news.update({
      where: { id },
      data,
      include: this.relationInclude,
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.news.delete({ where: { id } });
  }
}
