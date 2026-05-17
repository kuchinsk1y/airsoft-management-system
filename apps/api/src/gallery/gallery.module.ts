import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { GalleryController } from './gallery.controller';
import { GalleryDataService } from './gallery-data.service';
import { GalleryService } from './gallery.service';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [GalleryController],
  providers: [GalleryDataService, GalleryService],
  exports: [GalleryService],
})
export class GalleryModule {}
