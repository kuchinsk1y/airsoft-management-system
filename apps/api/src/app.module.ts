import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AclModule } from './acl/acl.module';
import { AppController } from './app.controller';
import { ApplicationsModule } from './applications/applications.module';
import { AuthModule } from './auth/auth.module';
import { CitiesModule } from './cities/cities.module';
import { CommentsModule } from './comments/comments.module';
import { EmailModule } from './email/email.module';
import { EquipmentModule } from './equipment/equipment.module';
import { EventsModule } from './events/events.module';
import { GalleryModule } from './gallery/gallery.module';
import { HealthModule } from './health/health.module';
import { NewsModule } from './news/news.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OrganizationModule } from './organization/organization.module';
import { PaymentModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { RatingsModule } from './ratings/ratings.module';
import { RegionsModule } from './regions/regions.module';
import { SmsModule } from './sms/sms.module';
import { StorageModule } from './storage/storage.module';
import { TeamsModule } from './teams/teams.module';
import { TemplateModule } from './template/template.module';
import { UsersModule } from './users/users.module';
import { MONGODB_URI } from './utils/config';
import { ServiceModule } from './service/service.module';
import { WorkshopItemsModule } from './workshop-items/workshop-items.module';

@Module({
  controllers: [AppController],
  imports: [
    PrismaModule,
    UsersModule,
    EquipmentModule,
    AuthModule,
    AclModule,
    ApplicationsModule,
    StorageModule,
    ProductsModule,
    EventsModule,
    GalleryModule,
    CitiesModule,
    RegionsModule,
    CommentsModule,
    MongooseModule.forRoot(MONGODB_URI),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    EmailModule,
    SmsModule,
    TemplateModule,
    TeamsModule,
    HealthModule,
    PaymentModule,
    NotificationsModule,
    RatingsModule,
    NewsModule,
    WorkshopItemsModule,
    OrganizationModule,
    ServiceModule,
  ],
})
export class AppModule {}
