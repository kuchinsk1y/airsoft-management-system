import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { GalleryDataService } from './gallery-data.service';

@Injectable()
export class GalleryService {
  constructor(
    private readonly galleryDataService: GalleryDataService,
    private readonly storageService: StorageService,
  ) {}

  async getCompanyPhotos() {
    const photos = await this.galleryDataService.getCompanyPhotos();
    return photos.map((item) => ({
      id: item.id,
      url: item.url,
      createdAt: item.createdAt,
      source: 'COMPANY' as const,
    }));
  }

  async uploadCompanyPhotos(files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('NO_FILES_PROVIDED');
    }

    const savedFiles = await Promise.all(
      files.map((file) =>
        this.storageService.save(file.buffer, file.originalname, file.mimetype),
      ),
    );

    const created = await this.galleryDataService.createCompanyPhotos(
      savedFiles.map((item) => item.url),
    );

    return created.map((item) => ({
      id: item.id,
      url: item.url,
      createdAt: item.createdAt,
      source: 'COMPANY' as const,
    }));
  }

  async deleteCompanyPhoto(photoId: number) {
    const photo = await this.galleryDataService.deleteCompanyPhoto(photoId);
    if (!photo) {
      throw new NotFoundException('PHOTO_NOT_FOUND');
    }

    const key = this.storageService.extractKeyFromUrl(photo.url);
    await this.storageService.remove(key);

    return { success: true };
  }

  async getEventPhotos(limit?: number) {
    const eventPhotos = await this.galleryDataService.getEventPhotos(limit);

    return eventPhotos.map((item) => ({
      id: item.id,
      url: item.url,
      createdAt: item.createdAt,
      source: 'EVENT' as const,
      event: {
        id: item.event.id,
        name: item.event.name,
        citySlug: item.event.city.slug,
        cityName: item.event.city.name,
      },
    }));
  }
}
