import { Injectable } from '@nestjs/common';
import { NotificationType, TeamInvitationStatus } from '../generated/prisma-client';
import { PrismaService } from '../prisma/prisma.service';
import { FindNotificationParams, NotificationsRequest } from './interfaces';

@Injectable()
export class NotificationsDataService {
  constructor(private prisma: PrismaService) {}

  async create(data: NotificationsRequest) {
    return this.prisma.notification.create({ data });
  }

  async createMany(data: NotificationsRequest[]) {
    if (!data.length) return;
    await this.prisma.notification.createMany({
      data: data.map((item) => ({ ...item })),
    });
  }

  async findOne(params: FindNotificationParams) {
    return this.prisma.notification.findFirst({
      where: params,
    });
  }

  async findMany(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countUnread(userId: number) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async countPendingInvitations(userId: number) {
    return this.prisma.teamInvitation.count({
      where: {
        inviteeId: userId,
        status: TeamInvitationStatus.PENDING,
      },
    });
  }

  async update(id: number, userId: number, data: { isRead?: boolean }) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data,
    });
  }

  async updateMany(
    where: { userId?: number; isRead?: boolean; type?: NotificationType },
    data: { isRead?: boolean },
  ) {
    return this.prisma.notification.updateMany({
      where,
      data,
    });
  }
}
