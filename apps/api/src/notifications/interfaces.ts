import { NotificationType } from '../generated/prisma-client';

export interface NotificationsRequest {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
}

export interface FindNotificationParams {
  id?: number;
  userId?: number;
  type?: NotificationType;
  link?: string;
  createdAt?: {
    gte?: Date;
    lte?: Date;
    gt?: Date;
    lt?: Date;
  };
  [key: string]: any;
}
