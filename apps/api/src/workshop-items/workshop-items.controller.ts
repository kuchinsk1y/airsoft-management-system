import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseBoolPipe,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Admin } from '../common/decorators/admin.decorator';
import { Public } from '../common/decorators/public.decorator';
import { User } from '../common/decorators/user.decorator';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { WorkshopItemCategory } from '../generated/prisma-client';
import { CreateWorkshopItemDto } from './dto/create-workshop-item.dto';
import { UpdateWorkshopItemDto } from './dto/update-workshop-item.dto';
import { WorkshopItemsService } from './workshop-items.service';

const WORKSHOP_ITEMS_CACHE_CONTROL = 'no-store, no-cache, must-revalidate';

@Controller('workshop-items')
export class WorkshopItemsController {
  constructor(private readonly workshopItemsService: WorkshopItemsService) {}

  @Post()
  @Admin()
  async create(
    @User('userId') userId: number,
    @Body() dto: CreateWorkshopItemDto,
  ) {
    return this.workshopItemsService.createWorkshopItem(userId, dto);
  }

  @Public()
  @UseGuards(ApiKeyGuard)
  @Get()
  @Header('Cache-Control', WORKSHOP_ITEMS_CACHE_CONTROL)
  async findAll(
    @User('userId') userId: number | null,
    @Query('published', new ParseBoolPipe({ optional: true }))
    published?: boolean,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
    @Query('searchQuery') searchQuery?: string,
    @Query('category',
      new ParseEnumPipe(WorkshopItemCategory, { optional: true }),
    )
    category?: WorkshopItemCategory,
  ) {
    return this.workshopItemsService.getWorkshopItemList(userId ?? undefined, {
      published,
      limit,
      offset,
      searchQuery,
      category,
    });
  }

  @Admin()
  @Get('id/:id')
  async findOneById(@Param('id', ParseIntPipe) id: number) {
    return this.workshopItemsService.getWorkshopItemById(id);
  }

  @Public()
  @UseGuards(ApiKeyGuard)
  @Get(':slug')
  @Header('Cache-Control', WORKSHOP_ITEMS_CACHE_CONTROL)
  async findOneBySlug(
    @User('userId') userId: number | null,
    @Param('slug') slug: string,
  ) {
    return this.workshopItemsService.getWorkshopItemBySlug(
      userId ?? undefined,
      slug,
    );
  }

  @Patch(':id')
  @Admin()
  async update(
    @User('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkshopItemDto,
  ) {
    return this.workshopItemsService.updateWorkshopItem(userId, id, dto);
  }

  @Delete(':id')
  @Admin()
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.workshopItemsService.removeWorkshopItem(id);
    return { success: true };
  }
}
