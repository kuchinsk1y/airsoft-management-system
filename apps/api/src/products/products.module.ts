import { Module } from '@nestjs/common';
import { AclModule } from '../acl/acl.module';
import { CitiesModule } from '../cities/cities.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { ProductsDataService } from './products-data.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [PrismaModule, CitiesModule, StorageModule, AclModule],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsDataService],
  exports: [ProductsService, ProductsDataService],
})
export class ProductsModule {}
