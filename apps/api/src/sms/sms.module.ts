import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SmsService } from './sms.service';
import { smsProviderFactory } from './sms.providers';

@Module({
  imports: [ConfigModule],
  providers: [SmsService, smsProviderFactory],
  exports: [SmsService],
})
export class SmsModule {}
