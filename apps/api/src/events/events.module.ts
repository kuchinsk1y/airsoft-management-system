import { Module, forwardRef } from '@nestjs/common';
import { AclModule } from '../acl/acl.module';
import { ApplicationsModule } from '../applications/applications.module';
import { CitiesModule } from '../cities/cities.module';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrganizationModule } from '../organization/organization.module';
import { OrdersModule } from '../orders/orders.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SmsModule } from '../sms/sms.module';
import { StorageModule } from '../storage/storage.module';
import { TeamsModule } from '../teams/teams.module';
import { UsersModule } from '../users/users.module';
import { EventsDataService } from './events-data.service';
import { EventsGalleryDataService } from './events-gallery-data.service';
import { EventsGalleryService } from './events-gallery.service';
import { EventsNotificationService } from './events-notification.service';
import { EventsRegistrationDataService } from './events-registration-data.service';
import { EventsRegistrationService } from './events-registration.service';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [
    PrismaModule,
    CitiesModule,
    StorageModule,
    AclModule,
    ApplicationsModule,
    forwardRef(() => TeamsModule),
    forwardRef(() => OrdersModule),
    NotificationsModule,
    OrganizationModule,
    EmailModule,
    SmsModule,
    UsersModule,
  ],
  controllers: [EventsController],
  providers: [
    EventsService,
    EventsDataService,
    EventsRegistrationDataService,
    EventsRegistrationService,
    EventsNotificationService,
    EventsGalleryDataService,
    EventsGalleryService,
  ],
  exports: [
    EventsService,
    EventsRegistrationService,
    EventsDataService,
    EventsNotificationService,
  ],
})
export class EventsModule {}
