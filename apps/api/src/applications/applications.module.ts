import { Module, forwardRef } from '@nestjs/common';
import { AclModule } from '../acl/acl.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ApplicationsDataService } from './applications-data.service';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

@Module({
  imports: [PrismaModule, forwardRef(() => AclModule)],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, ApplicationsDataService],
  exports: [ApplicationsService, ApplicationsDataService],
})
export class ApplicationsModule {}
