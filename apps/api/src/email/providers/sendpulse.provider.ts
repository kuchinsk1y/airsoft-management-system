import { Logger } from '@nestjs/common';
import { EmailProvider, EmailSendOptions } from './email-provider.interface';

export class SendPulseProvider implements EmailProvider {
  private readonly logger = new Logger(SendPulseProvider.name);
  private readonly eventsApiUrl = 'https://events.sendpulse.com';
  private readonly eventName = 'reestracia_na_ivent';
  private readonly apiUrl = 'https://api.sendpulse.com';
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly from: string,
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
        const errorText = await response.text();
        this.logger.error(
          `Failed to get SendPulse access token: ${response.statusText} - ${errorText}`,
        );
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

  async send({ to, subject, html, metadata }: EmailSendOptions): Promise<void> {
    try {
      const token = await this.getAccessToken();

      const phone = metadata?.phone || '';
      const eventDate =
        metadata?.event_date || new Date().toISOString().split('T')[0];

      const payload = {
        email: to,
        phone: phone,
        event_date: eventDate,
      };

      const url = `${this.eventsApiUrl}/events/name/${this.eventName}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        let errorData: unknown = null;
        if (errorText) {
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = null;
          }
        }

        const errorPayload = errorData ? JSON.stringify(errorData) : '';
        this.logger.error(
          `Failed to send event to SendPulse: ${response.status} ${response.statusText} | ${errorPayload || errorText}`,
        );
        throw new Error(
          `SendPulse Events API error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`,
        );
      }

      const result = await response.json();

      if (result.result !== true) {
        this.logger.warn(
          `SendPulse Events API returned unexpected result: ${JSON.stringify(result)}`,
        );
      }

      this.logger.log(
        `Event sent successfully to SendPulse for email ${to}`,
        result,
      );
      return;
    } catch (error) {
      this.logger.error(`Failed to send event for email ${to}`, error);
      throw error;
    }
  }
}
