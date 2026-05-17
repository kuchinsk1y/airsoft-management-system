import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  LIQPAY_CALLBACK_URL,
  LIQPAY_PRIVATE_KEY,
  LIQPAY_PUBLIC_KEY,
  LIQPAY_RESULT_URL,
  PAYMENTS_MODE,
} from '../utils/config';

@Injectable()
export class LiqPayService {
  private getPrivateKey(): string {
    if (!LIQPAY_PRIVATE_KEY) {
      throw new Error('LIQPAY_PRIVATE_KEY is not defined');
    }
    return LIQPAY_PRIVATE_KEY;
  }

  createPaymentPayload(orderId: string, amount: number) {
    return {
      public_key: LIQPAY_PUBLIC_KEY,
      version: 3,
      action: 'pay',
      amount,
      currency: 'UAH',
      description: `Order ${orderId}`,
      order_id: orderId,
      callback_url: LIQPAY_CALLBACK_URL,
      result_url: LIQPAY_RESULT_URL,
    };
  }

  sign(payload: object) {
    const privateKey = this.getPrivateKey();
    const data = Buffer.from(JSON.stringify(payload)).toString('base64');

    const signature = crypto
      .createHash('sha1')
      .update(privateKey + data + privateKey)
      .digest('base64');

    return { data, signature };
  }

  verify(data: string, signature: string) {
    if (PAYMENTS_MODE === 'mock') return true;

    const privateKey = this.getPrivateKey();

    const expected = crypto
      .createHash('sha1')
      .update(privateKey + data + privateKey)
      .digest('base64');

    return expected === signature;
  }
}
