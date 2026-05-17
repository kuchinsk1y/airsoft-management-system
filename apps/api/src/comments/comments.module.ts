import { Module } from '@nestjs/common';
import { AclModule } from '../acl/acl.module';
import { ApplicationsModule } from '../applications/applications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { CommentsDataService } from './comments-data.service';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';

@Module({
  imports: [PrismaModule, EventsModule, AclModule, ApplicationsModule],
  controllers: [CommentsController],
  providers: [CommentsService, CommentsDataService],
  exports: [CommentsService],
})
export class CommentsModule {}
