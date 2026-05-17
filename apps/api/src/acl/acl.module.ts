import { Module, forwardRef } from '@nestjs/common';
import { ApplicationsModule } from '../applications/applications.module';
import { AclGuard } from '../common/guards/acl.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { AclDataService } from './acl-data.service';
import { AclService } from './acl.service';

@Module({
  imports: [PrismaModule, forwardRef(() => ApplicationsModule)],
  providers: [AclDataService, AclService, AclGuard],
  exports: [AclService, AclGuard],
})
export class AclModule {}
