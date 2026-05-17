import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventGalleryItem } from './interfaces';

@Injectable()
export class EventsGalleryDataService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(eventId: number): Promise<EventGalleryItem[]> {
    return await this.prisma.eventGallery.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: number): Promise<EventGalleryItem | null> {
    return await this.prisma.eventGallery.findUnique({
      where: { id },
    });
  }

  async create(eventId: number, url: string): Promise<EventGalleryItem> {
    return await this.prisma.eventGallery.create({
      data: {
        eventId,
        url,
      },
    });
  }

  async createMany(
    eventId: number,
    urls: string[],
  ): Promise<EventGalleryItem[]> {
    const items = await Promise.all(
      urls.map((url) =>
        this.prisma.eventGallery.create({
          data: {
            eventId,
            url,
          },
        }),
      ),
    );
    return items;
  }

  async delete(id: number): Promise<void> {
    const exists = await this.prisma.eventGallery.findUnique({
      where: { id },
    });
    if (!exists) {
      throw new NotFoundException('GALLERY_ITEM_NOT_FOUND');
    }
    await this.prisma.eventGallery.delete({
      where: { id },
    });
  }

  async deleteByEventId(eventId: number): Promise<void> {
    await this.prisma.eventGallery.deleteMany({
      where: { eventId },
    });
  }
}
