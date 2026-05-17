import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Request as ExpressRequest, Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { User } from '../common/decorators/user.decorator';
import { OrderRequestDto } from '../orders/dto/order-request.dto';
import { OrdersService } from '../orders/orders.service';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly ordersService: OrdersService,
  ) {}

  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  async checkout(@User('userId') userId: number, @Body() dto: OrderRequestDto) {
    const order = await this.ordersService.createOrder(userId, dto);

    if (dto.paymentMethod === 'CASH') {
      return {
        orderId: order.id,
        paymentMethod: 'CASH',
      };
    }

    const paymentData = this.paymentsService.createPayment(
      order.id.toString(),
      Number(order.total),
    );

    return {
      orderId: order.id,
      paymentMethod: 'BANK',
      ...paymentData,
    };
  }

  @Post('create')
  @HttpCode(HttpStatus.OK)
  createPayment(@Body() body: { orderId: string; amount: number }) {
    const { orderId, amount } = body;
    return this.paymentsService.createPayment(orderId, amount);
  }

  @Post('callback')
  @Public()
  @HttpCode(HttpStatus.OK)
  async handleCallback(@Req() req: ExpressRequest, @Res() res: Response) {
    const data = req.body?.data;
    const signature = req.body?.signature;

    if (!data || !signature) {
      return res.status(400).send('Invalid callback payload');
    }

    try {
      await this.paymentsService.handleCallback(data, signature);
      return res.status(200).send('OK');
    } catch (error) {
      console.error('LiqPay callback error:', error);
      return res.status(200).send('OK');
    }
  }
}
