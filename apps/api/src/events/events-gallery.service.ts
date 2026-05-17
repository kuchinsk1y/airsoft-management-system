import { BadRequestException, Injectable } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { EventsGalleryDataService } from './events-gallery-data.service';

@Injectable()
export class EventsGalleryService {
  constructor(
    private readonly galleryDataService: EventsGalleryDataService,
    private readonly storageService: StorageService,
  ) {}

  async getGallery(eventId: number): Promise<
    Array<{
      id: number;
      url: string;
      createdAt: Date;
    }>
  > {
    const gallery = await this.galleryDataService.findMany(eventId);
    return gallery.map((item) => ({
      id: item.id,
      url: item.url,
      createdAt: item.createdAt,
    }));
  }

  async uploadPhotos(
    eventId: number,
    files: Express.Multer.File[],
  ): Promise<Array<{ id: number; url: string }>> {
    if (!files || files.length === 0) {
      throw new BadRequestException('NO_FILES_PROVIDED');
    }

    const savedFiles = await Promise.all(
      files.map((file) =>
        this.storageService.save(file.buffer, file.originalname, file.mimetype),
      ),
    );

    const urls = savedFiles.map((saved) => saved.url);
    const galleryItems = await this.galleryDataService.createMany(
      eventId,
      urls,
    );

    return galleryItems.map((item) => ({
      id: item.id,
      url: item.url,
    }));
  }

  async deletePhoto(eventId: number, photoId: number): Promise<void> {
    const photo = await this.galleryDataService.findOne(photoId);
    if (!photo || photo.eventId !== eventId) {
      throw new BadRequestException('PHOTO_NOT_FOUND');
    }

    const key = this.storageService.extractKeyFromUrl(photo.url);
    await Promise.all([
      this.galleryDataService.delete(photoId),
      this.storageService.remove(key),
    ]);
  }
}
