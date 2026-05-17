import { Injectable, Logger } from '@nestjs/common';
import { SmsProvider, SmsSendOptions } from './sms-provider.interface';

@Injectable()
export class SendPulseSmsProvider implements SmsProvider {
  private readonly logger = new Logger(SendPulseSmsProvider.name);
  private readonly apiUrl = 'https://api.sendpulse.com';
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly senderName?: string,
  ) {}

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    try {
      const response = await fetch(`${this.apiUrl}/oauth/access_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;

      if (!this.accessToken) {
        throw new Error('Access token not received from SendPulse');
      }

      return this.accessToken;
    } catch (error) {
      this.logger.error('Failed to get SendPulse access token', error);
      throw error;
    }
  }

  async send({ phoneNumber, message }: SmsSendOptions): Promise<void> {
    try {
      const token = await this.getAccessToken();

      const formattedPhone = phoneNumber.replace(/\D/g, '');

      const phone = formattedPhone.startsWith('0')
        ? `+380${formattedPhone.substring(1)}`
        : formattedPhone.startsWith('380')
          ? `+${formattedPhone}`
          : formattedPhone.startsWith('+')
            ? formattedPhone
            : `+${formattedPhone}`;

      const isUkrainianNumber = phone.startsWith('+380');

      const payload: {
        phones: string[];
        body: string;
        sender?: string;
        route?: { [key: string]: string };
      } = {
        phones: [phone],
        body: message,
        ...(this.senderName && { sender: this.senderName }),
        ...(isUkrainianNumber && { route: { UA: 'national' } }),
      };

      const response = await fetch(`${this.apiUrl}/sms/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        this.logger.error(
          `Failed to send SMS: ${response.statusText}`,
          errorData,
        );
        throw new Error(
          `SendPulse SMS API error: ${response.statusText} - ${JSON.stringify(errorData)}`,
        );
      }

      const result = await response.json();
      this.logger.log(`SMS sent successfully to ${phone}`);
      return;
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phoneNumber}`, error);
      throw error;
    }
  }
}
