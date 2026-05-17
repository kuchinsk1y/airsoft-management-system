import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  ParseBoolPipe,
  ParseEnumPipe,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { User } from '../common/decorators/user.decorator';
import { CommentScope, CommentStatus } from '../generated/prisma-client';
import { CommentsService } from './comments.service';
import { CreateCommentsDto } from './dto/create-comments.dto';
import { CommentsResponseDto } from './dto/comments-response.dto';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  async create(
    @User('userId') userId: number,
    @Body() dto: CreateCommentsDto,
  ): Promise<CommentsResponseDto> {
    return this.commentsService.createComment(dto.eventId, userId, dto.message);
  }

  @Get('my')
  async getMy(
    @User('userId') userId: number,
    @Query('scope', new ParseEnumPipe(CommentScope, { optional: true }))
    scope?: CommentScope,
  ): Promise<CommentsResponseDto[]> {
    return this.commentsService.getMyComments(userId, scope);
  }

  @Public()
  @Get()
  async get(
    @User('userId') userId: number | undefined,
    @Query('eventId', new ParseIntPipe({ optional: true })) eventId?: number,
    @Query('random', new ParseBoolPipe({ optional: true })) random?: boolean,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('scope', new ParseEnumPipe(CommentScope, { optional: true }))
    scope?: CommentScope,
    @Query('status', new ParseEnumPipe(CommentStatus, { optional: true }))
    status?: CommentStatus,
  ): Promise<CommentsResponseDto[]> {
    if (status) {
      return this.commentsService.getCommentsForModeration(userId, status, scope);
    }
    if (random) {
      return this.commentsService.getRandomComments(limit || 9, scope);
    }
    if (eventId) {
      return this.commentsService.getEventComments(eventId);
    }
    if (scope === CommentScope.COMPANY) {
      return this.commentsService.getCompanyComments();
    }
    return this.commentsService.getRandomComments(limit || 9, scope);
  }

  @Patch(':id/approve')
  async approve(
    @User('userId') moderatorId: number,
    @Param('id', ParseIntPipe) commentId: number,
  ): Promise<CommentsResponseDto> {
    return this.commentsService.approveComment(commentId, moderatorId);
  }

  @Patch(':id/reject')
  async reject(
    @User('userId') moderatorId: number,
    @Param('id', ParseIntPipe) commentId: number,
  ): Promise<CommentsResponseDto> {
    return this.commentsService.rejectComment(commentId, moderatorId);
  }

  @Delete(':id')
  async delete(
    @User('userId') moderatorId: number,
    @Param('id', ParseIntPipe) commentId: number,
  ): Promise<void> {
    await this.commentsService.deleteComment(commentId, moderatorId);
  }
}
