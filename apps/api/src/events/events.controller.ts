import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseBoolPipe,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ImageFileInterceptor,
  MultipleImageFilesInterceptor,
} from '../common/config/file-upload.config';
import { Admin } from '../common/decorators/admin.decorator';
import { Application } from '../common/decorators/application.decorator';
import { Public } from '../common/decorators/public.decorator';
import { User } from '../common/decorators/user.decorator';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { CompetitionType, EventStatus } from '../generated/prisma-client';
import { EventsRequestDto } from './dto/events-request.dto';
import { EventStatusRequestDto } from './dto/event-status-request.dto';
import { EventsResponseDto } from './dto/events-response.dto';
import { EventsGalleryService } from './events-gallery.service';
import { EventsRegistrationService } from './events-registration.service';
import { EventsService } from './events.service';

const EVENTS_CACHE_CONTROL = 'no-store, no-cache, must-revalidate';

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly eventRegistrationService: EventsRegistrationService,
    private readonly galleryService: EventsGalleryService,
  ) {}

  @Post()
  @Admin()
  @Application('applicationId')
  create(@User('userId') userId: number, @Body() dto: EventsRequestDto) {
    return this.eventsService.createEvent(userId, dto);
  }

  @Public()
  @UseGuards(ApiKeyGuard)
  @Get()
  @Header('Cache-Control', EVENTS_CACHE_CONTROL)
  findAll(
    @User('userId') userId: number | undefined,
    @Query('citySlug') citySlug?: string,
    @Query('city') city?: string,
    @Query('regionSlug') regionSlug?: string,
    @Query('applicationId', new ParseIntPipe({ optional: true }))
    applicationId?: number,
    @Query('isActive', new ParseBoolPipe({ optional: true }))
    isActive?: boolean,
    @Query(
      'competitionType',
      new ParseEnumPipe(CompetitionType, { optional: true }),
    )
    competitionType?: CompetitionType,
    @Query('searchQuery') searchQuery?: string,
    @Query('date') date?: string,
    @Query('month') month?: string,
    @Query('status', new ParseEnumPipe(EventStatus, { optional: true }))
    status?: EventStatus,
  ) {
    return this.eventsService.getEvents(
      {
        citySlug,
        city,
        regionSlug,
        applicationId,
        isActive,
        competitionType,
        searchQuery,
        date,
        month,
        status,
      },
      userId,
    );
  }

  @Get('moderation/pending-count')
  @Admin()
  getPendingCount() {
    return this.eventsService.getPendingCount();
  }

  @Public()
  @UseGuards(ApiKeyGuard)
  @Get(':id')
  @Header('Cache-Control', EVENTS_CACHE_CONTROL)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('include') include?: string,
  ) {
    const includes = include ? include.split(',') : [];
    return this.eventsService.getPublicEvent(id, includes);
  }

  @Patch(':id/status')
  @Admin()
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EventStatusRequestDto,
  ) {
    return this.eventsService.updateEventStatus(id, dto);
  }

  @Patch(':id')
  @Admin()
  @Application('id', true)
  update(
    @User('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<EventsRequestDto>,
  ) {
    return this.eventsService.updateEvent(userId, id, dto);
  }

  @Delete(':id')
  @Admin()
  @Application('id', true)
  remove(
    @User('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.eventsService.removeEvent(userId, id);
  }

  @Post(':id/register')
  @Admin()
  @Application('id', true)
  async register(
    @Param('id', ParseIntPipe) eventId: number,
    @Body('orderId', new ParseIntPipe({ optional: false })) orderId: number,
    @Body('eventSideId', new ParseIntPipe({ optional: false }))
    eventSideId: number,
    @Body('teamId', new ParseIntPipe({ optional: true }))
    teamId: number | undefined,
    @Body('selectedMemberIds') selectedMemberIds: number[] | undefined,
    @User('userId') userId: number,
  ) {
    await this.eventRegistrationService.register(eventId, userId, orderId, {
      eventSideId,
      teamId,
      selectedMemberIds: Array.isArray(selectedMemberIds)
        ? selectedMemberIds
        : undefined,
    });
  }

  @Post(':id/cancel-registration')
  @Admin()
  @Application('id', true)
  async cancelRegistration(
    @Param('id', ParseIntPipe) eventId: number,
    @User('userId') userId: number,
  ) {
    await this.eventRegistrationService.cancelRegistration(eventId, userId);
  }

  @Post(':id/cancel-my-registration')
  async cancelMyRegistration(
    @Param('id', ParseIntPipe) eventId: number,
    @User('userId') userId: number,
  ) {
    await this.eventRegistrationService.cancelRegistration(eventId, userId);
  }

  @Get(':id/my-registration-status')
  async getMyRegistrationStatus(
    @Param('id', ParseIntPipe) eventId: number,
    @User('userId') userId: number,
  ) {
    return this.eventRegistrationService.getMyRegistrationStatus(eventId, userId);
  }

  @Post(':id/upload-image')
  @Admin()
  @Application('id', true)
  @UseInterceptors(ImageFileInterceptor)
  async uploadImage(
    @User('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.eventsService.uploadEventImage(userId, id, file);
    return {
      url: result.url,
      event: new EventsResponseDto(result.event),
    };
  }

  @Get(':id/registrations')
  @Admin()
  @Application('id', true)
  async getRegistrations(
    @User('userId') userId: number,
    @Param('id', ParseIntPipe) eventId: number,
    @Query('status') statusQuery?: string,
  ) {
    return this.eventRegistrationService.getRegistrations(
      eventId,
      userId,
      statusQuery,
    );
  }

  @Post(':id/registrations/:userId/approve')
  @Admin()
  @Application('id', true)
  async approveRegistration(
    @User('userId') ownerId: number,
    @Param('id', ParseIntPipe) eventId: number,
    @Param('userId', ParseIntPipe) registrationUserId: number,
  ) {
    await this.eventRegistrationService.approveRegistration(
      ownerId,
      eventId,
      registrationUserId,
    );
    return { success: true };
  }

  @Post(':id/registrations/:userId/reject')
  @Admin()
  @Application('id', true)
  async rejectRegistration(
    @User('userId') ownerId: number,
    @Param('id', ParseIntPipe) eventId: number,
    @Param('userId', ParseIntPipe) registrationUserId: number,
  ) {
    await this.eventRegistrationService.rejectRegistration(
      ownerId,
      eventId,
      registrationUserId,
    );
    return { success: true };
  }

  @Get('user/my-events')
  async getUserEvents(@User('userId') userId: number) {
    return this.eventsService.getUserEvents(userId);
  }

  @Get(':id/gallery')
  @Public()
  @UseGuards(ApiKeyGuard)
  @Header('Cache-Control', EVENTS_CACHE_CONTROL)
  async getGallery(@Param('id', ParseIntPipe) eventId: number) {
    return this.galleryService.getGallery(eventId);
  }

  @Post(':id/gallery')
  @Admin()
  @Application('id', true)
  @UseInterceptors(MultipleImageFilesInterceptor)
  async uploadGalleryPhotos(
    @Param('id', ParseIntPipe) eventId: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.galleryService.uploadPhotos(eventId, files);
  }

  @Delete(':id/gallery/:photoId')
  @Admin()
  @Application('id', true)
  async deleteGalleryPhoto(
    @Param('id', ParseIntPipe) eventId: number,
    @Param('photoId', ParseIntPipe) photoId: number,
  ) {
    await this.galleryService.deletePhoto(eventId, photoId);
    return { success: true };
  }

  @Post(':id/complete')
  @Admin()
  @Application('id', true)
  async completeEvent(
    @User('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.eventsService.completeEvent(userId, id);
  }
}
