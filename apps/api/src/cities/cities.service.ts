import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { regionSlugForCityName } from './city-region-slug';
import { CitiesDataService } from './cities-data.service';
import { CitiesFilters, CitiesResponse, UpdateCitySeoDto } from './interfaces';

@Injectable()
export class CitiesService {
  constructor(
    private readonly citiesData: CitiesDataService,
    private readonly prisma: PrismaService,
  ) {}

  async get(
    filters: CitiesFilters = {},
  ): Promise<CitiesResponse | CitiesResponse[]> {
    const result = await this.citiesData.get(filters);

    if (
      filters.id !== undefined ||
      filters.slug !== undefined ||
      filters.name !== undefined
    ) {
      if (!result) {
        throw new NotFoundException('CITY_NOT_FOUND');
      }
      return result as CitiesResponse;
    }

    return result as CitiesResponse[];
  }

  async create(name: string, regionId: number): Promise<CitiesResponse> {
    return this.citiesData.create(name, regionId);
  }

  async updateSeo(id: number, dto: UpdateCitySeoDto): Promise<CitiesResponse> {
    return this.citiesData.updateSeo(id, dto);
  }

  async getOrCreateCity(city: string, regionId?: number): Promise<number> {
    const slug = this.citiesData.generateSlug(city);
    const existingCity = await this.prisma.city.findFirst({
      where: {
        OR: [{ name: city }, { slug }],
      },
    });
    if (existingCity) {
      if (
        regionId !== undefined &&
        existingCity.regionId !== regionId
      ) {
        throw new BadRequestException('CITY_DOES_NOT_BELONG_TO_SELECTED_REGION');
      }
      return existingCity.id;
    }

    const resolvedRegionId = await this.resolveRegionIdForNewCity(
      city,
      regionId,
    );

    try {
      const newCity = await this.citiesData.create(city, resolvedRegionId);
      return newCity.id;
    } catch {
      const cityResult = await this.prisma.city.findFirst({
        where: {
          OR: [{ name: city }, { slug }],
        },
      });
      if (cityResult) {
        return cityResult.id;
      }
      throw new Error(`Failed to create or find city: ${city}`);
    }
  }

  private async resolveRegionIdForNewCity(
    city: string,
    regionId?: number,
  ): Promise<number> {
    if (regionId !== undefined) {
      return regionId;
    }
    const inferredSlug =
      regionSlugForCityName(city) ?? 'vinnicka-oblast';
    const region = await this.prisma.region.findUnique({
      where: { slug: inferredSlug },
    });
    if (!region) {
      throw new BadRequestException('REGION_NOT_FOUND');
    }
    return region.id;
  }
}
