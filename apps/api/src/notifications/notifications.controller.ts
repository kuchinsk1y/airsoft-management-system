import {
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { User } from '../common/decorators/user.decorator';
import { NotificationType } from '../generated/prisma-client';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('badge')
  async getBadge(@User('userId') userId: number) {
    return this.notificationsService.getBadgeCounts(userId);
  }

  @Get()
  async get(@User('userId') userId: number) {
    return this.notificationsService.getNotifications(userId);
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @User('userId') userId: number,
  ) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Patch('read-all')
  async markAllAsRead(@User('userId') userId: number) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch('read-by-type/:type')
  async markAllByTypeAsRead(
    @Param('type', new ParseEnumPipe(NotificationType)) type: NotificationType,
    @User('userId') userId: number,
  ) {
    return this.notificationsService.markAllByTypeAsRead(userId, type);
  }
}
