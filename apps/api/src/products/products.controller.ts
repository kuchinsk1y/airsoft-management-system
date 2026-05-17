import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ImageFileInterceptor } from '../common/config/file-upload.config';
import { Admin } from '../common/decorators/admin.decorator';
import { Public } from '../common/decorators/public.decorator';
import { User } from '../common/decorators/user.decorator';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { DealType } from '../generated/prisma-client';
import { ProductsRequestDto } from './dto/products-request.dto';
import { ProductsService } from './products.service';

const PRODUCTS_CACHE_CONTROL = 'no-store, no-cache, must-revalidate';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Admin()
  create(@User('userId') userId: number, @Body() dto: ProductsRequestDto) {
    return this.productsService.createProduct(userId, dto);
  }

  @Public()
  @UseGuards(ApiKeyGuard)
  @Get()
  @Header('Cache-Control', PRODUCTS_CACHE_CONTROL)
  findAll(
    @Query('cityId', new ParseIntPipe({ optional: true })) cityId?: number,
    @Query('citySlug') citySlug?: string,
    @Query('city') city?: string,
    @Query('regionSlug') regionSlug?: string,
    @Query('dealType') dealType?: DealType,
    @Query('searchQuery') searchQuery?: string,
    @Query('minPrice', new ParseIntPipe({ optional: true })) minPrice?: number,
    @Query('maxPrice', new ParseIntPipe({ optional: true })) maxPrice?: number,
    @Query('sortBy')
    sortBy?: 'price-low' | 'price-high' | 'name' | 'recommended',
    @Query('isActive', new ParseBoolPipe({ optional: true }))
    isActive?: boolean,
  ) {
    return this.productsService.getProducts({
      cityId,
      citySlug,
      city,
      regionSlug,
      dealType,
      searchQuery,
      minPrice,
      maxPrice,
      sortBy,
      isActive,
    });
  }

  @Public()
  @UseGuards(ApiKeyGuard)
  @Get(':idOrSlug')
  @Header('Cache-Control', PRODUCTS_CACHE_CONTROL)
  async findOne(@Param('idOrSlug') idOrSlug: string) {
    const isNumericId = /^\d+$/.test(idOrSlug);
    const slugIdMatch = idOrSlug.match(/-(\d+)$/);

    if (isNumericId) {
      return this.productsService.getProduct(Number(idOrSlug));
    }

    if (slugIdMatch) {
      return this.productsService.getProduct(Number(slugIdMatch[1]));
    }

    return this.productsService.getProductBySlug(idOrSlug);
  }

  @Patch(':id')
  @Admin()
  update(
    @User('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<ProductsRequestDto>,
  ) {
    return this.productsService.updateProduct(userId, id, dto);
  }

  @Delete(':id')
  @Admin()
  remove(
    @User('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.productsService.removeProduct(userId, id);
  }

  @Post(':id/upload-image')
  @Admin()
  @UseInterceptors(ImageFileInterceptor)
  async uploadImage(
    @User('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.productsService.uploadProductImage(userId, id, file);
  }
}
