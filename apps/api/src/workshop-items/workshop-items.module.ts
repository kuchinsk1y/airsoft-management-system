import { Module } from '@nestjs/common';
import { AclModule } from '../acl/acl.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkshopItemsController } from './workshop-items.controller';
import { WorkshopItemsDataService } from './workshop-items-data.service';
import { WorkshopItemsService } from './workshop-items.service';

@Module({
  imports: [PrismaModule, AclModule],
  controllers: [WorkshopItemsController],
  providers: [WorkshopItemsService, WorkshopItemsDataService],
  exports: [WorkshopItemsService],
})
export class WorkshopItemsModule {}
