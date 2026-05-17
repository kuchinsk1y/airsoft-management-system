import { CommentStatus } from '../../generated/prisma-client';

export class CommentsResponseDto {
  id: number;
  eventId?: number;
  scope: 'EVENT' | 'COMPANY';
  userId: number;
  message: string;
  status: CommentStatus;
  createdAt: Date;
  moderatedAt?: Date;

  author: {
    id: number;
    nickName: string;
    fullName?: string;
    logoUrl?: string;
  };

  event?: {
    id: number;
    name: string;
  };

  moderator?: {
    id: number;
    nickName: string;
    fullName?: string;
  };
}
