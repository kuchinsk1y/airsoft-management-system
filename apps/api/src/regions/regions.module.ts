import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RegionsController } from './regions.controller';
import { RegionsDataService } from './regions-data.service';
import { RegionsService } from './regions.service';

@Module({
  imports: [PrismaModule],
  controllers: [RegionsController],
  providers: [RegionsService, RegionsDataService],
  exports: [RegionsService],
})
export class RegionsModule {}
