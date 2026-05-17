import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { OrderStatus } from '../generated/prisma-client';
import { OrdersService } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { LiqPayService } from './liqpay.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly liqpay: LiqPayService,
    private readonly prisma: PrismaService,
    private readonly smsService: SmsService,
    private readonly ordersService: OrdersService,
  ) {}

  createPayment(orderId: string, amount: number) {
    if (!orderId) {
      throw new BadRequestException('orderId is required');
    }

    if (!amount || amount <= 0) {
      throw new BadRequestException('amount must be greater than 0');
    }

    const payload = this.liqpay.createPaymentPayload(orderId, amount);

    const { data, signature } = this.liqpay.sign(payload);

    return { data, signature };
  }

  async handleCallback(data: string, signature: string) {
    if (!data || !signature) {
      throw new BadRequestException('Invalid callback payload');
    }

    const isValid = this.liqpay.verify(data, signature);
    if (!isValid) {
      this.logger.warn('Invalid LiqPay signature received');
      throw new BadRequestException('Invalid LiqPay signature');
    }

    const decoded = JSON.parse(Buffer.from(data, 'base64').toString());

    const { order_id, status, amount, currency, transaction_id, payment_id } =
      decoded;

    this.logger.log(
      `Payment callback received: order_id=${order_id}, status=${status}, amount=${amount}`,
    );

    try {
      const orderId = parseInt(order_id, 10);
      if (isNaN(orderId)) {
        this.logger.error(`Invalid order_id format: ${order_id}`);
        return;
      }

      let orderStatus: OrderStatus = OrderStatus.NEW;

      switch (status) {
        case 'success':
        case 'sandbox':
          orderStatus = OrderStatus.PAID;
          break;
        case 'failure':
        case 'error':
          orderStatus = OrderStatus.PAYMENT_FAILED;
          break;
        case 'wait_accept':
        case 'processing':
          orderStatus = OrderStatus.PENDING;
          break;
        default:
          this.logger.warn(`Unknown payment status: ${status}`);
          orderStatus = OrderStatus.PENDING;
      }

      const existing = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: {
          status: true,
          user: { select: { phoneNumber: true } },
        },
      });
      if (!existing) {
        this.logger.error(`Order ${orderId} not found`);
        return;
      }

      const previousStatus = existing.status;
      if (previousStatus === orderStatus) {
        return;
      }

      const order = await this.prisma.order.update({
        where: { id: orderId },
        data: { status: orderStatus },
        include: {
          user: {
            select: { phoneNumber: true },
          },
        },
      });

      this.logger.log(
        `Order ${orderId} status updated to ${orderStatus} (payment status: ${status})`,
      );

      if (order.user.phoneNumber) {
        try {
          await this.smsService.sendOrderStatusSms(
            order.user.phoneNumber,
            orderId,
            orderStatus,
          );
        } catch (error) {
          this.logger.warn(
            `Failed to send order status SMS for order ${orderId}`,
            error,
          );
        }
      }

      try {
        await this.ordersService.handleOrderStatusTransitionEffects(
          orderId,
          previousStatus,
          orderStatus,
        );
      } catch (err) {
        this.logger.warn(
          `Failed to apply post-status effects for order ${orderId}`,
          err,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error updating order status: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    return 'OK';
  }
}
