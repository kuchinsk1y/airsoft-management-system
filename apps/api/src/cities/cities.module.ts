import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CitiesDataService } from './cities-data.service';
import { CitiesController } from './cities.controller';
import { CitiesService } from './cities.service';

@Module({
  imports: [PrismaModule],
  controllers: [CitiesController],
  providers: [CitiesService, CitiesDataService],
  exports: [CitiesService],
})
export class CitiesModule {}
