import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AclService } from '../acl/acl.service';
import { ApplicationsService } from '../applications/applications.service';
import { AuthenticatedUser } from '../common/types/request.types';
import {
  AclPermission,
  CompetitionType,
  EventRegistrationStatus,
  EventStatus,
} from '../generated/prisma-client';
import { OrdersDataService } from '../orders/orders-data.service';
import { OrdersService } from '../orders/orders.service';
import { TeamsDataService } from '../teams/teams-data.service';
import { FRONTEND_BASE_URL } from '../utils/config';
import { EventsDataService } from './events-data.service';
import { EventsNotificationService } from './events-notification.service';
import { EventsRegistrationDataService } from './events-registration-data.service';
import {
  EventRegistrationWithEvent,
  EventRegistrationWithRelations,
  EventSideResponse,
  EventsResponse,
} from './interfaces';

@Injectable()
export class EventsRegistrationService {
  constructor(
    private readonly registrationDataService: EventsRegistrationDataService,
    private readonly eventsDataService: EventsDataService,
    private readonly teamsDataService: TeamsDataService,
    private readonly aclService: AclService,
    private readonly applicationsService: ApplicationsService,
    private readonly notificationService: EventsNotificationService,
    @Inject(forwardRef(() => OrdersDataService))
    private readonly ordersDataService: OrdersDataService,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
  ) {}

  async register(
    eventId: number,
    userId: number,
    orderId: number,
    params: {
      teamId?: number;
      eventSideId?: number | null;
      selectedMemberIds?: number[];
    },
  ): Promise<void> {
    const event = await this.eventsDataService.findById(eventId);
    if (event.status !== EventStatus.APPROVED) {
      throw new BadRequestException('EVENT_NOT_APPROVED');
    }
    if (!event.isActive) {
      throw new BadRequestException('EVENT_NOT_ACTIVE');
    }
    if (event.startDate <= new Date()) {
      throw new BadRequestException('EVENT_ALREADY_STARTED');
    }

    if (event.sides && event.sides.length > 0) {
      if (!params.eventSideId) {
        throw new BadRequestException('EVENT_SIDE_ID_REQUIRED');
      }
      const side = event.sides.find(
        (eventSide) => eventSide.id === params.eventSideId,
      );
      if (!side) {
        throw new BadRequestException('SIDE_NOT_FOUND');
      }
    }

    const registrations = await this.registrationDataService.findMany(eventId, {
      status: {
        notIn: [
          EventRegistrationStatus.CANCELLED,
          EventRegistrationStatus.REJECTED,
        ],
      },
    });

    if (event.competitionType === CompetitionType.TEAM) {
      await this.registerTeam(eventId, userId, orderId, params, event, {
        maxParticipants: event.maxParticipants,
        registrations: registrations.map((registration) => ({
          teamId: registration.teamId,
          eventSideId: registration.eventSideId,
          userId: registration.userId,
        })),
      });
    } else {
      await this.registerUser(
        eventId,
        userId,
        orderId,
        params.eventSideId,
        event,
        {
          maxParticipants: event.maxParticipants,
          registrations: registrations.map((registration) => ({
            userId: registration.userId,
            eventSideId: registration.eventSideId,
          })),
        },
      );
    }
  }

  private async registerTeam(
    eventId: number,
    userId: number,
    orderId: number,
    params: {
      teamId?: number;
      eventSideId?: number | null;
      selectedMemberIds?: number[];
    },
    event: EventsResponse,
    eventData: {
      maxParticipants: number;
      registrations: Array<{
        teamId: number | null;
        eventSideId: number | null;
        userId: number;
      }>;
    },
  ): Promise<void> {
    if (params.teamId == null) {
      throw new BadRequestException('TEAM_ID_REQUIRED_FOR_TEAM_EVENT');
    }
    const teamId = params.teamId;

    const team = await this.teamsDataService.findOne(teamId, {
      onlyActiveMembers: true,
    });
    if (!team) {
      throw new NotFoundException('TEAM_NOT_FOUND');
    }

    const isOwner = await this.aclService.can(
      userId,
      AclPermission.write,
      `team/${teamId}/owner`,
    );

    if (!isOwner) {
      throw new BadRequestException('ONLY_TEAM_OWNER_CAN_REGISTER_TEAM');
    }

    let side: EventSideResponse | undefined;
    if (event.sides && event.sides.length > 0) {
      if (!params.eventSideId) {
        throw new BadRequestException('EVENT_SIDE_ID_REQUIRED');
      }
      side = event.sides.find(
        (eventSide) => eventSide.id === params.eventSideId,
      );
      if (!side) {
        throw new BadRequestException('SIDE_NOT_FOUND');
      }
      if (side.teamId != null && side.teamId !== teamId) {
        throw new ConflictException('SIDE_ALREADY_TAKEN');
      }
    }

    const registeredTeams = new Set(
      eventData.registrations
        .map((registration) => registration.teamId)
        .filter((value): value is number => value !== null),
    );
    if (registeredTeams.has(teamId)) {
      throw new ConflictException('TEAM_ALREADY_REGISTERED');
    }

    const activeMembers = team.members ?? [];

    const registeredUsers = new Set(
      eventData.registrations.map((registration) => registration.userId),
    );

    if (
      eventData.maxParticipants > 0 &&
      registeredUsers.size >= eventData.maxParticipants
    ) {
      throw new BadRequestException('EVENT_FULL');
    }

    const memberUserIds = params.selectedMemberIds
      ? (() => {
          const activeSet = new Set(
            activeMembers.map((member) => member.userId),
          );
          const selected = params.selectedMemberIds;
          const invalid = selected.filter((id) => !activeSet.has(id));
          if (invalid.length > 0) {
            throw new BadRequestException('SELECTED_MEMBERS_NOT_IN_TEAM');
          }
          return selected;
        })()
      : activeMembers.map((member) => member.userId);

    if (memberUserIds.length === 0) {
      throw new BadRequestException('AT_LEAST_ONE_MEMBER_REQUIRED');
    }
    if (
      eventData.maxParticipants > 0 &&
      registeredUsers.size + memberUserIds.length > eventData.maxParticipants
    ) {
      throw new BadRequestException('EVENT_FULL');
    }
    if (side && params.eventSideId && side.sideCapacity > 0) {
      const currentSidePlayers = eventData.registrations.filter(
        (registration) => registration.eventSideId === params.eventSideId,
      ).length;
      if (currentSidePlayers + memberUserIds.length > side.sideCapacity) {
        throw new BadRequestException('SIDE_FULL');
      }
    }
    if (side && params.eventSideId) {
      await this.eventsDataService.setEventSideTeam(params.eventSideId, teamId);
    }

    const toCreate = memberUserIds.map((uid) => ({
      userId: uid,
      orderId,
      teamId,
      ...(params.eventSideId ? { eventSideId: params.eventSideId } : {}),
    }));

    if (toCreate.length === 1) {
      await this.registrationDataService.create(eventId, toCreate[0].userId, {
        orderId,
        teamId,
        ...(params.eventSideId ? { eventSideId: params.eventSideId } : {}),
      });
    } else {
      await this.registrationDataService.createMany(
        eventId,
        toCreate.map((item) => ({
          userId: item.userId,
          orderId,
          teamId,
          ...(params.eventSideId ? { eventSideId: params.eventSideId } : {}),
        })),
      );
    }

    const otherMembers = memberUserIds.filter(
      (memberUserId) => memberUserId !== userId,
    );
    if (otherMembers.length > 0) {
      await Promise.all(
        otherMembers.map((memberUserId) =>
          this.notificationService.notifyTeamEventsRequirePayment(
            memberUserId,
            [event.name],
            [eventId],
          ),
        ),
      );
    }

    await this.notificationService.notifyEventRegistration(
      eventId,
      userId,
      event.name,
    );

    await this.notificationService.notifyApplicationNewRegistration(
      eventId,
      event,
      userId,
      teamId,
      true,
    );
  }

  private async createOrUpdateRegistration(
    eventId: number,
    userId: number,
    orderId: number,
    event: EventsResponse,
    eventSideId: number | null | undefined,
    teamId?: number,
    isTeamRegistration?: boolean,
  ): Promise<void> {
    const existingRegistration = await this.registrationDataService.findOne(
      eventId,
      userId,
    );

    if (existingRegistration) {
      if (
        existingRegistration.status !== EventRegistrationStatus.CANCELLED &&
        existingRegistration.status !== EventRegistrationStatus.REJECTED
      ) {
        throw new ConflictException('ALREADY_REGISTERED');
      }
      await this.registrationDataService.update(eventId, userId, {
        status: EventRegistrationStatus.PENDING,
        orderId,
        ...(eventSideId !== null && eventSideId !== undefined
          ? { eventSideId }
          : {}),
        ...(teamId !== undefined ? { teamId } : {}),
      });
    } else {
      await this.registrationDataService.create(eventId, userId, {
        orderId,
        ...(eventSideId !== null && eventSideId !== undefined
          ? { eventSideId }
          : {}),
        ...(teamId !== undefined ? { teamId } : {}),
      });
    }

    await Promise.all([
      this.notificationService.notifyEventRegistration(
        eventId,
        userId,
        event.name,
      ),
      this.notificationService.notifyApplicationNewRegistration(
        eventId,
        event,
        userId,
        teamId,
        isTeamRegistration,
      ),
    ]);
  }

  private async registerUser(
    eventId: number,
    userId: number,
    orderId: number,
    eventSideId: number | null | undefined,
    event: EventsResponse,
    eventData: {
      maxParticipants: number;
      registrations: Array<{ userId: number; eventSideId: number | null }>;
    },
  ): Promise<void> {
    const registeredUsers = new Set(
      eventData.registrations.map((registration) => registration.userId),
    );

    if (
      eventData.maxParticipants > 0 &&
      registeredUsers.size >= eventData.maxParticipants
    ) {
      throw new BadRequestException('EVENT_FULL');
    }

    if (eventSideId && event.sides && event.sides.length > 0) {
      const side = event.sides.find((item) => item.id === eventSideId);
      if (!side) {
        throw new BadRequestException('SIDE_NOT_FOUND');
      }
      if (side.sideCapacity > 0) {
        const currentSidePlayers = eventData.registrations.filter(
          (registration) => registration.eventSideId === eventSideId,
        ).length;
        if (currentSidePlayers >= side.sideCapacity) {
          throw new BadRequestException('SIDE_FULL');
        }
      }
    }

    await this.createOrUpdateRegistration(
      eventId,
      userId,
      orderId,
      event,
      eventSideId,
    );
  }

  async cancelRegistration(eventId: number, userId: number): Promise<void> {
    const registration = await this.registrationDataService.findOne(
      eventId,
      userId,
    );

    if (!registration) {
      throw new NotFoundException('REGISTRATION_NOT_FOUND');
    }

    if (registration.status === EventRegistrationStatus.CANCELLED) {
      throw new BadRequestException('ALREADY_CANCELLED');
    }

    await this.registrationDataService.cancel(eventId, userId);

    const event = await this.eventsDataService.findById(eventId);
    await this.notificationService.notifyRegistrationCancelled(
      eventId,
      event,
      userId,
    );
  }

  async getRegistrations(
    eventId: number,
    userId: number,
    statusQuery?: string,
  ): Promise<
    | Array<{
        id: number;
        userId: number;
        teamId: number | null;
        status: EventRegistrationStatus;
        user: {
          id: number;
          fullName: string | null;
          nickName: string;
          logoUrl: string | null;
        };
        team: {
          id: number;
          name: string;
          logoUrl: string | null;
        } | null;
        createdAt: Date;
      }>
    | { status: EventRegistrationStatus | null }
  > {
    const event = await this.eventsDataService.findById(eventId);
    const application = await this.applicationsService.get({
      id: event.applicationId,
    });
    const isOwner = application?.ownerId === userId;

    if (isOwner) {
      let statusFilter:
        | { status: { in: EventRegistrationStatus[] } }
        | undefined;

      if (statusQuery) {
        const statuses = statusQuery
          .split(',')
          .map((status) => status.trim())
          .filter((status): status is EventRegistrationStatus =>
            Object.values(EventRegistrationStatus).includes(
              status as EventRegistrationStatus,
            ),
          );

        if (statuses.length > 0) {
          statusFilter = { status: { in: statuses } };
        }
      }

      const registrations = (await this.registrationDataService.findMany(
        eventId,
        statusFilter,
        {
          user: {
            select: {
              id: true,
              fullName: true,
              nickName: true,
              logoUrl: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
            },
          },
        },
      )) as unknown as EventRegistrationWithRelations[];

      return registrations.map((registration) => ({
        id: registration.id,
        userId: registration.userId,
        teamId: registration.teamId,
        status: registration.status,
        user: registration.user,
        team: registration.team,
        createdAt: registration.createdAt,
      }));
    }

    const registration = await this.registrationDataService.findOne(
      eventId,
      userId,
    );

    if (!registration) {
      return { status: null };
    }

    return { status: registration.status };
  }

  async getMyRegistrationStatus(
    eventId: number,
    userId: number,
  ): Promise<{ isRegistered: boolean; status: EventRegistrationStatus | null }> {
    await this.eventsDataService.findById(eventId);

    const registration = await this.registrationDataService.findOne(
      eventId,
      userId,
    );

    if (
      !registration ||
      registration.status === EventRegistrationStatus.CANCELLED ||
      registration.status === EventRegistrationStatus.REJECTED
    ) {
      return {
        isRegistered: false,
        status: registration?.status ?? null,
      };
    }

    return {
      isRegistered: true,
      status: registration.status,
    };
  }

  async approveRegistration(
    userId: number,
    eventId: number,
    registrationUserId: number,
  ): Promise<void> {
    await this.updateRegistrationStatus(
      eventId,
      registrationUserId,
      'APPROVED',
    );
  }

  async rejectRegistration(
    userId: number,
    eventId: number,
    registrationUserId: number,
  ): Promise<void> {
    await this.updateRegistrationStatus(
      eventId,
      registrationUserId,
      'REJECTED',
    );
  }

  private async updateRegistrationStatus(
    eventId: number,
    registrationUserId: number,
    status: 'APPROVED' | 'REJECTED',
  ): Promise<void> {
    const registration = await this.registrationDataService.findOne(
      eventId,
      registrationUserId,
    );

    if (!registration) {
      throw new NotFoundException('REGISTRATION_NOT_FOUND');
    }

    if (registration.status !== EventRegistrationStatus.PENDING) {
      throw new BadRequestException('REGISTRATION_NOT_PENDING');
    }

    if (status === 'APPROVED') {
      await this.registrationDataService.approve(eventId, registrationUserId);
    } else {
      await this.registrationDataService.reject(eventId, registrationUserId);
    }

    const event = await this.eventsDataService.findById(eventId);
    await this.notificationService.notifyEventRegistrationStatus(
      eventId,
      registrationUserId,
      event.name,
      status,
      status === 'APPROVED' ? event : undefined,
    );
  }

  async approveMany(orderId: number): Promise<{ count: number }> {
    return this.registrationDataService.approveMany(orderId);
  }

  async cancelRegistrationsByOrderId(
    orderId: number,
  ): Promise<{ count: number }> {
    return this.registrationDataService.cancelManyByOrderId(orderId);
  }

  async getTicket(
    user: AuthenticatedUser,
    orderId: number,
    eventId: number,
  ): Promise<{
    eventId: number;
    eventName: string;
    eventDate: string;
    eventTime: string;
    location: string;
    contactInfo: string;
    phoneNumber?: string;
    ticketLink: string;
    paymentOnArrival: boolean;
  }> {
    const order = await this.ordersService.getOrder(user, orderId);
    const hasEvent = order.events?.some((e) => e.eventId === eventId);
    if (!hasEvent) {
      throw new BadRequestException('EVENT_NOT_IN_THIS_ORDER');
    }
    const registration = await this.registrationDataService.findOne(
      eventId,
      user.userId,
    );
    if (!registration) {
      throw new NotFoundException('TICKET_NOT_FOUND');
    }
    if (
      registration.status === EventRegistrationStatus.CANCELLED ||
      registration.status === EventRegistrationStatus.REJECTED
    ) {
      throw new NotFoundException('TICKET_NOT_FOUND');
    }
    const event = await this.eventsDataService.findById(eventId);
    const start =
      event.startDate instanceof Date
        ? event.startDate
        : new Date(event.startDate);
    const eventDate = start.toLocaleDateString('uk-UA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const eventTime = start.toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const locationParts = [
      event.address,
      event.city?.name,
      event.city?.region?.name,
    ].filter(Boolean);
    const location = locationParts.join(', ');
    const contactInfo = event.application?.phoneNumber ?? '';
    const paymentOnArrival =
      registration.status === EventRegistrationStatus.PENDING;
    return {
      eventId: event.id,
      eventName: event.name,
      eventDate,
      eventTime,
      location,
      contactInfo,
      phoneNumber: event.application?.phoneNumber ?? undefined,
      ticketLink: `${FRONTEND_BASE_URL}/events/${eventId}`,
      paymentOnArrival,
    };
  }

  async hasTeamActiveRegistrations(teamId: number): Promise<boolean> {
    const registrations = await this.registrationDataService.findMany(
      undefined,
      {
        teamId,
        status: {
          notIn: [
            EventRegistrationStatus.CANCELLED,
            EventRegistrationStatus.REJECTED,
          ],
        },
      },
    );
    return registrations.length > 0;
  }

  async registerNewMemberOnTeamEvents(
    teamId: number,
    userId: number,
  ): Promise<void> {
    const teamRegistrations = await this.registrationDataService.findMany(
      undefined,
      {
        teamId,
        status: EventRegistrationStatus.APPROVED,
      },
      {
        event: {
          select: {
            id: true,
            name: true,
            isActive: true,
            startDate: true,
            gameStartDate: true,
            competitionType: true,
            status: true,
            statusReason: true,
            maxParticipants: true,
            price: true,
          },
        },
      },
      {
        distinct: ['eventId'],
      },
    );

    if (teamRegistrations.length === 0) {
      return;
    }

    const now = new Date();

    const activeTeamEvents = (
      teamRegistrations as unknown as EventRegistrationWithEvent[]
    )
      .map((registration) => registration.event)
      .filter(
        (event): event is NonNullable<EventRegistrationWithEvent['event']> =>
          event !== null &&
          event !== undefined &&
          event.competitionType === CompetitionType.TEAM &&
          event.status === EventStatus.APPROVED &&
          event.isActive &&
          new Date(event.startDate) > now,
      );

    if (activeTeamEvents.length === 0) {
      return;
    }

    const eventIds = activeTeamEvents.map((event) => event.id);

    const existingRegistrations = await this.registrationDataService.findMany(
      undefined,
      {
        eventId: { in: eventIds },
        userId,
        status: {
          notIn: [
            EventRegistrationStatus.CANCELLED,
            EventRegistrationStatus.REJECTED,
          ],
        },
      },
    );

    const registeredEventIds = new Set(
      existingRegistrations.map((registration) => registration.eventId),
    );

    const eventsToNotify = activeTeamEvents.filter(
      (event) => !registeredEventIds.has(event.id),
    );

    if (eventsToNotify.length > 0) {
      const eventNames = eventsToNotify.map((event) => event.name);
      const eventIdsToNotify = eventsToNotify.map((event) => event.id);

      await this.notificationService.notifyTeamEventsRequirePayment(
        userId,
        eventNames,
        eventIdsToNotify,
      );
    }
  }

  async cancelTeamEventRegistrationsForMember(
    teamId: number,
    userId: number,
  ): Promise<void> {
    const teamRegistrations = await this.registrationDataService.findMany(
      undefined,
      {
        userId,
        teamId,
        status: EventRegistrationStatus.APPROVED,
      },
    );

    if (teamRegistrations.length === 0) {
      return;
    }

    const eventIds = teamRegistrations.map(
      (registration) => registration.eventId,
    );

    const eventsResults = await Promise.allSettled(
      eventIds.map((eventId) => this.eventsDataService.findById(eventId)),
    );

    const events = eventsResults
      .filter(
        (result): result is PromiseFulfilledResult<EventsResponse> =>
          result.status === 'fulfilled',
      )
      .map((result) => result.value);

    const now = new Date();
    const activeTeamEvents = events.filter(
      (event) =>
        event.competitionType === CompetitionType.TEAM &&
        event.isActive &&
        new Date(event.startDate) > now,
    );

    await Promise.allSettled(
      activeTeamEvents.map((event) =>
        this.registrationDataService.cancel(event.id, userId),
      ),
    );
  }
}
