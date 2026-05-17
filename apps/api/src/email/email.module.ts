import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailAssetsController } from './email-assets.controller';
import { EmailController } from './email.controller';
import { emailProviderFactory } from './email.providers';
import { EmailService } from './email.service';
import { TicketPdfService } from './ticket-pdf.service';

@Module({
  imports: [ConfigModule],
  controllers: [EmailController, EmailAssetsController],
  providers: [EmailService, TicketPdfService, emailProviderFactory],
  exports: [EmailService, TicketPdfService],
})
export class EmailModule {}
