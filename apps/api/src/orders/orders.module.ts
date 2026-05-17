import { Module, forwardRef } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { EventsModule } from '../events/events.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProductsModule } from '../products/products.module';
import { SmsModule } from '../sms/sms.module';
import { UsersModule } from '../users/users.module';
import { OrdersDataService } from './orders-data.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    SmsModule,
    EmailModule,
    NotificationsModule,
    ProductsModule,
    UsersModule,
    forwardRef(() => EventsModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersDataService],
  exports: [OrdersService, OrdersDataService],
})
export class OrdersModule {}
