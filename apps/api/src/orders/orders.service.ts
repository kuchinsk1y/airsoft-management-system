import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { AuthenticatedUser } from '../common/types/request.types';
import { EmailService } from '../email/email.service';
import { EventsDataService } from '../events/events-data.service';
import { EventsNotificationService } from '../events/events-notification.service';
import { EventsRegistrationService } from '../events/events-registration.service';
import { NotificationType, OrderStatus } from '../generated/prisma-client';
import { NotificationsService } from '../notifications/notifications.service';
import { ProductsDataService } from '../products/products-data.service';
import { SmsService } from '../sms/sms.service';
import { UsersService } from '../users/users.service';
import { FRONTEND_BASE_URL } from '../utils/config';
import {
  OrderRequest,
  OrderResponse,
  OrdersFilters,
  OrderType,
} from './interfaces';
import { OrdersDataService } from './orders-data.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
    private readonly ordersDataService: OrdersDataService,
    private readonly productsDataService: ProductsDataService,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => EventsRegistrationService))
    private readonly eventsRegistrationService: EventsRegistrationService,
    @Inject(forwardRef(() => EventsNotificationService))
    private readonly eventsNotificationService: EventsNotificationService,
    private readonly eventsDataService: EventsDataService,
  ) {}

  async createOrder(
    userId: number,
    data: OrderRequest,
  ): Promise<OrderResponse> {
    const hasItems = data.products && data.products.length > 0;
    const hasEvents = data.events && data.events.length > 0;

    if (!hasItems && !hasEvents) {
      throw new BadRequestException(
        'ORDER_MUST_CONTAIN_AT_LEAST_ONE_ITEM_OR_EVENT',
      );
    }

    let total = 0;

    if (hasItems) {
      const productIds = data.products!.map((item) => item.productId);
      const products = await this.productsDataService.findMany({
        ids: productIds,
        isActive: true,
        inStock: true,
      });

      if (products.length !== productIds.length) {
        throw new BadRequestException('Some products are not available');
      }

      total += data.products!.reduce((sum, item) => {
        return sum + item.price * item.quantity;
      }, 0);
    }

    if (hasEvents) {
      const eventIds = data.events!.map((event) => event.eventId);
      const events = await Promise.allSettled(
        eventIds.map((id) => this.eventsDataService.findById(id)),
      );

      for (let i = 0; i < events.length; i++) {
        const result = events[i];
        if (result.status === 'rejected') {
          throw new BadRequestException(
            `Event ${eventIds[i]} not found or unavailable`,
          );
        }
        const event = result.value;
        if (!event.isActive) {
          throw new BadRequestException(`Event ${event.id} is not active`);
        }
        if (event.startDate <= new Date()) {
          throw new BadRequestException(
            `Event ${event.id} has already started`,
          );
        }
      }

      total += data.events!.reduce((sum, event) => {
        return sum + event.price;
      }, 0);
    }

    const order = await this.ordersDataService.create({
      userId,
      total,
      status: 'NEW',
      paymentMethod: data.paymentMethod,
      products: hasItems
        ? data.products!.map((item) => ({
            productId: item.productId,
            qty: item.quantity,
            price: item.price,
          }))
        : undefined,
    });

    if (hasEvents) {
      let registrationError: Error | null = null;
      for (const eventData of data.events!) {
        try {
          await this.eventsRegistrationService.register(
            eventData.eventId,
            userId,
            order.id,
            {
              eventSideId: eventData.eventSideId,
              teamId: eventData.teamId,
              selectedMemberIds: eventData.selectedMemberIds,
            },
          );

          this.logger.log(
            `Event registration created for event ${eventData.eventId} in order ${order.id}`,
          );
        } catch (error) {
          registrationError =
            error instanceof Error ? error : new Error(String(error));
          this.logger.error(
            `Failed to create event registration for event ${eventData.eventId}: ${registrationError.message}`,
          );
          break;
        }
      }

      if (registrationError) {
        await this.ordersDataService.delete(order.id);
        throw new BadRequestException(
          registrationError.message === 'ALREADY_REGISTERED'
            ? 'ALREADY_REGISTERED'
            : `Не вдалося зареєструвати на подію: ${registrationError.message}`,
        );
      }
    }

    this.logger.log(`Order ${order.id} created for user ${userId}`);

    try {
      const user = await this.usersService.getUser({ id: userId });

      if (user?.phoneNumber) {
        await this.smsService.sendOrderCreatedSms(
          user.phoneNumber,
          order.id,
          Number(order.total),
        );
      }

      const notificationsLink = `${FRONTEND_BASE_URL}/profile`;

      if (hasItems) {
        await this.notificationsService.createNotification({
          userId,
          type: NotificationType.SYSTEM,
          title: 'Замовлення створено',
          message: `Ваше замовлення #${order.id} на суму ${Number(order.total).toFixed(2)} грн створено.`,
          link: notificationsLink,
        });
      }

      if (hasItems && user?.email) {
        await this.emailService.send({
          email: user.email,
          metadata: {
            template: 'order-created',
            subject: 'Замовлення створено',
            orderId: order.id,
            total: Number(order.total),
            notificationsLink,
          },
        });
      }
    } catch (error) {
      this.logger.warn(
        `Failed to send order creation notifications for order ${order.id}`,
        error,
      );
    }

    return this.ordersDataService.findById(order.id);
  }

  private canAccessOrder(
    user: AuthenticatedUser,
    order: OrderResponse,
  ): boolean {
    if (user.isAdmin) {
      return true;
    }

    if (user.userApplicationId) {
      const orderHasEventsFromApplication = order.events.some(
        (event) => event.event.application.id === user.userApplicationId,
      );
      if (orderHasEventsFromApplication) {
        return true;
      }
    }

    return order.userId === user.userId;
  }

  async getOrder(user: AuthenticatedUser, id: number): Promise<OrderResponse> {
    const order = await this.ordersDataService.findById(id);

    if (!this.canAccessOrder(user, order)) {
      throw new ForbiddenException('ACCESS_DENIED');
    }

    return order;
  }

  async getOrders(
    user: AuthenticatedUser,
    userIdParam?: number,
    applicationId?: number,
    eventId?: number,
    status?: OrderStatus,
    searchQuery?: string,
    orderType?: OrderType,
  ): Promise<OrderResponse[]> {
    let finalApplicationId = applicationId;
    let finalUserId = userIdParam;

    if (!user.isAdmin) {
      if (user.userApplicationId) {
        finalApplicationId = applicationId || user.userApplicationId;
      } else {
        finalUserId = userIdParam || user.userId;
      }
    }

    const normalizedFilters: OrdersFilters = {
      userId: finalUserId,
      applicationId: finalApplicationId,
      eventId,
      status,
      searchQuery,
      orderType: orderType || 'all',
    };

    return this.ordersDataService.findMany(normalizedFilters);
  }

  async getOrdersCount(
    user: AuthenticatedUser,
    userIdParam?: number,
    applicationId?: number,
    eventId?: number,
    status?: OrderStatus,
    searchQuery?: string,
    orderType?: OrderType,
  ): Promise<number> {
    let finalApplicationId = applicationId;
    let finalUserId = userIdParam;

    if (!user.isAdmin) {
      if (user.userApplicationId) {
        finalApplicationId = applicationId || user.userApplicationId;
      } else {
        finalUserId = userIdParam || user.userId;
      }
    }

    const normalizedFilters: OrdersFilters = {
      userId: finalUserId,
      applicationId: finalApplicationId,
      eventId,
      status,
      searchQuery,
      orderType: orderType || 'all',
    };

    return this.ordersDataService.count(normalizedFilters);
  }

  private isTicketTriggerStatus(status: OrderStatus | undefined): boolean {
    return (
      status === OrderStatus.PAID || status === OrderStatus.PAYMENT_ON_SITE
    );
  }

  async handleOrderStatusTransitionEffects(
    orderId: number,
    previousStatus: OrderStatus | undefined,
    nextStatus: OrderStatus | undefined,
  ): Promise<void> {
    if (nextStatus === OrderStatus.CANCELLED) {
      try {
        await this.eventsRegistrationService.cancelRegistrationsByOrderId(
          orderId,
        );
      } catch (err) {
        this.logger.warn(
          `cancelRegistrationsByOrderId(${orderId}) failed`,
          err,
        );
      }
      return;
    }

    if (!this.isTicketTriggerStatus(nextStatus)) return;
    if (this.isTicketTriggerStatus(previousStatus)) return;

    try {
      await this.eventsRegistrationService.approveMany(orderId);
    } catch (err) {
      this.logger.warn(`approveMany(${orderId}) failed`, err);
    }

    try {
      await this.eventsNotificationService.sendTicketsForOrder(orderId);
    } catch (err) {
      this.logger.warn(`sendTicketsForOrder(${orderId}) failed`, err);
    }
  }

  async updateOrder(
    user: AuthenticatedUser,
    id: number,
    data: { status?: OrderStatus },
  ): Promise<OrderResponse> {
    const order = await this.ordersDataService.findById(id);

    if (!this.canAccessOrder(user, order)) {
      throw new ForbiddenException('ACCESS_DENIED');
    }

    const previousStatus = order.status;
    const updatedOrder = await this.ordersDataService.update(id, data);

    await this.handleOrderStatusTransitionEffects(
      id,
      previousStatus,
      updatedOrder.status,
    );

    return updatedOrder;
  }

  async removeOrder(user: AuthenticatedUser, id: number): Promise<void> {
    const order = await this.ordersDataService.findById(id);

    if (!this.canAccessOrder(user, order)) {
      throw new ForbiddenException('ACCESS_DENIED');
    }

    await this.ordersDataService.delete(id);
  }
}
