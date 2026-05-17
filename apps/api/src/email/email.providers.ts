import { ConfigService } from '@nestjs/config';
import { SendGridProvider } from './providers/sendgrid.provider';
import { SendPulseProvider } from './providers/sendpulse.provider';
import { NodemailerProvider } from './providers/nodemailer.provider';
import { EmailProvider } from './providers/email-provider.interface';

export const EMAIL_PROVIDER = 'EMAIL_PROVIDER';

export const emailProviderFactory = {
  provide: EMAIL_PROVIDER,
  inject: [ConfigService],
  useFactory: (config: ConfigService): EmailProvider => {
    const sendgridKey = config.get('SENDGRID_API_KEY');
    const sendgridFrom = config.get('SENDGRID_FROM_EMAIL');

    if (sendgridKey && sendgridFrom) {
      return new SendGridProvider(sendgridKey, sendgridFrom);
    }

    const smtpHost = config.get('SMTP_HOST');
    const smtpFrom = config.get('SMTP_FROM');
    if (smtpHost && smtpFrom) {
      return new NodemailerProvider();
    }

    const pulseKey = config.get('SENDPULSE_API_KEY');
    const pulseSecret = config.get('SENDPULSE_SECRET');
    const pulseFrom = config.get('SENDPULSE_FROM_EMAIL');

    if (pulseKey && pulseSecret && pulseFrom) {
      return new SendPulseProvider(pulseKey, pulseSecret, pulseFrom);
    }

    throw new Error(
      'No email provider is configured. Set SendGrid, SMTP, or SendPulse credentials.',
    );
  },
};
