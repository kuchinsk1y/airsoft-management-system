import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '../generated/prisma-client';
import { FindNotificationParams, NotificationsRequest } from './interfaces';
import { NotificationsDataService } from './notifications-data.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly notificationsData: NotificationsDataService) {}

  async createNotification(data: NotificationsRequest) {
    return await this.notificationsData.create(data);
  }

  async createNotifications(notifications: NotificationsRequest[]) {
    await this.notificationsData.createMany(notifications);
  }

  async getNotification(params: FindNotificationParams) {
    return this.notificationsData.findOne(params);
  }

  async getNotifications(userId: number) {
    return await this.notificationsData.findMany(userId);
  }

  async getBadgeCounts(userId: number) {
    const [pendingInvitesCount, unreadNotificationsCount] = await Promise.all([
      this.notificationsData.countPendingInvitations(userId),
      this.notificationsData.countUnread(userId),
    ]);

    return {
      pendingInvitesCount,
      unreadNotificationsCount,
    };
  }

  async markAsRead(id: number, userId: number) {
    const notification = await this.notificationsData.findOne({ id, userId });
    if (!notification) {
      throw new NotFoundException('NOTIFICATION_NOT_FOUND');
    }

    if (!notification.isRead) {
      await this.notificationsData.update(id, userId, {
        isRead: true,
      });
    }
    return { success: true };
  }

  async markAllAsRead(userId: number) {
    await this.notificationsData.updateMany(
      { userId, isRead: false },
      { isRead: true },
    );
    return { success: true };
  }

  async markAllByTypeAsRead(userId: number, type: NotificationType) {
    await this.notificationsData.updateMany(
      { userId, isRead: false, type },
      { isRead: true },
    );
    return { success: true };
  }
}
