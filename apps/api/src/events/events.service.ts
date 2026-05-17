import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AclService } from '../acl/acl.service';
import { ApplicationsService } from '../applications/applications.service';
import { AclPermission, EventStatus } from '../generated/prisma-client';
import { StorageService } from '../storage/storage.service';
import { EventsDataService } from './events-data.service';
import { EventsGalleryService } from './events-gallery.service';
import { EventsNotificationService } from './events-notification.service';
import {
  EventStatusRequest,
  EventUpdateRequest,
  EventsFilters,
  EventsRequest,
  EventsResponse,
} from './interfaces';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly eventsDataService: EventsDataService,
    private readonly storageService: StorageService,
    private readonly applicationsService: ApplicationsService,
    private readonly aclService: AclService,
    private readonly galleryService: EventsGalleryService,
    private readonly eventsNotificationService: EventsNotificationService,
  ) {}

  private parseRequiredDate(
    value: Date | string | null | undefined,
    fieldName: string,
  ): Date {
    if (value === undefined || value === null || value === '') {
      throw new BadRequestException(`${fieldName.toUpperCase()}_IS_REQUIRED`);
    }

    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`INVALID_${fieldName.toUpperCase()}`);
    }
    return parsed;
  }

  private validateEventDates(
    registrationEndDate: Date,
    gameStartDate: Date,
    endDate: Date,
  ): void {
    if (gameStartDate.getTime() < registrationEndDate.getTime()) {
      throw new BadRequestException(
        'GAME_START_DATE_MUST_BE_AFTER_OR_EQUAL_TO_REGISTRATION_END',
      );
    }

    if (gameStartDate.getTime() > endDate.getTime()) {
      throw new BadRequestException(
        'GAME_START_DATE_MUST_BE_BEFORE_OR_EQUAL_TO_EVENT_END',
      );
    }

    if (registrationEndDate.getTime() > endDate.getTime()) {
      throw new BadRequestException(
        'REGISTRATION_END_DATE_MUST_BE_BEFORE_OR_EQUAL_TO_EVENT_END',
      );
    }
  }

  async createEvent(
    userId: number,
    data: EventsRequest,
  ): Promise<EventsResponse> {
    const isAdmin = await this.aclService.can(
      userId,
      AclPermission.write,
      'system',
      null,
    );

    let applicationId = data.applicationId;

    if (!applicationId) {
      const userApplication = await this.applicationsService.get({
        ownerId: userId,
      });
      if (!userApplication) {
        throw new ForbiddenException('NO_APPLICATION');
      }

      applicationId = userApplication.id;
    }

    const registrationEndDate = this.parseRequiredDate(
      data.startDate,
      'startDate',
    );
    const gameStartDate = this.parseRequiredDate(
      data.gameStartDate,
      'gameStartDate',
    );
    const endDate = this.parseRequiredDate(data.endDate, 'endDate');

    this.validateEventDates(registrationEndDate, gameStartDate, endDate);

    const eventPhone = data.socialLinks?.phone?.trim();
    if (!eventPhone) {
      throw new BadRequestException('EVENT_PHONE_IS_REQUIRED');
    }

    if (
      data.regionId == null ||
      !Number.isInteger(data.regionId) ||
      data.regionId < 1
    ) {
      throw new BadRequestException('REGION_ID_IS_REQUIRED');
    }

    const event = await this.eventsDataService.create({
      ...data,
      applicationId,
      startDate: registrationEndDate,
      gameStartDate,
      endDate,
      status: isAdmin ? EventStatus.APPROVED : EventStatus.PENDING,
    });

    if (!isAdmin) {
      await this.eventsNotificationService.notifyAdminsNewEvent(event);
    }

    return event;
  }

  async getEvents(
    filters: EventsFilters = {},
    userId?: number,
  ): Promise<EventsResponse[]> {
    if (userId) {
      const isAdmin = await this.aclService.can(
        userId,
        AclPermission.write,
        'system',
        null,
      );

      if (!isAdmin) {
        // Если applicationId указан в фильтрах, используем его
        // Иначе находим приложение пользователя и фильтруем по нему
        if (filters.applicationId) {
          return this.eventsDataService.findMany(filters);
        }

        const userApplication = await this.applicationsService.get({
          ownerId: userId,
        });
        if (userApplication) {
          return this.eventsDataService.findMany({
            ...filters,
            applicationId: userApplication.id,
          });
        }
        // Если у пользователя нет приложения, возвращаем пустой массив
        return [];
      }

      const adminFilters = { ...filters };
      delete adminFilters.applicationId;
      return this.eventsDataService.findMany(adminFilters);
    }

    return this.eventsDataService.findMany({
      ...filters,
      status: EventStatus.APPROVED,
    });
  }

  async getPublicEvent(
    id: number,
    include?: string[],
  ): Promise<
    EventsResponse & {
      gallery?: Array<{ id: number; url: string; createdAt: Date }>;
    }
  > {
    const event = await this.eventsDataService.findById(id);
    if (event.status !== EventStatus.APPROVED) {
      throw new NotFoundException('EVENT_NOT_FOUND');
    }

    if (include && include.includes('gallery')) {
      const gallery = await this.galleryService.getGallery(id);
      return {
        ...event,
        gallery,
      };
    }

    return event;
  }

  async getEvent(
    id: number,
    include?: string[],
  ): Promise<
    EventsResponse & {
      gallery?: Array<{ id: number; url: string; createdAt: Date }>;
    }
  > {
    const event = await this.eventsDataService.findById(id);

    if (include && include.includes('gallery')) {
      const gallery = await this.galleryService.getGallery(id);
      return {
        ...event,
        gallery,
      };
    }

    return event;
  }

  async updateEvent(
    userId: number,
    id: number,
    data: EventUpdateRequest,
  ): Promise<EventsResponse> {
    const existingEvent = await this.eventsDataService.findById(id);

    const mergedRegistrationEndDate = this.parseRequiredDate(
      data.startDate ?? existingEvent.startDate,
      'startDate',
    );
    const mergedGameStartDate = this.parseRequiredDate(
      data.gameStartDate ?? existingEvent.gameStartDate,
      'gameStartDate',
    );
    const mergedEndDate = this.parseRequiredDate(
      data.endDate !== undefined ? data.endDate : existingEvent.endDate,
      'endDate',
    );

    this.validateEventDates(
      mergedRegistrationEndDate,
      mergedGameStartDate,
      mergedEndDate,
    );

    const { startDate, gameStartDate, endDate, ...restData } = data;

    const updateData: EventUpdateRequest = {
      ...restData,
      ...(startDate !== undefined && {
        startDate: this.parseRequiredDate(startDate, 'startDate'),
      }),
      ...(gameStartDate !== undefined && {
        gameStartDate: this.parseRequiredDate(gameStartDate, 'gameStartDate'),
      }),
      ...(endDate !== undefined && {
        endDate: this.parseRequiredDate(endDate, 'endDate'),
      }),
    };

    return this.eventsDataService.update(id, updateData);
  }

  async removeEvent(userId: number, id: number): Promise<void> {
    await this.eventsDataService.delete(id);
  }

  async getUserEvents(userId: number): Promise<EventsResponse[]> {
    return this.eventsDataService.findByUserId(userId);
  }

  async uploadEventImage(
    userId: number,
    eventId: number,
    file: Express.Multer.File,
  ): Promise<{ url: string; event: EventsResponse }> {
    if (!file) {
      throw new BadRequestException('NO_FILE_PROVIDED');
    }

    const event = await this.getEvent(eventId);

    const saved = await this.storageService.save(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    const updated = await this.updateEvent(userId, eventId, {
      image: saved.url,
    });

    if (event.image) {
      const oldKey = this.storageService.extractKeyFromUrl(event.image);
      await this.storageService.remove(oldKey);
    }

    return { url: saved.url, event: updated };
  }

  async updateEventStatus(
    id: number,
    data: EventStatusRequest,
  ): Promise<EventsResponse> {
    if (
      data.status !== EventStatus.APPROVED &&
      data.status !== EventStatus.REJECTED
    ) {
      throw new BadRequestException('INVALID_EVENT_STATUS_TRANSITION');
    }

    const event = await this.eventsDataService.updateStatus(
      id,
      data.status,
      data.reason,
    );

    try {
      await this.eventsNotificationService.notifyOrganizerEventStatus(
        event.application.owner.id,
        event,
        data.status,
        data.reason,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown notification error';
      this.logger.warn(
        `Event status updated for event ${id}, but organizer notification failed: ${message}`,
      );
    }

    return event;
  }

  async getPendingCount(): Promise<{ count: number }> {
    const count = await this.eventsDataService.countPending();
    return { count };
  }

  async completeEvent(
    userId: number,
    eventId: number,
  ): Promise<EventsResponse> {
    return this.eventsDataService.completeEvent(eventId);
  }
}
