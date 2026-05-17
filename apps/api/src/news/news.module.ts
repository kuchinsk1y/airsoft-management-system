import { Module } from '@nestjs/common';
import { AclModule } from '../acl/acl.module';
import { PrismaModule } from '../prisma/prisma.module';
import { NewsController } from './news.controller';
import { NewsDataService } from './news-data.service';
import { NewsService } from './news.service';

@Module({
  imports: [PrismaModule, AclModule],
  controllers: [NewsController],
  providers: [NewsService, NewsDataService],
  exports: [NewsService],
})
export class NewsModule {}
