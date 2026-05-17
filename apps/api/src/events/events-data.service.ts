import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CitiesService } from '../cities/cities.service';
import {
  CompetitionType,
  EventRegistrationStatus,
  EventStatus,
  Prisma,
} from '../generated/prisma-client';
import { PrismaService } from '../prisma/prisma.service';
import {
  EventSideResponse,
  EventUpdateRequest,
  EventsFilters,
  EventsRequest,
  EventsResponse,
} from './interfaces';

const eventInclude = {
  application: {
    include: {
      owner: {
        select: {
          id: true,
          fullName: true,
          nickName: true,
        },
      },
    },
  },
  ratingGameType: {
    select: {
      id: true,
      name: true,
    },
  },
  city: {
    include: {
      region: true,
    },
  },
  registrations: {
    where: {
      status: EventRegistrationStatus.APPROVED,
    },
  },
  sides: {
    orderBy: { orderIndex: 'asc' as const },
    include: {
      team: {
        select: { id: true, name: true },
      },
    },
  },
} as const;

type EventWithRelations = Prisma.EventGetPayload<{
  include: typeof eventInclude;
}>;

@Injectable()
export class EventsDataService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly citiesService: CitiesService,
  ) {}

  private readonly include = eventInclude;

  private resolveEffectiveIsActive(event: {
    isActive: boolean;
    isCompleted?: boolean | null;
    gameStartDate: Date;
    endDate?: Date | null;
  }): boolean {
    if (event.isCompleted) {
      return false;
    }

    const now = new Date();

    if (event.gameStartDate >= now) {
      return true;
    }

    if (!event.endDate) {
      return false;
    }

    return event.endDate >= now;
  }

  private buildIsActiveWhere(isActive: boolean): Prisma.EventWhereInput {
    const now = new Date();

    if (isActive) {
      return {
        isCompleted: false,
        OR: [
          { gameStartDate: { gte: now } },
          {
            gameStartDate: { lt: now },
            endDate: { not: null, gte: now },
          },
        ],
      };
    }

    return {
      OR: [
        { isCompleted: true },
        {
          gameStartDate: { lt: now },
          OR: [{ endDate: { lt: now } }, { endDate: null }],
        },
      ],
    };
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleArchiveEvents() {
    await this.syncEventStatuses();
  }

  async syncEventStatuses() {
    const now = new Date();

    // Mark events inactive only for events that already started and finished.
    await this.prisma.event.updateMany({
      where: {
        isActive: true,
        gameStartDate: { lt: now },
        OR: [{ endDate: { lt: now } }, { endDate: null }],
      },
      data: {
        isActive: false,
      },
    });

    // Recover future, not completed events even if they have inconsistent endDate.
    await this.prisma.event.updateMany({
      where: {
        isActive: false,
        isCompleted: false,
        gameStartDate: { gte: now },
      },
      data: {
        isActive: true,
      },
    });
  }

  private calculateRegisteredParticipants(
    registrations: Array<{ teamId: number | null; userId: number }>,
    competitionType: CompetitionType,
  ): number {
    if (!registrations || registrations.length === 0) return 0;

    if (competitionType === CompetitionType.TEAM) {
      const uniqueTeams = new Set(
        registrations
          .map((registration) => registration.teamId)
          .filter((id): id is number => id !== null),
      );
      return uniqueTeams.size;
    }

    return new Set(registrations.map((registration) => registration.userId))
      .size;
  }

  private parseDateFilter(
    value: string | undefined,
  ): { gte: Date; lte: Date } | null {
    if (!value || typeof value !== 'string') return null;

    const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateMatch && dateMatch[1] && dateMatch[2] && dateMatch[3]) {
      const year = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10);
      const day = parseInt(dateMatch[3], 10);

      if (
        !isNaN(year) &&
        !isNaN(month) &&
        !isNaN(day) &&
        month >= 1 &&
        month <= 12 &&
        day >= 1 &&
        day <= 31
      ) {
        return {
          gte: new Date(year, month - 1, day, 0, 0, 0, 0),
          lte: new Date(year, month - 1, day, 23, 59, 59, 999),
        };
      }
    }

    return null;
  }

  private mapEvent(event: EventWithRelations): EventsResponse {
    const sides: EventSideResponse[] | undefined = event.sides
      ? (
          event.sides as unknown as Array<{
            id: number;
            name: string;
            orderIndex: number;
            teamId: number | null;
            sideCapacity: number;
            team: { id: number; name: string } | null;
          }>
        ).map((side) => {
          const playersCount =
            event.competitionType === CompetitionType.TEAM
              ? side.teamId == null
                ? 0
                : event.registrations.filter(
                    (registration) => registration.teamId === side.teamId,
                  ).length
              : event.registrations.filter(
                  (registration) => registration.eventSideId === side.id,
                ).length;
          return {
            id: side.id,
            name: side.name,
            orderIndex: side.orderIndex,
            teamId: side.teamId ?? undefined,
            team: side.team
              ? { id: side.team.id, name: side.team.name }
              : undefined,
            sideCapacity: side.sideCapacity,
            playersCount,
          };
        })
      : undefined;

    return {
      id: event.id,
      name: event.name,
      image: event.image,
      startDate: event.startDate,
      gameStartDate: event.gameStartDate,
      endDate: event.endDate ?? undefined,
      description: event.description ?? undefined,
      city: {
        id: event.city.id,
        name: event.city.name,
        slug: event.city.slug,
        region: {
          id: event.city.region.id,
          name: event.city.region.name,
          slug: event.city.region.slug,
        },
      },
      address: event.address,
      applicationId: event.applicationId,
      application: {
        id: event.application.id,
        uid: event.application.uid,
        name: event.application.name,
        phoneNumber: event.application.phoneNumber ?? undefined,
        owner: {
          id: event.application.owner.id,
          fullName: event.application.owner.fullName,
          nickName: event.application.owner.nickName,
        },
      },
      maxParticipants: event.maxParticipants,
      registeredParticipants: this.calculateRegisteredParticipants(
        event.registrations,
        event.competitionType,
      ),
      competitionType: event.competitionType,
      gameTypeId: event.ratingGameType.id,
      gameType: {
        id: event.ratingGameType.id,
        name: event.ratingGameType.name,
      },
      paymentMethods: event.paymentMethods,
      price: event.price,
      isActive: this.resolveEffectiveIsActive({
        isActive: event.isActive,
        isCompleted: event.isCompleted,
        gameStartDate: event.gameStartDate,
        endDate: event.endDate,
      }),
      isCompleted: event.isCompleted ?? false,
      completedAt: event.completedAt ?? undefined,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      sides,
      socialLinks:
        (event.socialLinks as Record<string, string> | null) ?? undefined,
      status: event.status,
      statusReason: event.statusReason ?? null,
    };
  }

  async findById(id: number): Promise<EventsResponse> {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: this.include,
    });

    if (!event) throw new NotFoundException('EVENT_NOT_FOUND');
    return this.mapEvent(event);
  }

  async findMany(filters: EventsFilters = {}): Promise<EventsResponse[]> {
    const isActive = filters.isActive !== undefined ? filters.isActive : true;

    const where: Prisma.EventWhereInput = {
      applicationId: filters.applicationId,
      competitionType: filters.competitionType,
      status: filters.status,
    };

    const andConditions: Prisma.EventWhereInput[] = [];

    if (filters.citySlug || filters.city) {
      const cityConditions: Prisma.CityWhereInput[] = [];
      if (filters.citySlug) cityConditions.push({ slug: filters.citySlug });
      if (filters.city) cityConditions.push({ name: filters.city });
      andConditions.push({ city: { OR: cityConditions } });
    }

    if (filters.regionSlug) {
      andConditions.push({
        city: { region: { slug: filters.regionSlug } },
      });
    }

    if (filters.searchQuery?.trim()) {
      const searchQuery = filters.searchQuery.trim();
      andConditions.push({
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          {
            application: {
              name: { contains: searchQuery, mode: 'insensitive' },
            },
          },
        ],
      });
    }

    if (filters?.date) {
      const dateFilter = this.parseDateFilter(filters.date);
      if (dateFilter) {
        andConditions.push({
          gameStartDate: {
            gte: dateFilter.gte,
            lte: dateFilter.lte,
          },
        });
      }
    }

    if (filters?.month) {
      const [year, month] = filters.month.split('-').map(Number);
      const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
      andConditions.push({
        gameStartDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      });
    }

    andConditions.push(this.buildIsActiveWhere(isActive));

    if (andConditions.length > 0) where.AND = andConditions;

    const orderBy: Prisma.EventOrderByWithRelationInput = isActive
      ? { gameStartDate: 'asc' }
      : { gameStartDate: 'desc' };

    const events = await this.prisma.event.findMany({
      where,
      orderBy,
      include: this.include,
    });

    return events.map((event) => this.mapEvent(event));
  }

  async create(
    data: EventsRequest & { status?: EventStatus },
  ): Promise<EventsResponse> {
    const {
      applicationId,
      city,
      regionId,
      startDate,
      gameStartDate,
      endDate,
      address,
      sides: sidesInput,
      socialLinks,
      maxParticipants: _maxParticipants,
      gameTypeId,
      ...restData
    } = data;

    if (regionId == null || !Number.isInteger(regionId) || regionId < 1) {
      throw new BadRequestException('REGION_ID_IS_REQUIRED');
    }

    const cityId = await this.citiesService.getOrCreateCity(city, regionId);

    if (!sidesInput || sidesInput.length < 2) {
      throw new BadRequestException('PROVIDE_AT_LEAST_2_SIDES');
    }
    const invalidSide = sidesInput.find(
      (side) =>
        !side?.name ||
        typeof side.name !== 'string' ||
        !side.name.trim() ||
        !Number.isInteger(side.sideCapacity) ||
        side.sideCapacity < 1,
    );
    if (invalidSide) {
      throw new BadRequestException(
        'EACH_SIDE_MUST_HAVE_A_NON_EMPTY_NAME_AND_SIDE_CAPACITY_AT_LEAST_1',
      );
    }
    const sidesToCreate = sidesInput;
    const maxParticipants = sidesToCreate.reduce(
      (sum, side) => sum + side.sideCapacity,
      0,
    );

    const createData: Prisma.EventCreateInput = {
      ...restData,
      address: typeof address === 'string' ? address.trim() : '',
      startDate: startDate instanceof Date ? startDate : new Date(startDate),
      gameStartDate:
        gameStartDate instanceof Date ? gameStartDate : new Date(gameStartDate),
      ...(endDate
        ? { endDate: endDate instanceof Date ? endDate : new Date(endDate) }
        : {}),
      ...(socialLinks && Object.keys(socialLinks).length > 0
        ? { socialLinks: socialLinks as object }
        : {}),
      maxParticipants,
      isActive: data.isActive ?? true,
      status: data.status ?? EventStatus.PENDING,
      application: { connect: { id: applicationId } },
      ratingGameType: { connect: { id: gameTypeId } },
      city: { connect: { id: cityId } },
      sides: {
        create: sidesToCreate.map((side, index) => ({
          name: side.name,
          orderIndex: index,
          sideCapacity: side.sideCapacity,
        })),
      },
    };

    const event = await this.prisma.event.create({
      data: createData,
      include: this.include,
    });

    return this.mapEvent(event);
  }

  async update(id: number, data: EventUpdateRequest): Promise<EventsResponse> {
    const exists = await this.prisma.event.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('EVENT_NOT_FOUND');

    const {
      city,
      regionId,
      startDate,
      gameStartDate,
      endDate,
      address,
      sides: sidesInput,
      socialLinks,
      maxParticipants: _maxParticipants,
      gameTypeId,
      ...restData
    } = data;

    if (sidesInput !== undefined) {
      const currentSides: Array<{ id: number; teamId: number | null }> =
        await this.prisma.eventSide.findMany({
          where: { eventId: id },
          select: { id: true, teamId: true },
        });
      const hasRegisteredTeam = currentSides.some(
        (eventSide) => eventSide.teamId != null,
      );
      if (hasRegisteredTeam) {
        throw new BadRequestException(
          'CANNOT_UPDATE_EVENT_SIDES_A_TEAM_IS_ALREADY_REGISTERED_ON_ONE_OF_THE_SIDES',
        );
      }
      if (sidesInput.length < 2) {
        throw new BadRequestException('PROVIDE_AT_LEAST_2_SIDES');
      }
      const invalidSide = sidesInput.find(
        (side) =>
          !side?.name ||
          typeof side.name !== 'string' ||
          !side.name.trim() ||
          !Number.isInteger(side.sideCapacity) ||
          side.sideCapacity < 1,
      );
      if (invalidSide) {
        throw new BadRequestException(
          'EACH_SIDE_MUST_HAVE_A_NON_EMPTY_NAME_AND_SIDE_CAPACITY_AT_LEAST_1',
        );
      }
    }

    const computedMaxParticipants = sidesInput?.reduce(
      (sum, side) => sum + side.sideCapacity,
      0,
    );

    const updateData: Prisma.EventUpdateInput = {
      ...restData,
      ...(address !== undefined ? { address: address.trim() } : {}),
      startDate: startDate
        ? startDate instanceof Date
          ? startDate
          : new Date(startDate)
        : undefined,
      gameStartDate: gameStartDate
        ? gameStartDate instanceof Date
          ? gameStartDate
          : new Date(gameStartDate)
        : undefined,
      endDate:
        endDate === ''
          ? null
          : endDate
            ? endDate instanceof Date
              ? endDate
              : new Date(endDate)
            : undefined,
      ...(socialLinks !== undefined
        ? {
            socialLinks:
              socialLinks && Object.keys(socialLinks).length > 0
                ? (socialLinks as object)
                : Prisma.DbNull,
          }
        : {}),
      ...(computedMaxParticipants !== undefined
        ? { maxParticipants: computedMaxParticipants }
        : {}),
    };

    if (city !== undefined) {
      const cityId = await this.citiesService.getOrCreateCity(
        city,
        regionId,
      );
      updateData.city = { connect: { id: cityId } };
    }
    if (gameTypeId !== undefined) {
      updateData.ratingGameType = { connect: { id: gameTypeId } };
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: updateData,
      include: this.include,
    });

    if (sidesInput !== undefined && sidesInput.length > 0) {
      await this.prisma.$transaction([
        this.prisma.eventSide.deleteMany({ where: { eventId: id } }),
        ...sidesInput.map((side, index) =>
          this.prisma.eventSide.create({
            data: {
              eventId: id,
              name: side.name,
              orderIndex: index,
              sideCapacity: side.sideCapacity,
            },
          }),
        ),
      ]);
      const eventWithSides = await this.prisma.event.findUnique({
        where: { id },
        include: this.include,
      });
      return eventWithSides
        ? this.mapEvent(eventWithSides)
        : this.mapEvent(updatedEvent);
    }

    return this.mapEvent(updatedEvent);
  }

  async updateStatus(
    id: number,
    status: EventStatus,
    statusReason?: string,
  ): Promise<EventsResponse> {
    const exists = await this.prisma.event.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('EVENT_NOT_FOUND');

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: {
        status,
        statusReason: statusReason?.trim() ? statusReason.trim() : null,
      },
      include: this.include,
    });

    return this.mapEvent(updatedEvent);
  }

  async countPending(): Promise<number> {
    return this.prisma.event.count({
      where: {
        status: EventStatus.PENDING,
      },
    });
  }

  async completeEvent(id: number): Promise<EventsResponse> {
    const exists = await this.prisma.event.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('EVENT_NOT_FOUND');

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
      include: this.include,
    });

    return this.mapEvent(updatedEvent);
  }

  async findByUserId(userId: number): Promise<EventsResponse[]> {
    const events = await this.prisma.event.findMany({
      where: {
        registrations: {
          some: {
            userId,
            status: EventRegistrationStatus.APPROVED,
          },
        },
      },
      orderBy: { gameStartDate: 'desc' },
      include: this.include,
    });

    return events.map((event) => this.mapEvent(event));
  }

  async delete(id: number): Promise<void> {
    const exists = await this.prisma.event.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('EVENT_NOT_FOUND');

    await this.prisma.event.delete({ where: { id } });
  }

  async setEventSideTeam(
    eventSideId: number,
    teamId: number | null,
  ): Promise<void> {
    await this.prisma.eventSide.update({
      where: { id: eventSideId },
      data: { teamId },
    });
  }
}
