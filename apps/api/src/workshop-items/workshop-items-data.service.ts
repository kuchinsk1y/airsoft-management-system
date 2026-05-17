import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma-client';
import { PrismaService } from '../prisma/prisma.service';
import {
  WorkshopItemListFilters,
  WorkshopItemWithRelations,
} from './interfaces';

@Injectable()
export class WorkshopItemsDataService {
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

  async findById(id: number): Promise<WorkshopItemWithRelations | null> {
    return this.prisma.workshopItem.findUnique({
      where: { id },
      include: this.relationInclude,
    });
  }

  async findBySlug(
    slug: string,
    publishedOnly: boolean,
  ): Promise<WorkshopItemWithRelations | null> {
    return this.prisma.workshopItem.findFirst({
      where: {
        slug,
        ...(publishedOnly ? { published: true } : {}),
      },
      include: this.relationInclude,
    });
  }

  async findMany(
    filters: WorkshopItemListFilters,
  ): Promise<{ items: WorkshopItemWithRelations[]; total: number }> {
    const where: Prisma.WorkshopItemWhereInput = {
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
      this.prisma.workshopItem.findMany({
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
      this.prisma.workshopItem.count({ where }),
    ]);

    return { items, total };
  }

  async create(
    data: Prisma.WorkshopItemUncheckedCreateInput,
  ): Promise<WorkshopItemWithRelations> {
    return this.prisma.workshopItem.create({
      data,
      include: this.relationInclude,
    });
  }

  async update(
    id: number,
    data: Prisma.WorkshopItemUncheckedUpdateInput,
  ): Promise<WorkshopItemWithRelations> {
    return this.prisma.workshopItem.update({
      where: { id },
      data,
      include: this.relationInclude,
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.workshopItem.delete({ where: { id } });
  }
}
