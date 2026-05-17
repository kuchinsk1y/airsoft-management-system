import { Injectable, NotFoundException } from '@nestjs/common';
import { RegionsDataService } from './regions-data.service';
import { RegionsFilters, RegionsResponse, UpdateRegionSeoDto } from './interfaces';

@Injectable()
export class RegionsService {
  constructor(private readonly regionsData: RegionsDataService) {}

  async get(
    filters: RegionsFilters = {},
  ): Promise<RegionsResponse | RegionsResponse[]> {
    const result = await this.regionsData.get(filters);

    if (
      filters.id !== undefined ||
      filters.slug !== undefined ||
      filters.name !== undefined
    ) {
      if (!result) {
        throw new NotFoundException('REGION_NOT_FOUND');
      }
      return result as RegionsResponse;
    }

    return result as RegionsResponse[];
  }

  async updateSeo(id: number, dto: UpdateRegionSeoDto): Promise<RegionsResponse> {
    return this.regionsData.updateSeo(id, dto);
  }
}
