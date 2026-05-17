import { Module, forwardRef } from '@nestjs/common';
import { AclModule } from '../acl/acl.module';
import { EmailModule } from '../email/email.module';
import { EventsModule } from '../events/events.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { UsersModule } from '../users/users.module';
import { TeamsDataService } from './teams-data.service';
import { TeamsInvitationDataService } from './teams-invitation-data.service';
import { TeamsInvitationService } from './teams-invitation.service';
import { TeamsJoinRequestDataService } from './teams-join-request-data.service';
import { TeamsJoinRequestService } from './teams-join-request.service';
import { TeamsNotificationService } from './teams-notification.service';
import { TeamsPermissionsService } from './teams-permissions.service';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { TransferOwnershipsService } from './transfer-ownerships.service';
import { TransferOwnershipsDataService } from './transfer-ownerships-data.service';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    AclModule,
    NotificationsModule,
    EmailModule,
    UsersModule,
    forwardRef(() => EventsModule),
  ],
  controllers: [TeamsController],
  providers: [
    TeamsService,
    TeamsDataService,
    TeamsJoinRequestService,
    TeamsJoinRequestDataService,
    TeamsInvitationService,
    TeamsInvitationDataService,
    TeamsNotificationService,
    TeamsPermissionsService,
    TransferOwnershipsService,
    TransferOwnershipsDataService,
  ],
  exports: [TeamsService, TeamsDataService, TeamsInvitationDataService],
})
export class TeamsModule {}
