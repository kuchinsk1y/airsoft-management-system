import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Application } from '../common/decorators/application.decorator';
import { Admin } from '../common/decorators/admin.decorator';
import { Public } from '../common/decorators/public.decorator';
import { User } from '../common/decorators/user.decorator';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { EventResultRequestDto } from './dto/event-result-request.dto';
import { EventResultResponseDto } from './dto/event-result-response.dto';
import { CompleteEventWithRatingsDto } from './dto/complete-event-with-ratings.dto';
import { CreateRatingGameTypeDto } from './dto/create-rating-game-type.dto';
import { OrganizerRatingResponseDto } from './dto/organizer-rating-response.dto';
import { PlayerRatingResponseDto } from './dto/player-rating-response.dto';
import { TeamRatingResponseDto } from './dto/team-rating-response.dto';
import { EventResultsService } from './event-results.service';
import { OrganizerRatingsService } from './organizer-ratings.service';
import { PlayerRatingsService } from './player-ratings.service';
import { TeamRatingsService } from './team-ratings.service';

const RATINGS_CACHE_CONTROL = 'no-store, no-cache, must-revalidate';
const RATINGS_STATIC_CACHE_CONTROL = 'no-store, no-cache, must-revalidate';

@Controller('ratings')
export class RatingsController {
  constructor(
    private readonly eventResultsService: EventResultsService,
    private readonly playerRatingsService: PlayerRatingsService,
    private readonly organizerRatingsService: OrganizerRatingsService,
    private readonly teamRatingsService: TeamRatingsService,
  ) {}

  @Get('game-types')
  @Public()
  @UseGuards(ApiKeyGuard)
  @Header('Cache-Control', RATINGS_STATIC_CACHE_CONTROL)
  async getRatingGameTypes() {
    return this.eventResultsService.getActiveRatingGameTypes();
  }

  @Get('admin/game-types')
  @Admin()
  async getAdminRatingGameTypes() {
    return this.eventResultsService.getAllRatingGameTypes();
  }

  @Post('admin/game-types')
  @Admin()
  async createRatingGameType(@Body() dto: CreateRatingGameTypeDto) {
    return this.eventResultsService.createRatingGameType(dto);
  }

  @Post('events/:eventId/complete-with-ratings')
  @Application('eventId', true)
  async completeEventWithRatings(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() dto: CompleteEventWithRatingsDto,
    @User('userId') userId: number,
  ) {
    return this.eventResultsService.completeEventWithRatings(
      eventId,
      userId,
      dto,
    );
  }

  @Post('events/:eventId/results')
  @Application('eventId', true)
  async createEventResult(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() dto: EventResultRequestDto,
    @User('userId') userId: number,
  ) {
    const result = await this.eventResultsService.createResult(userId, {
      ...dto,
      eventId,
    });
    return new EventResultResponseDto(result);
  }

  @Get('events/:eventId/results')
  @Public()
  @UseGuards(ApiKeyGuard)
  @Header('Cache-Control', RATINGS_CACHE_CONTROL)
  async getEventResults(@Param('eventId', ParseIntPipe) eventId: number) {
    const results = await this.eventResultsService.getEventResults(eventId);
    return results.map((r) => new EventResultResponseDto(r));
  }

  @Get('events/:eventId/results/:resultId')
  @Public()
  @UseGuards(ApiKeyGuard)
  @Header('Cache-Control', RATINGS_CACHE_CONTROL)
  async getEventResult(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Param('resultId', ParseIntPipe) resultId: number,
  ) {
    const result = await this.eventResultsService.getResult(resultId);
    return new EventResultResponseDto(result);
  }

  @Patch('events/:eventId/results/:resultId')
  @Application('eventId', true)
  async updateEventResult(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Param('resultId', ParseIntPipe) resultId: number,
    @Body() dto: Partial<EventResultRequestDto>,
  ) {
    const result = await this.eventResultsService.updateResult(resultId, dto);
    return new EventResultResponseDto(result);
  }

  @Post('events/:eventId/results/:resultId/confirm')
  @Application('eventId', true)
  async confirmEventResult(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Param('resultId', ParseIntPipe) resultId: number,
    @User('userId') userId: number,
  ) {
    const result = await this.eventResultsService.confirmResult(
      resultId,
      userId,
    );
    return new EventResultResponseDto(result);
  }

  @Delete('events/:eventId/results/:resultId')
  @Application('eventId', true)
  async deleteEventResult(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Param('resultId', ParseIntPipe) resultId: number,
  ) {
    await this.eventResultsService.deleteResult(resultId);
    return { success: true };
  }

  @Get('players')
  @Public()
  @UseGuards(ApiKeyGuard)
  @Header('Cache-Control', RATINGS_CACHE_CONTROL)
  async getPlayerLeaderboard(
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
    @Query('sortBy') sortBy?: string,
    @Query('search') searchQuery?: string,
    @Query('order') order?: 'asc' | 'desc',
  ) {
    let finalLimit = 50;
    let finalOffset = 0;

    if (limitStr !== undefined && limitStr !== null && limitStr !== '') {
      const limitNum = parseInt(limitStr, 10);
      if (isNaN(limitNum)) {
        throw new BadRequestException('limit must be an integer number');
      }
      finalLimit = limitNum;
    }

    if (offsetStr !== undefined && offsetStr !== null && offsetStr !== '') {
      const offsetNum = parseInt(offsetStr, 10);
      if (isNaN(offsetNum)) {
        throw new BadRequestException('offset must be an integer number');
      }
      finalOffset = offsetNum;
    }

    if (finalLimit < 1 || finalLimit > 100) {
      throw new BadRequestException('limit must be between 1 and 100');
    }

    if (finalOffset < 0) {
      throw new BadRequestException('offset must be >= 0');
    }

    if (searchQuery && searchQuery.length < 2) {
      throw new BadRequestException(
        'search query is too short (min 2 characters)',
      );
    }

    const result = await this.playerRatingsService.getPlayerLeaderboard(
      sortBy || 'totalPoints',
      order || 'desc',
      finalLimit,
      finalOffset,
      searchQuery,
    );
    return {
      items: result.items.map((r) => new PlayerRatingResponseDto(r)),
      total: Number(result.total),
      limit: Number(result.limit),
      offset: Number(result.offset),
    };
  }

  @Get('players/me')
  async getMyPlayerRating(@User('userId') userId: number) {
    const rating = await this.playerRatingsService.getPlayerRating(userId);
    if (!rating) {
      return null;
    }
    return new PlayerRatingResponseDto(rating);
  }

  @Get('players/:userId')
  @Public()
  @UseGuards(ApiKeyGuard)
  @Header('Cache-Control', RATINGS_CACHE_CONTROL)
  async getPlayerRating(@Param('userId', ParseIntPipe) userId: number) {
    const rating = await this.playerRatingsService.getPlayerRating(userId);
    if (!rating) {
      return null;
    }
    return new PlayerRatingResponseDto(rating);
  }

  @Get('teams')
  @Public()
  @UseGuards(ApiKeyGuard)
  @Header('Cache-Control', RATINGS_CACHE_CONTROL)
  async getTeamLeaderboard(
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
    @Query('sortBy') sortBy?: string,
    @Query('search') searchQuery?: string,
    @Query('order') order?: 'asc' | 'desc',
  ) {
    let finalLimit = 50;
    let finalOffset = 0;

    if (limitStr !== undefined && limitStr !== null && limitStr !== '') {
      const limitNum = parseInt(limitStr, 10);
      if (isNaN(limitNum)) {
        throw new BadRequestException('limit must be an integer number');
      }
      finalLimit = limitNum;
    }

    if (offsetStr !== undefined && offsetStr !== null && offsetStr !== '') {
      const offsetNum = parseInt(offsetStr, 10);
      if (isNaN(offsetNum)) {
        throw new BadRequestException('offset must be an integer number');
      }
      finalOffset = offsetNum;
    }

    if (finalLimit < 1 || finalLimit > 100) {
      throw new BadRequestException('limit must be between 1 and 100');
    }

    if (finalOffset < 0) {
      throw new BadRequestException('offset must be >= 0');
    }

    if (searchQuery && searchQuery.length < 2) {
      throw new BadRequestException(
        'search query is too short (min 2 characters)',
      );
    }

    const result = await this.teamRatingsService.getTeamLeaderboard(
      sortBy || 'totalPoints',
      order || 'desc',
      finalLimit,
      finalOffset,
      searchQuery,
    );
    return {
      items: result.items.map((r) => new TeamRatingResponseDto(r)),
      total: Number(result.total),
      limit: Number(result.limit),
      offset: Number(result.offset),
    };
  }

  @Get('teams/:teamId')
  @Public()
  @UseGuards(ApiKeyGuard)
  @Header('Cache-Control', RATINGS_CACHE_CONTROL)
  async getTeamRating(@Param('teamId', ParseIntPipe) teamId: number) {
    const rating = await this.teamRatingsService.getTeamRating(teamId);
    if (!rating) {
      return null;
    }
    return new TeamRatingResponseDto(rating);
  }

  @Get('organizers')
  @Public()
  @UseGuards(ApiKeyGuard)
  @Header('Cache-Control', RATINGS_CACHE_CONTROL)
  async getOrganizerLeaderboard(
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
    @Query('sortBy') sortBy?: string,
    @Query('search') searchQuery?: string,
    @Query('order') order?: 'asc' | 'desc',
  ) {
    let finalLimit = 50;
    let finalOffset = 0;

    if (limitStr !== undefined && limitStr !== null && limitStr !== '') {
      const limitNum = parseInt(limitStr, 10);
      if (isNaN(limitNum)) {
        throw new BadRequestException('limit must be an integer number');
      }
      finalLimit = limitNum;
    }

    if (offsetStr !== undefined && offsetStr !== null && offsetStr !== '') {
      const offsetNum = parseInt(offsetStr, 10);
      if (isNaN(offsetNum)) {
        throw new BadRequestException('offset must be an integer number');
      }
      finalOffset = offsetNum;
    }

    if (finalLimit < 1 || finalLimit > 100) {
      throw new BadRequestException('limit must be between 1 and 100');
    }

    if (finalOffset < 0) {
      throw new BadRequestException('offset must be >= 0');
    }

    if (searchQuery && searchQuery.length < 2) {
      throw new BadRequestException(
        'search query is too short (min 2 characters)',
      );
    }

    const result = await this.organizerRatingsService.getOrganizerLeaderboard(
      sortBy || 'totalPoints',
      order || 'desc',
      finalLimit,
      finalOffset,
      searchQuery,
    );

    return {
      items: result.items.map((r) => new OrganizerRatingResponseDto(r)),
      total: Number(result.total),
      limit: Number(result.limit),
      offset: Number(result.offset),
    };
  }

  @Get('organizers/:userId')
  @Public()
  @UseGuards(ApiKeyGuard)
  @Header('Cache-Control', RATINGS_CACHE_CONTROL)
  async getOrganizerRating(@Param('userId', ParseIntPipe) userId: number) {
    const rating =
      await this.organizerRatingsService.getOrganizerRating(userId);
    if (!rating) {
      return null;
    }
    return new OrganizerRatingResponseDto(rating);
  }
}
