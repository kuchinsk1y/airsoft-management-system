import { ConfigService } from '@nestjs/config';
import { SendPulseSmsProvider } from './providers/sendpulse-sms.provider';
import { SmsProvider } from './providers/sms-provider.interface';
import { TurboSmsProvider } from './providers/turbosms.provider';

export const SMS_PROVIDER = 'SMS_PROVIDER';

export const smsProviderFactory = {
  provide: SMS_PROVIDER,
  inject: [ConfigService],
  useFactory: (config: ConfigService): SmsProvider => {
    const turboToken = config.get<string>('TURBOSMS_API_TOKEN');
    const turboLogin = config.get<string>('TURBOSMS_LOGIN');
    const turboPassword = config.get<string>('TURBOSMS_PASSWORD');
    const turboSender = config.get<string>('TURBOSMS_SENDER_NAME');

    if ((turboToken || (turboLogin && turboPassword)) && turboSender) {
      return new TurboSmsProvider(
        turboSender,
        turboToken,
        turboLogin,
        turboPassword,
      );
    }

    let clientId = config.get('SENDPULSE_SMS_CLIENT_ID');
    let clientSecret = config.get('SENDPULSE_SMS_CLIENT_SECRET');
    const senderName = config.get('SENDPULSE_SMS_SENDER_NAME');

    if (!clientId || !clientSecret) {
      clientId = config.get('SENDPULSE_API_KEY');
      clientSecret = config.get('SENDPULSE_SECRET');
    }

    if (!clientId || !clientSecret) {
      throw new Error(
        'SMS provider credentials are required. Configure TurboSMS (TURBOSMS_API_TOKEN + TURBOSMS_SENDER_NAME or TURBOSMS_LOGIN + TURBOSMS_PASSWORD + TURBOSMS_SENDER_NAME) or SendPulse SMS credentials.',
      );
    }

    return new SendPulseSmsProvider(clientId, clientSecret, senderName);
  },
};
