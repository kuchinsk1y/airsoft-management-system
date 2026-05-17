import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { SmsRequest, SmsResponse } from './interfaces';
import { SMS_PROVIDER } from './sms.providers';
import { SmsProvider } from './providers/sms-provider.interface';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    @Inject(SMS_PROVIDER)
    private readonly provider: SmsProvider,
  ) {}

  async send(data: SmsRequest): Promise<SmsResponse> {
    const { phoneNumber, message } = data;

    if (!phoneNumber) {
      throw new BadRequestException('PHONE_NUMBER_REQUIRED');
    }

    if (!message || message.trim().length === 0) {
      throw new BadRequestException('MESSAGE_REQUIRED');
    }

    try {
      await this.provider.send({
        phoneNumber,
        message: message.trim(),
      });

      this.logger.log(`SMS sent successfully to ${phoneNumber}`);

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phoneNumber}`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
      };
    }
  }

  async sendRegistrationSms(
    phoneNumber: string,
    userName?: string,
  ): Promise<SmsResponse> {
    const message = userName
      ? `Вітаємо, ${userName}! Ви успішно зареєстровані на StrikeShop. Дякуємо за реєстрацію!`
      : 'Вітаємо! Ви успішно зареєстровані на StrikeShop. Дякуємо за реєстрацію!';

    return this.send({
      phoneNumber,
      message,
      metadata: {
        type: 'registration',
      },
    });
  }

  async sendOrderCreatedSms(
    phoneNumber: string,
    orderId: number,
    total: number,
  ): Promise<SmsResponse> {
    const message = `Ваше замовлення #${orderId} створено на суму ${total} грн. Дякуємо за покупку!`;

    return this.send({
      phoneNumber,
      message,
      metadata: {
        type: 'order_created',
        orderId,
        total,
      },
    });
  }

  async sendOrderStatusSms(
    phoneNumber: string,
    orderId: number,
    status: string,
  ): Promise<SmsResponse> {
    const statusMessages: Record<string, string> = {
      PAID: `Ваше замовлення #${orderId} оплачено. Дякуємо!`,
      PENDING: `Ваше замовлення #${orderId} в обробці.`,
      CANCELLED: `Ваше замовлення #${orderId} скасовано.`,
      PAYMENT_FAILED: `Помилка оплати замовлення #${orderId}. Спробуйте ще раз.`,
    };

    const message =
      statusMessages[status] ||
      `Статус вашого замовлення #${orderId} змінено на ${status}.`;

    return this.send({
      phoneNumber,
      message,
      metadata: {
        type: 'order_status',
        orderId,
        status,
      },
    });
  }
}
