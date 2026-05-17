import { Module } from '@nestjs/common';
import { PaymentController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { LiqPayService } from './liqpay.service';
import { OrdersModule } from '../orders/orders.module';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [OrdersModule, SmsModule],
  controllers: [PaymentController],
  providers: [PaymentsService, LiqPayService],
  exports: [PaymentsService],
})
export class PaymentModule {}
