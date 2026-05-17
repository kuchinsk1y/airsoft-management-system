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
import { NewsCategory } from '../generated/prisma-client';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsService } from './news.service';

const NEWS_CACHE_CONTROL = 'no-store, no-cache, must-revalidate';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  @Admin()
  async create(@User('userId') userId: number, @Body() dto: CreateNewsDto) {
    return this.newsService.createNews(userId, dto);
  }

  @Public()
  @UseGuards(ApiKeyGuard)
  @Get()
  @Header('Cache-Control', NEWS_CACHE_CONTROL)
  async findAll(
    @User('userId') userId: number | null,
    @Query('published', new ParseBoolPipe({ optional: true }))
    published?: boolean,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
    @Query('searchQuery') searchQuery?: string,
    @Query('category', new ParseEnumPipe(NewsCategory, { optional: true }))
    category?: NewsCategory,
  ) {
    return this.newsService.getNewsList(userId ?? undefined, {
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
    return this.newsService.getNewsById(id);
  }

  @Public()
  @UseGuards(ApiKeyGuard)
  @Get(':slug/adjacent')
  @Header('Cache-Control', NEWS_CACHE_CONTROL)
  async findAdjacent(
    @Param('slug') slug: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.newsService.getAdjacentNewsBySlug(slug, limit ?? 2);
  }

  @Public()
  @UseGuards(ApiKeyGuard)
  @Get(':slug')
  @Header('Cache-Control', NEWS_CACHE_CONTROL)
  async findOneBySlug(
    @User('userId') userId: number | null,
    @Param('slug') slug: string,
  ) {
    return this.newsService.getNewsBySlug(userId ?? undefined, slug);
  }

  @Patch(':id')
  @Admin()
  async update(
    @User('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNewsDto,
  ) {
    return this.newsService.updateNews(userId, id, dto);
  }

  @Delete(':id')
  @Admin()
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.newsService.removeNews(id);
    return { success: true };
  }
}
