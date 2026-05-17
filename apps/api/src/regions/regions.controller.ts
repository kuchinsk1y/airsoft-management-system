import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Admin } from '../common/decorators/admin.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { RegionsService } from './regions.service';
import { UpdateRegionSeoDto } from './interfaces';

const REGIONS_CACHE_CONTROL = 'no-store, no-cache, must-revalidate';

@Controller('regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @Public()
  @UseGuards(ApiKeyGuard)
  @Get()
  @Header('Cache-Control', REGIONS_CACHE_CONTROL)
  findAll(
    @Query('slug') slug?: string,
    @Query('name') name?: string,
    @Query('hasEvents', new ParseBoolPipe({ optional: true }))
    hasEvents?: boolean,
  ) {
    return this.regionsService.get({ slug, name, hasEvents });
  }

  @Public()
  @UseGuards(ApiKeyGuard)
  @Get(':id')
  @Header('Cache-Control', REGIONS_CACHE_CONTROL)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.regionsService.get({ id });
  }

  @Admin()
  @Patch(':id')
  updateSeo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRegionSeoDto,
  ) {
    return this.regionsService.updateSeo(id, dto);
  }
}
