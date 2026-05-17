import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type CompanyGalleryPhotoRow = {
  id: number;
  url: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class GalleryDataService {
  constructor(private readonly prisma: PrismaService) {}

  async getCompanyPhotos(): Promise<CompanyGalleryPhotoRow[]> {
    return this.prisma.$queryRaw<CompanyGalleryPhotoRow[]>`
      SELECT id, url, "createdAt", "updatedAt"
      FROM "GalleryPhoto"
      ORDER BY "createdAt" DESC
    `;
  }

  async createCompanyPhotos(urls: string[]): Promise<CompanyGalleryPhotoRow[]> {
    const rows = await Promise.all(
      urls.map(
        (url) =>
          this.prisma.$queryRaw<CompanyGalleryPhotoRow[]>`
          INSERT INTO "GalleryPhoto" (url, "createdAt", "updatedAt")
          VALUES (${url}, NOW(), NOW())
          RETURNING id, url, "createdAt", "updatedAt"
        `,
      ),
    );

    return rows.map((row) => row[0]).filter(Boolean);
  }

  async deleteCompanyPhoto(
    photoId: number,
  ): Promise<CompanyGalleryPhotoRow | null> {
    const rows = await this.prisma.$queryRaw<CompanyGalleryPhotoRow[]>`
      DELETE FROM "GalleryPhoto"
      WHERE id = ${photoId}
      RETURNING id, url, "createdAt", "updatedAt"
    `;

    return rows[0] ?? null;
  }

  async getEventPhotos(limit = 300) {
    return this.prisma.eventGallery.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            city: {
              select: {
                slug: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }
}