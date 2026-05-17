import { Injectable } from '@nestjs/common';
import { EventRegistrationStatus, Prisma } from '../generated/prisma-client';
import { PrismaService } from '../prisma/prisma.service';
import {
  EventRegistrationRequest,
  EventRegistrationUpdateRequest,
} from './interfaces';

@Injectable()
export class EventsRegistrationDataService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    eventId: number,
    userId: number,
    data: EventRegistrationRequest,
  ) {
    return this.prisma.eventRegistration.create({
      data: {
        eventId,
        userId,
        ...data,
        status: EventRegistrationStatus.PENDING,
      },
    });
  }

  async createMany(
    eventId: number,
    data: Array<{ userId: number } & EventRegistrationRequest>,
    status?: EventRegistrationStatus,
  ) {
    if (data.length === 0) {
      return { count: 0 };
    }

    const userIds = data.map((item) => item.userId);

    const teamIds = data.map((item) => item.teamId ?? null);
    const uniqueTeamIds = Array.from(new Set(teamIds));

    const orderIds = data.map((item) => item.orderId ?? null);
    const uniqueOrderIds = Array.from(new Set(orderIds));

    const eventSideIds = data.map((item) => item.eventSideId ?? null);
    const uniqueEventSideIds = Array.from(new Set(eventSideIds));

    if (uniqueTeamIds.length > 1) {
      throw new Error('INCONSISTENT_TEAM_ID');
    }

    if (uniqueOrderIds.length > 1) {
      throw new Error('INCONSISTENT_ORDER_ID');
    }

    if (uniqueEventSideIds.length > 1) {
      throw new Error('INCONSISTENT_EVENT_SIDE_ID');
    }

    const teamId = uniqueTeamIds[0];
    const orderId = uniqueOrderIds[0];
    const eventSideId = uniqueEventSideIds[0];

    return this.prisma.$transaction(async (transaction) => {
      const excludedUserIds = new Set<number>();

      const existingApproved = await transaction.eventRegistration.findMany({
        where: {
          eventId,
          userId: { in: userIds },
          status: EventRegistrationStatus.APPROVED,
        },
        select: { userId: true },
      });

      existingApproved.forEach((registration) =>
        excludedUserIds.add(registration.userId),
      );

      if (teamId !== null) {
        const otherTeamRegistrations =
          await transaction.eventRegistration.findMany({
            where: {
              eventId,
              userId: { in: userIds },
              teamId: { not: teamId },
              status: {
                notIn: [
                  EventRegistrationStatus.CANCELLED,
                  EventRegistrationStatus.REJECTED,
                ],
              },
            },
            select: { userId: true },
          });

        otherTeamRegistrations.forEach((registration) =>
          excludedUserIds.add(registration.userId),
        );
      }

      const usersToProcess = userIds.filter((id) => !excludedUserIds.has(id));

      if (usersToProcess.length === 0) {
        return { count: 0 };
      }

      await transaction.eventRegistration.updateMany({
        where: {
          eventId,
          userId: { in: usersToProcess },
          status: {
            in: [
              EventRegistrationStatus.CANCELLED,
              EventRegistrationStatus.REJECTED,
            ],
          },
        },
        data: {
          status: EventRegistrationStatus.PENDING,
          ...(teamId !== null ? { teamId } : {}),
          ...(eventSideId !== null ? { eventSideId } : {}),
        },
      });

      if (teamId !== null) {
        await transaction.eventRegistration.updateMany({
          where: {
            eventId,
            userId: { in: usersToProcess },
            status: EventRegistrationStatus.PENDING,
            teamId: null,
          },
          data: { teamId },
        });
      }

      return transaction.eventRegistration.createMany({
        data: data
          .filter((item) => !excludedUserIds.has(item.userId))
          .map((item) => ({
            eventId,
            userId: item.userId,
            ...(teamId !== null ? { teamId } : {}),
            ...(eventSideId !== null ? { eventSideId } : {}),
            orderId,
            status: status ?? EventRegistrationStatus.PENDING,
          })),
        skipDuplicates: true,
      });
    });
  }

  async findOne(
    eventId: number,
    userId: number,
    filters?: Prisma.EventRegistrationWhereInput,
  ) {
    return this.prisma.eventRegistration.findFirst({
      where: {
        eventId,
        userId,
        ...filters,
      },
    });
  }

  async findMany(
    eventId?: number,
    filters?: Prisma.EventRegistrationWhereInput,
    include?: Prisma.EventRegistrationInclude,
    options?: {
      distinct?: Prisma.EventRegistrationScalarFieldEnum[];
    },
  ) {
    const where: Prisma.EventRegistrationWhereInput = {
      ...(eventId ? { eventId } : {}),
      ...filters,
    };

    return this.prisma.eventRegistration.findMany({
      where,
      ...(include ? { include } : {}),
      ...(options?.distinct ? { distinct: options.distinct } : {}),
    });
  }

  async update(
    eventId: number,
    userId: number,
    data: EventRegistrationUpdateRequest,
    statusFilter?: Prisma.EventRegistrationWhereInput['status'],
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const registration = await transaction.eventRegistration.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId,
          },
        },
      });

      if (!registration) {
        return null;
      }

      if (registration.teamId && data.status) {
        return transaction.eventRegistration.updateMany({
          where: {
            eventId,
            teamId: registration.teamId,
            status: {
              notIn: [
                EventRegistrationStatus.CANCELLED,
                EventRegistrationStatus.REJECTED,
              ],
            },
            ...(statusFilter ? { status: statusFilter } : {}),
          },
          data: {
            status: data.status,
          },
        });
      }

      return transaction.eventRegistration.update({
        where: {
          eventId_userId: {
            eventId,
            userId,
          },
        },
        data,
      });
    });
  }

  async updateMany(
    eventId: number,
    where: Prisma.EventRegistrationWhereInput,
    data: Prisma.EventRegistrationUpdateManyMutationInput,
  ) {
    return this.prisma.eventRegistration.updateMany({
      where: { eventId, ...where },
      data,
    });
  }

  async approve(eventId: number, userId: number) {
    return this.update(
      eventId,
      userId,
      { status: EventRegistrationStatus.APPROVED },
      EventRegistrationStatus.PENDING,
    );
  }

  async approveMany(orderId: number): Promise<{ count: number }> {
    return this.prisma.eventRegistration.updateMany({
      where: { orderId, status: EventRegistrationStatus.PENDING },
      data: { status: EventRegistrationStatus.APPROVED },
    });
  }

  async reject(eventId: number, userId: number) {
    return this.update(
      eventId,
      userId,
      { status: EventRegistrationStatus.REJECTED },
      {
        notIn: [
          EventRegistrationStatus.CANCELLED,
          EventRegistrationStatus.REJECTED,
        ],
      },
    );
  }

  async cancel(eventId: number, userId: number) {
    return this.update(
      eventId,
      userId,
      { status: EventRegistrationStatus.CANCELLED },
      {
        notIn: [
          EventRegistrationStatus.CANCELLED,
          EventRegistrationStatus.REJECTED,
        ],
      },
    );
  }

  async cancelManyByOrderId(orderId: number): Promise<{ count: number }> {
    return this.prisma.eventRegistration.updateMany({
      where: {
        orderId,
        status: {
          notIn: [
            EventRegistrationStatus.CANCELLED,
            EventRegistrationStatus.REJECTED,
          ],
        },
      },
      data: { status: EventRegistrationStatus.CANCELLED },
    });
  }
}
