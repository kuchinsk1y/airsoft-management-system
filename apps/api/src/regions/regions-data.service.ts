import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma-client';
import { PrismaService } from '../prisma/prisma.service';
import { generateSlug } from '../utils/slug';
import { RegionsFilters, RegionsResponse, UpdateRegionSeoDto } from './interfaces';

@Injectable()
export class RegionsDataService {
  constructor(private readonly prisma: PrismaService) {}

  generateSlug(name: string): string {
    return generateSlug(name);
  }

  async get(
    filters: RegionsFilters = {},
  ): Promise<RegionsResponse | RegionsResponse[]> {
    const whereHasEvents =
      filters.hasEvents === true
        ? {
            cities: {
              some: {
                events: { some: {} },
              },
            },
          }
        : {};

    if (
      filters.id !== undefined ||
      filters.slug !== undefined ||
      filters.name !== undefined
    ) {
      const result = await this.prisma.region.findFirst({
        where: {
          AND: [
            {
              OR: [
                { id: filters.id },
                { slug: filters.slug },
                { name: filters.name },
              ],
            },
            whereHasEvents,
          ],
        },
      });
      return result as unknown as RegionsResponse;
    }

    return (await this.prisma.region.findMany({
      where: whereHasEvents,
      orderBy: { name: 'asc' },
    })) as unknown as RegionsResponse[];
  }

  async updateSeo(
    id: number,
    dto: UpdateRegionSeoDto,
  ): Promise<RegionsResponse> {
    const updated = await this.prisma.region.update({
      where: { id },
      data: {
        seoText: dto.seoText ?? null,
        seoFaq: dto.seoFaq !== undefined
          ? (dto.seoFaq as unknown as Prisma.InputJsonValue)
          : undefined,
      },
    });
    return updated as unknown as RegionsResponse;
  }
}
