import {
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { MultipleImageFilesInterceptor } from '../common/config/file-upload.config';
import { Admin } from '../common/decorators/admin.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { GalleryService } from './gallery.service';

const GALLERY_CACHE_CONTROL = 'no-store, no-cache, must-revalidate';

@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get('company')
  @Public()
  @UseGuards(ApiKeyGuard)
  @Header('Cache-Control', GALLERY_CACHE_CONTROL)
  async getCompanyPhotos() {
    return this.galleryService.getCompanyPhotos();
  }

  @Post('company')
  @Admin()
  @UseInterceptors(MultipleImageFilesInterceptor)
  async uploadCompanyPhotos(@UploadedFiles() files: Express.Multer.File[]) {
    return this.galleryService.uploadCompanyPhotos(files);
  }

  @Delete('company/:photoId')
  @Admin()
  async deleteCompanyPhoto(@Param('photoId', ParseIntPipe) photoId: number) {
    return this.galleryService.deleteCompanyPhoto(photoId);
  }

  @Get('events')
  @Public()
  @UseGuards(ApiKeyGuard)
  @Header('Cache-Control', GALLERY_CACHE_CONTROL)
  async getEventPhotos(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.galleryService.getEventPhotos(limit);
  }
}
