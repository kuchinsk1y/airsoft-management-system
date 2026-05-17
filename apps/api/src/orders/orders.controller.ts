import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { User } from '../common/decorators/user.decorator';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { AuthenticatedUser } from '../common/types/request.types';
import { EventsRegistrationService } from '../events/events-registration.service';
import { OrderStatus } from '../generated/prisma-client';
import { OrderRequestDto } from './dto/order-request.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly eventsRegistrationService: EventsRegistrationService,
  ) {}

  private toPlainOrder(order: OrderResponseDto): OrderResponseDto {
    return JSON.parse(JSON.stringify(order)) as OrderResponseDto;
  }

  @Post()
  @UseGuards(ApiKeyGuard)
  async create(
    @User('userId') userId: number,
    @Body() dto: OrderRequestDto,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.createOrder(userId, dto);
    return this.toPlainOrder(order);
  }

  @Get()
  @UseGuards(ApiKeyGuard)
  async findAll(
    @User() user: AuthenticatedUser,
    @Query('userId', new ParseIntPipe({ optional: true })) userIdParam?: number,
    @Query('applicationId', new ParseIntPipe({ optional: true }))
    applicationId?: number,
    @Query('eventId', new ParseIntPipe({ optional: true })) eventId?: number,
    @Query('status', new ParseEnumPipe(OrderStatus, { optional: true }))
    status?: OrderStatus,
    @Query('searchQuery') searchQuery?: string,
    @Query(
      'orderType',
      new ParseEnumPipe(['products', 'events', 'all'], {
        optional: true,
      }),
    )
    orderType?: 'products' | 'events' | 'all',
  ): Promise<OrderResponseDto[]> {
    const orders = await this.ordersService.getOrders(
      user,
      userIdParam,
      applicationId,
      eventId,
      status,
      searchQuery,
      orderType,
    );
    return orders.map((order) => this.toPlainOrder(order));
  }

  @Get('count')
  @UseGuards(ApiKeyGuard)
  async count(
    @User() user: AuthenticatedUser,
    @Query('userId', new ParseIntPipe({ optional: true })) userIdParam?: number,
    @Query('applicationId', new ParseIntPipe({ optional: true }))
    applicationId?: number,
    @Query('eventId', new ParseIntPipe({ optional: true })) eventId?: number,
    @Query('status', new ParseEnumPipe(OrderStatus, { optional: true }))
    status?: OrderStatus,
    @Query('searchQuery') searchQuery?: string,
    @Query(
      'orderType',
      new ParseEnumPipe(['products', 'events', 'all'], {
        optional: true,
      }),
    )
    orderType?: 'products' | 'events' | 'all',
  ): Promise<{ count: number }> {
    const count = await this.ordersService.getOrdersCount(
      user,
      userIdParam,
      applicationId,
      eventId,
      status,
      searchQuery,
      orderType,
    );

    return { count };
  }

  @Get(':id')
  @UseGuards(ApiKeyGuard)
  async findOne(
    @User() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.getOrder(user, id);
    return this.toPlainOrder(order);
  }

  @Get(':id/ticket/:eventId')
  @UseGuards(ApiKeyGuard)
  async getTicket(
    @User() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) orderId: number,
    @Param('eventId', ParseIntPipe) eventId: number,
  ) {
    return this.eventsRegistrationService.getTicket(user, orderId, eventId);
  }

  @Patch(':id')
  @UseGuards(ApiKeyGuard)
  async update(
    @User() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body('status', new ParseEnumPipe(OrderStatus, { optional: true }))
    status?: OrderStatus,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.updateOrder(user, id, { status });
    return this.toPlainOrder(order);
  }

  @Delete(':id')
  @UseGuards(ApiKeyGuard)
  async remove(
    @User() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.ordersService.removeOrder(user, id);
    return { success: true };
  }
}
