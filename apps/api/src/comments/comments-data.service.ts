import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommentScope, CommentStatus } from '../generated/prisma-client';
import { CommentWithRelations } from './comments.entity';

@Injectable()
export class CommentsDataService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly commentInclude = {
    author: {
      select: {
        id: true,
        nickName: true,
        fullName: true,
        logoUrl: true,
      },
    },
    event: {
      select: {
        id: true,
        name: true,
        applicationId: true,
      },
    },
    moderator: {
      select: {
        id: true,
        nickName: true,
        fullName: true,
      },
    },
  } as const;

  async create(
    eventId: number | null,
    userId: number,
    message: string,
    scope: CommentScope,
  ): Promise<CommentWithRelations> {
    return this.prisma.comment.create({
      data: {
        eventId,
        userId,
        message,
        scope,
        status: CommentStatus.PENDING,
      },
      include: this.commentInclude,
    });
  }

  async findById(id: number): Promise<CommentWithRelations | null> {
    return this.prisma.comment.findUnique({
      where: { id },
      include: this.commentInclude,
    });
  }

  async findByEventId(
    eventId: number,
    status?: CommentStatus,
  ): Promise<CommentWithRelations[]> {
    return this.prisma.comment.findMany({
      where: {
        eventId,
        scope: CommentScope.EVENT,
        ...(status && { status }),
      },
      include: this.commentInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findCompanyComments(status?: CommentStatus): Promise<CommentWithRelations[]> {
    return this.prisma.comment.findMany({
      where: {
        eventId: null,
        scope: CommentScope.COMPANY,
        ...(status && { status }),
      },
      include: this.commentInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findForModeration(
    status?: CommentStatus,
    applicationId?: number,
    scope?: CommentScope,
  ): Promise<CommentWithRelations[]> {
    return this.prisma.comment.findMany({
      where: {
        ...(status && { status }),
        ...(scope && { scope }),
        ...(applicationId && { event: { applicationId } }),
      },
      include: this.commentInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUserId(
    userId: number,
    scope?: CommentScope,
  ): Promise<CommentWithRelations[]> {
    return this.prisma.comment.findMany({
      where: {
        userId,
        ...(scope && { scope }),
      },
      include: this.commentInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(
    id: number,
    status: CommentStatus,
    moderatorId: number,
  ): Promise<CommentWithRelations> {
    return this.prisma.comment.update({
      where: { id },
      data: {
        status,
        moderatedAt: new Date(),
        moderatedBy: moderatorId,
      },
      include: this.commentInclude,
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.comment.delete({
      where: { id },
    });
  }

  async userHasEventComment(eventId: number, userId: number): Promise<boolean> {
    const count = await this.prisma.comment.count({
      where: {
        eventId,
        userId,
        scope: CommentScope.EVENT,
      },
    });
    return count > 0;
  }

  async userHasCompanyComment(userId: number): Promise<boolean> {
    const count = await this.prisma.comment.count({
      where: {
        userId,
        eventId: null,
        scope: CommentScope.COMPANY,
      },
    });
    return count > 0;
  }
}
