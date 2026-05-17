import { Injectable, NotFoundException } from '@nestjs/common';
import {
  EventRegistrationStatus,
  OrderStatus,
  Prisma,
} from '../generated/prisma-client';
import { PrismaService } from '../prisma/prisma.service';
import { OrderResponse, OrdersFilters } from './interfaces';

const orderInclude = {
  user: {
    select: {
      id: true,
      email: true,
      fullName: true,
      nickName: true,
      phoneNumber: true,
    },
  },
  products: {
    include: {
      product: true,
    },
  },
  eventRegistrations: {
    include: {
      event: {
        include: {
          application: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  },
} as const;

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: typeof orderInclude;
}>;

@Injectable()
export class OrdersDataService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly include = orderInclude;

  private buildWhere(filters: OrdersFilters = {}): Prisma.OrderWhereInput {
    const where: Prisma.OrderWhereInput = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.eventId) {
      where.eventRegistrations = {
        some: {
          eventId: filters.eventId,
        },
      };
    } else if (filters.applicationId) {
      where.eventRegistrations = {
        some: {
          event: {
            applicationId: filters.applicationId,
          },
        },
      };
    }

    if (filters.orderType && filters.orderType !== 'all') {
      if (filters.orderType === 'products') {
        where.products = { some: {} };
      } else if (filters.orderType === 'events') {
        where.eventRegistrations = { some: {} };
      }
    }

    if (filters.searchQuery) {
      const searchQuery = filters.searchQuery.trim();

      const searchConditions: Prisma.OrderWhereInput[] = [
        {
          user: {
            OR: [
              { email: { contains: searchQuery, mode: 'insensitive' } },
              { fullName: { contains: searchQuery, mode: 'insensitive' } },
              { nickName: { contains: searchQuery, mode: 'insensitive' } },
              { phoneNumber: { contains: searchQuery, mode: 'insensitive' } },
            ],
          },
        },
      ];

      const isPureDigits = /^\d+$/.test(searchQuery);

      if (isPureDigits && searchQuery.length < 10) {
        const searchNumber = parseInt(searchQuery, 10);
        const PG_INT_MAX = 2147483647;

        if (searchNumber <= PG_INT_MAX) {
          searchConditions.push({ id: searchNumber });
        }
      }

      where.OR = searchConditions;
    }

    return where;
  }

  private mapOrderToResponse(order: OrderWithRelations): OrderResponse {
    return {
      id: order.id,
      userId: order.userId,
      total: Number(order.total),
      status: order.status,
      paymentMethod: order.paymentMethod || 'BANK',
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      user: order.user,
      products: order.products.map((product) => ({
        id: product.id,
        productId: product.productId,
        quantity: product.qty,
        price: Number(product.price),
        product: {
          id: product.product.id,
          name: product.product.name,
          image: product.product.image,
          price: product.product.price,
        },
      })),
      events: (
        order.eventRegistrations as Array<{
          id: number;
          eventId: number;
          status: EventRegistrationStatus;
          event: {
            id: number;
            name: string;
            image: string;
            price: number;
            startDate: Date;
            application: {
              id: number;
              name: string;
            };
          };
        }>
      ).map(
        (registration: {
          id: number;
          eventId: number;
          status: EventRegistrationStatus;
          event: {
            id: number;
            name: string;
            image: string;
            price: number;
            startDate: Date;
            application: {
              id: number;
              name: string;
            };
          };
        }) => ({
          id: registration.id,
          eventId: registration.eventId,
          status: registration.status,
          event: {
            id: registration.event.id,
            name: registration.event.name,
            image: registration.event.image,
            price: registration.event.price,
            startDate: registration.event.startDate,
            application: {
              id: registration.event.application.id,
              name: registration.event.application.name,
            },
          },
        }),
      ),
    };
  }

  async create(data: {
    userId: number;
    total: number;
    status: OrderStatus;
    paymentMethod: 'BANK' | 'CASH';
    products?: Array<{
      productId: number;
      qty: number;
      price: number;
    }>;
  }): Promise<OrderResponse> {
    const order = await this.prisma.order.create({
      data: {
        userId: data.userId,
        total: data.total,
        status: data.status,
        paymentMethod: data.paymentMethod,
        products: data.products
          ? {
              create: data.products,
            }
          : undefined,
      },
      include: this.include,
    });

    return this.mapOrderToResponse(order);
  }

  async findById(id: number): Promise<OrderResponse> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: this.include,
    });

    if (!order) {
      throw new NotFoundException('ORDER_NOT_FOUND');
    }

    return this.mapOrderToResponse(order);
  }

  async findMany(filters: OrdersFilters = {}): Promise<OrderResponse[]> {
    const where = this.buildWhere(filters);

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: this.include,
    });

    return orders.map((order) => this.mapOrderToResponse(order));
  }

  async count(filters: OrdersFilters = {}): Promise<number> {
    const where = this.buildWhere(filters);
    return this.prisma.order.count({ where });
  }

  async update(
    id: number,
    data: { status?: OrderStatus },
  ): Promise<OrderResponse> {
    const existingOrder = await this.prisma.order.findUnique({ where: { id } });
    if (!existingOrder) {
      throw new NotFoundException('ORDER_NOT_FOUND');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data,
      include: this.include,
    });

    return this.mapOrderToResponse(updatedOrder);
  }

  async delete(id: number): Promise<void> {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('ORDER_NOT_FOUND');
    }

    await this.prisma.order.delete({ where: { id } });
  }
}
