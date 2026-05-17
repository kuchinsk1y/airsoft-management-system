import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AclService } from '../acl/acl.service';
import { ApplicationsService } from '../applications/applications.service';
import { CommentScope, CommentStatus } from '../generated/prisma-client';
import { AclPermission } from '../generated/prisma-client';
import { CommentsDataService } from './comments-data.service';
import { EventsDataService } from '../events/events-data.service';
import { CommentsResponseDto } from './dto/comments-response.dto';
import { CommentWithRelations } from './comments.entity';

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentsData: CommentsDataService,
    private readonly eventsData: EventsDataService,
    private readonly aclService: AclService,
    private readonly applicationsService: ApplicationsService,
  ) {}

  async createComment(
    eventId: number | undefined,
    userId: number,
    message: string,
  ): Promise<CommentsResponseDto> {
    const isEventComment = typeof eventId === 'number';

    if (isEventComment) {
      try {
        await this.eventsData.findById(eventId);
      } catch {
        throw new NotFoundException('EVENT_NOT_FOUND');
      }

      const hasComment = await this.commentsData.userHasEventComment(eventId, userId);
      if (hasComment) {
        throw new BadRequestException('ALREADY_COMMENTED');
      }
    }

    const comment = await this.commentsData.create(
      isEventComment ? eventId : null,
      userId,
      message,
      isEventComment ? CommentScope.EVENT : CommentScope.COMPANY,
    );
    return this.mapToDto(comment);
  }

  async getEventComments(eventId: number): Promise<CommentsResponseDto[]> {
    const comments = await this.commentsData.findByEventId(
      eventId,
      CommentStatus.APPROVED,
    );
    return comments.map((comment) => this.mapToDto(comment));
  }

  async getCompanyComments(): Promise<CommentsResponseDto[]> {
    const comments = await this.commentsData.findCompanyComments(
      CommentStatus.APPROVED,
    );
    return comments.map((comment) => this.mapToDto(comment));
  }

  async getRandomComments(
    limit: number = 9,
    scope?: CommentScope,
  ): Promise<CommentsResponseDto[]> {
    const comments = await this.commentsData.findForModeration(
      CommentStatus.APPROVED,
      undefined,
      scope,
    );
    const shuffled = [...comments].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit).map((comment) => this.mapToDto(comment));
  }

  async getCommentsForModeration(
    requesterId: number | undefined,
    status?: CommentStatus,
    scope?: CommentScope,
  ): Promise<CommentsResponseDto[]> {
    if (!requesterId) {
      throw new UnauthorizedException('TOKEN_REQUIRED');
    }

    const isAdmin = await this.aclService.can(
      requesterId,
      AclPermission.write,
      'system',
      null,
    );

    let applicationId: number | undefined;
    if (!isAdmin) {
      try {
        const app = await this.applicationsService.get({
          ownerId: requesterId,
        });
        applicationId = app.id;
      } catch {
        throw new ForbiddenException('ACCESS_DENIED');
      }
    }

    const comments = await this.commentsData.findForModeration(
      status,
      applicationId,
      scope,
    );
    return comments.map((comment) => this.mapToDto(comment));
  }

  async getMyComments(
    userId: number,
    scope?: CommentScope,
  ): Promise<CommentsResponseDto[]> {
    const comments = await this.commentsData.findByUserId(userId, scope);
    return comments.map((comment) => this.mapToDto(comment));
  }

  async approveComment(
    commentId: number,
    moderatorId: number,
  ): Promise<CommentsResponseDto> {
    const comment = await this.commentsData.findById(commentId);
    if (!comment) {
      throw new NotFoundException('COMMENT_NOT_FOUND');
    }

    if (comment.event) {
      await this.aclService.assert(
        moderatorId,
        AclPermission.write,
        'application',
        comment.event.applicationId,
      );
    } else {
      await this.aclService.assert(
        moderatorId,
        AclPermission.write,
        'system',
        null,
      );
    }

    if (comment.status === CommentStatus.APPROVED) {
      return this.mapToDto(comment);
    }

    if (
      comment.status !== CommentStatus.PENDING &&
      comment.status !== CommentStatus.REJECTED
    ) {
      throw new BadRequestException('COMMENT_ALREADY_MODERATED');
    }

    const updated = await this.commentsData.updateStatus(
      commentId,
      CommentStatus.APPROVED,
      moderatorId,
    );
    return this.mapToDto(updated);
  }

  async rejectComment(
    commentId: number,
    moderatorId: number,
  ): Promise<CommentsResponseDto> {
    const comment = await this.commentsData.findById(commentId);
    if (!comment) {
      throw new NotFoundException('COMMENT_NOT_FOUND');
    }

    if (comment.event) {
      await this.aclService.assert(
        moderatorId,
        AclPermission.write,
        'application',
        comment.event.applicationId,
      );
    } else {
      await this.aclService.assert(
        moderatorId,
        AclPermission.write,
        'system',
        null,
      );
    }

    if (comment.status === CommentStatus.REJECTED) {
      return this.mapToDto(comment);
    }

    if (
      comment.status !== CommentStatus.PENDING &&
      comment.status !== CommentStatus.APPROVED
    ) {
      throw new BadRequestException('COMMENT_ALREADY_MODERATED');
    }

    const updated = await this.commentsData.updateStatus(
      commentId,
      CommentStatus.REJECTED,
      moderatorId,
    );
    return this.mapToDto(updated);
  }

  async deleteComment(commentId: number, moderatorId: number): Promise<void> {
    const comment = await this.commentsData.findById(commentId);
    if (!comment) {
      throw new NotFoundException('COMMENT_NOT_FOUND');
    }

    if (comment.event) {
      await this.aclService.assert(
        moderatorId,
        AclPermission.write,
        'application',
        comment.event.applicationId,
      );
    } else {
      await this.aclService.assert(
        moderatorId,
        AclPermission.write,
        'system',
        null,
      );
    }

    await this.commentsData.delete(commentId);
  }

  private mapToDto(comment: CommentWithRelations): CommentsResponseDto {
    return {
      id: comment.id,
      eventId: comment.eventId || undefined,
      scope: comment.scope,
      userId: comment.userId,
      message: comment.message,
      status: comment.status,
      createdAt: comment.createdAt,
      moderatedAt: comment.moderatedAt || undefined,
      author: {
        id: comment.author.id,
        nickName: comment.author.nickName,
        fullName: comment.author.fullName || undefined,
        logoUrl: comment.author.logoUrl || undefined,
      },
      event: comment.event
        ? {
            id: comment.event.id,
            name: comment.event.name,
          }
        : undefined,
      moderator: comment.moderator
        ? {
            id: comment.moderator.id,
            nickName: comment.moderator.nickName,
            fullName: comment.moderator.fullName || undefined,
          }
        : undefined,
    };
  }
}
