import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Admin } from '../common/decorators/admin.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { CitiesService } from './cities.service';
import { UpdateCitySeoDto } from './interfaces';

const CITIES_CACHE_CONTROL = 'no-store, no-cache, must-revalidate';

@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Public()
  @UseGuards(ApiKeyGuard)
  @Get()
  @Header('Cache-Control', CITIES_CACHE_CONTROL)
  findAll(
    @Query('slug') slug?: string,
    @Query('name') name?: string,
    @Query('regionId', new ParseIntPipe({ optional: true })) regionId?: number,
    @Query('regionSlug') regionSlug?: string,
  ) {
    return this.citiesService.get({ slug, name, regionId, regionSlug });
  }

  @Public()
  @UseGuards(ApiKeyGuard)
  @Get(':id')
  @Header('Cache-Control', CITIES_CACHE_CONTROL)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.citiesService.get({ id });
  }

  @Admin()
  @Patch(':id')
  updateSeo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCitySeoDto,
  ) {
    return this.citiesService.updateSeo(id, dto);
  }
}
