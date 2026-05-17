import { Injectable, Logger } from '@nestjs/common';
import { SmsProvider, SmsSendOptions } from './sms-provider.interface';

@Injectable()
export class TurboSmsProvider implements SmsProvider {
  private readonly logger = new Logger(TurboSmsProvider.name);
  private readonly apiUrl = 'https://api.turbosms.ua';

  constructor(
    private readonly senderName: string,
    private readonly token?: string,
    private readonly login?: string,
    private readonly password?: string,
  ) {}

  private getAuthHeader(): string {
    if (this.token) {
      return `Bearer ${this.token}`;
    }

    if (this.login && this.password) {
      const credentials = Buffer.from(`${this.login}:${this.password}`).toString(
        'base64',
      );
      return `Basic ${credentials}`;
    }

    throw new Error('TurboSMS credentials are not configured');
  }

  private normalizePhone(phoneNumber: string): string {
    const digitsOnly = phoneNumber.replace(/\D/g, '');

    if (digitsOnly.startsWith('0')) {
      return `380${digitsOnly.substring(1)}`;
    }
    if (digitsOnly.startsWith('380')) {
      return digitsOnly;
    }
    return digitsOnly;
  }

  async send({ phoneNumber, message }: SmsSendOptions): Promise<void> {
    const recipient = this.normalizePhone(phoneNumber);

    const response = await fetch(`${this.apiUrl}/message/send.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.getAuthHeader(),
      },
      body: JSON.stringify({
        recipients: [recipient],
        sms: {
          sender: this.senderName,
          text: message,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      this.logger.error(
        `TurboSMS API error: ${response.status} ${response.statusText}`,
        errorBody,
      );
      throw new Error(`TurboSMS API error: ${response.statusText}`);
    }

    this.logger.log(`SMS sent successfully via TurboSMS to ${recipient}`);
  }
}
