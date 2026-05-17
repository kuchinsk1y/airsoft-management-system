import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma-client';
import { PrismaService } from '../prisma/prisma.service';
import { generateSlug } from '../utils/slug';
import { CitiesFilters, CitiesResponse, UpdateCitySeoDto } from './interfaces';

const cityInclude = { region: true } as const;

@Injectable()
export class CitiesDataService {
  constructor(private readonly prisma: PrismaService) {}

  generateSlug(name: string): string {
    return generateSlug(name);
  }

  async create(name: string, regionId: number): Promise<CitiesResponse> {
    const slug = this.generateSlug(name);
    return this.prisma.city.create({
      data: {
        name,
        slug,
        regionId,
      },
      include: cityInclude,
    }) as Promise<CitiesResponse>;
  }

  async get(
    filters: CitiesFilters = {},
  ): Promise<CitiesResponse | CitiesResponse[]> {
    const whereRegion =
      filters.regionId !== undefined
        ? { regionId: filters.regionId }
        : filters.regionSlug !== undefined
          ? { region: { slug: filters.regionSlug } }
          : {};

    if (
      filters.id !== undefined ||
      filters.slug !== undefined ||
      filters.name !== undefined
    ) {
      const result = await this.prisma.city.findFirst({
        where: {
          AND: [
            {
              OR: [
                { id: filters.id },
                { slug: filters.slug },
                { name: filters.name },
              ],
            },
            whereRegion,
          ],
        },
        include: cityInclude,
      });
      return result as CitiesResponse;
    }

    return (await this.prisma.city.findMany({
      where: whereRegion,
      orderBy: { name: 'asc' },
      include: cityInclude,
    })) as CitiesResponse[];
  }

  async updateSeo(id: number, dto: UpdateCitySeoDto): Promise<CitiesResponse> {
    const updated = await this.prisma.city.update({
      where: { id },
      data: {
        seoText: dto.seoText ?? null,
        seoFaq: dto.seoFaq !== undefined
          ? (dto.seoFaq as unknown as Prisma.InputJsonValue)
          : undefined,
      },
      include: cityInclude,
    });
    return updated as unknown as CitiesResponse;
  }
}
