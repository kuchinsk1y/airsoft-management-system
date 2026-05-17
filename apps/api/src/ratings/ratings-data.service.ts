/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  EventResultStatus,
  Prisma,
  RatingEntrySubjectType,
  RatingOutcome,
} from '../generated/prisma-client';
import { EventResultRequest } from './interfaces';

@Injectable()
export class RatingsDataService {
  constructor(private readonly prisma: PrismaService) {}

  // Event Results
  async createEventResult(data: EventResultRequest) {
    return this.prisma.eventResult.create({
      data: {
        eventId: data.eventId,
        userId: data.userId,
        teamId: data.teamId,
        placement: data.placement,
        points: data.points ?? 0,
        kills: data.kills,
        deaths: data.deaths,
        accuracy: data.accuracy ? new Prisma.Decimal(data.accuracy) : null,
        status: EventResultStatus.PENDING,
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            competitionType: true,
          },
        },
        user: {
          select: {
            id: true,
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
    });
  }

  async findEventResultById(id: number) {
    return this.prisma.eventResult.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            competitionType: true,
          },
        },
        user: {
          select: {
            id: true,
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
    });
  }

  async findEventResultsByEventId(eventId: number) {
    return this.prisma.eventResult.findMany({
      where: { eventId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            competitionType: true,
          },
        },
        user: {
          select: {
            id: true,
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
      orderBy: [{ placement: 'asc' }, { points: 'desc' }],
    });
  }

  async findEventResultByEventAndUser(eventId: number, userId: number) {
    return this.prisma.eventResult.findFirst({
      where: {
        eventId,
        userId,
      },
    });
  }

  async findEventResultByEventAndTeam(eventId: number, teamId: number) {
    return this.prisma.eventResult.findFirst({
      where: {
        eventId,
        teamId,
        userId: null,
      },
    });
  }

  async updateEventResult(
    id: number,
    data: Partial<EventResultRequest> & {
      status?: EventResultStatus;
      confirmedBy?: number;
    },
  ) {
    return this.prisma.eventResult.update({
      where: { id },
      data: {
        ...(data.placement && { placement: data.placement }),
        ...(data.points !== undefined && { points: data.points }),
        ...(data.kills !== undefined && { kills: data.kills }),
        ...(data.deaths !== undefined && { deaths: data.deaths }),
        ...(data.accuracy !== undefined && {
          accuracy: data.accuracy ? new Prisma.Decimal(data.accuracy) : null,
        }),
        ...(data.status && { status: data.status }),
        ...(data.status === EventResultStatus.CONFIRMED && {
          confirmedAt: new Date(),
          confirmedBy: data.confirmedBy,
        }),
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            competitionType: true,
          },
        },
        user: {
          select: {
            id: true,
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
    });
  }

  async deleteEventResult(id: number) {
    return this.prisma.eventResult.delete({
      where: { id },
    });
  }

  // Player Stats
  async findOrCreatePlayerStats(userId: number) {
    const stats = await this.prisma.playerStats.findUnique({
      where: { userId },
    });

    if (stats) {
      return stats;
    }

    return this.prisma.playerStats.create({
      data: { userId },
    });
  }

  async updatePlayerStats(
    userId: number,
    data: {
      gamesPlayed?: number;
      wins?: number;
      losses?: number;
      draws?: number;
      points?: number;
      totalPoints?: number;
      averagePoints?: number;
      accuracy?: number;
      kdRatio?: number;
      winRate?: number;
      rank?: number;
      previousRank?: number;
    },
  ) {
    const updateData: any = {};

    if (data.gamesPlayed !== undefined)
      updateData.gamesPlayed = data.gamesPlayed;
    if (data.wins !== undefined) updateData.wins = data.wins;
    if (data.losses !== undefined) updateData.losses = data.losses;
    if (data.draws !== undefined) updateData.draws = data.draws;
    if (data.points !== undefined) updateData.points = data.points;
    if (data.totalPoints !== undefined)
      updateData.totalPoints = data.totalPoints;
    if (data.averagePoints !== undefined) {
      updateData.averagePoints = new Prisma.Decimal(data.averagePoints);
    }
    if (data.accuracy !== undefined) {
      updateData.accuracy = data.accuracy
        ? new Prisma.Decimal(data.accuracy)
        : null;
    }
    if (data.kdRatio !== undefined) {
      updateData.kdRatio = data.kdRatio
        ? new Prisma.Decimal(data.kdRatio)
        : null;
    }
    if (data.winRate !== undefined) {
      updateData.winRate = data.winRate
        ? new Prisma.Decimal(data.winRate)
        : null;
    }
    if (data.rank !== undefined) updateData.rank = data.rank;
    if (data.previousRank !== undefined)
      updateData.previousRank = data.previousRank;

    return this.prisma.playerStats.upsert({
      where: { userId },
      create: {
        userId,
        ...updateData,
      },
      update: updateData,
    });
  }

  async getPlayerStatsWithUser(userId: number) {
    return this.prisma.playerStats.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            nickName: true,
            logoUrl: true,
          },
        },
      },
    });
  }

  async getPlayerLeaderboard(
    sortBy: string = 'totalPoints',
    order: 'asc' | 'desc' = 'desc',
    limit: number = 50,
    offset: number = 0,
    searchQuery?: string,
  ) {
    const orderBy: any = {};
    orderBy[sortBy] = order;

    const [items, total] = await Promise.all([
      this.prisma.playerStats.findMany({
        where: searchQuery
          ? {
              user: {
                nickName: {
                  startsWith: searchQuery,
                  mode: 'insensitive',
                },
              },
            }
          : undefined,
        orderBy,
        take: limit,
        skip: offset,
        include: {
          user: {
            select: {
              id: true,
              nickName: true,
              logoUrl: true,
            },
          },
        },
      }),
      this.prisma.playerStats.count({
        where: searchQuery
          ? {
              user: {
                nickName: { startsWith: searchQuery, mode: 'insensitive' },
              },
            }
          : undefined,
      }),
    ]);

    return { items, total };
  }

  // Team Stats
  async findOrCreateTeamStats(teamId: number) {
    const stats = await this.prisma.teamStats.findUnique({
      where: { teamId },
    });

    if (stats) {
      return stats;
    }

    return this.prisma.teamStats.create({
      data: { teamId },
    });
  }

  async updateTeamStats(
    teamId: number,
    data: {
      gamesPlayed?: number;
      wins?: number;
      totalPoints?: number;
      averagePoints?: number;
      winRate?: number;
      rank?: number;
    },
  ) {
    const updateData: any = {};

    if (data.gamesPlayed !== undefined)
      updateData.gamesPlayed = data.gamesPlayed;
    if (data.wins !== undefined) updateData.wins = data.wins;
    if (data.totalPoints !== undefined)
      updateData.totalPoints = data.totalPoints;
    if (data.averagePoints !== undefined) {
      updateData.averagePoints = new Prisma.Decimal(data.averagePoints);
    }
    if (data.winRate !== undefined) {
      updateData.winRate = data.winRate
        ? new Prisma.Decimal(data.winRate)
        : null;
    }
    if (data.rank !== undefined) updateData.rank = data.rank;

    return this.prisma.teamStats.upsert({
      where: { teamId },
      create: {
        teamId,
        ...updateData,
      },
      update: updateData,
    });
  }

  async getTeamStatsWithTeam(teamId: number) {
    return this.prisma.teamStats.findUnique({
      where: { teamId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            members: {
              where: {
                memberStatus: 'ACTIVE',
              },
              select: {
                id: true,
              },
            },
          },
        },
      },
    });
  }

  async getTeamLeaderboard(
    sortBy: string = 'totalPoints',
    order: 'asc' | 'desc' = 'desc',
    limit: number = 50,
    offset: number = 0,
    searchQuery?: string,
  ) {
    const orderBy: any = {};
    orderBy[sortBy] = order;

    const [items, total] = await Promise.all([
      this.prisma.teamStats.findMany({
        where: searchQuery
          ? {
              team: { name: { startsWith: searchQuery, mode: 'insensitive' } },
            }
          : undefined,
        orderBy,
        take: limit,
        skip: offset,
        include: {
          team: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
              members: {
                where: {
                  memberStatus: 'ACTIVE',
                },
                select: {
                  id: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.teamStats.count({
        where: searchQuery
          ? {
              team: { name: { startsWith: searchQuery, mode: 'insensitive' } },
            }
          : undefined,
      }),
    ]);

    return { items, total };
  }

  async getEventForRatingCompletion(eventId: number) {
    return this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        application: {
          include: {
            owner: {
              select: {
                id: true,
                nickName: true,
                logoUrl: true,
              },
            },
          },
        },
        sides: {
          select: {
            id: true,
            teamId: true,
          },
        },
      },
    });
  }

  async getApprovedRegistrations(eventId: number) {
    return this.prisma.eventRegistration.findMany({
      where: {
        eventId,
        status: 'APPROVED',
      },
      select: {
        userId: true,
        teamId: true,
        eventSideId: true,
      },
    });
  }

  async getApprovedRegistrationsWithDetails(eventId: number) {
    return this.prisma.eventRegistration.findMany({
      where: {
        eventId,
        status: 'APPROVED',
      },
      select: {
        userId: true,
        teamId: true,
        eventSideId: true,
        user: {
          select: {
            id: true,
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
    });
  }

  async getRatingGameTypeById(id: number) {
    return this.prisma.ratingGameType.findUnique({
      where: { id },
    });
  }

  async getEventRatingOutcomes(eventId: number) {
    const config = await this.prisma.eventRatingConfig.findUnique({
      where: { eventId },
      select: {
        outcomes: {
          select: {
            sideId: true,
            teamId: true,
            outcome: true,
          },
        },
      },
    });

    return config?.outcomes ?? [];
  }

  async getEventRatingConfig(eventId: number) {
    return this.prisma.eventRatingConfig.findUnique({
      where: { eventId },
      select: {
        id: true,
        isApplied: true,
        gameType: {
          select: {
            playerPoints: true,
            teamWinPoints: true,
            teamParticipatedPoints: true,
          },
        },
      },
    });
  }

  async getActiveRatingGameTypes() {
    const existing = await this.prisma.ratingGameType.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        id: 'asc',
      },
    });
    if (existing.length > 0) {
      return existing;
    }

    const defaults: Array<{
      name: string;
      playerPoints: number;
      teamWinPoints: number;
      teamParticipatedPoints: number;
      organizerPointsPerParticipant: number;
    }> = [
      {
        name: 'Тренування',
        playerPoints: 2,
        teamWinPoints: 20,
        teamParticipatedPoints: 10,
        organizerPointsPerParticipant: 2,
      },
      {
        name: 'CQB',
        playerPoints: 4,
        teamWinPoints: 40,
        teamParticipatedPoints: 20,
        organizerPointsPerParticipant: 4,
      },
      {
        name: 'Скілсофт',
        playerPoints: 4,
        teamWinPoints: 40,
        teamParticipatedPoints: 20,
        organizerPointsPerParticipant: 4,
      },
      {
        name: 'Гра вихідного дня',
        playerPoints: 6,
        teamWinPoints: 60,
        teamParticipatedPoints: 30,
        organizerPointsPerParticipant: 6,
      },
      {
        name: 'Рольова гра',
        playerPoints: 8,
        teamWinPoints: 80,
        teamParticipatedPoints: 40,
        organizerPointsPerParticipant: 8,
      },
      {
        name: 'Реконструкція',
        playerPoints: 10,
        teamWinPoints: 100,
        teamParticipatedPoints: 50,
        organizerPointsPerParticipant: 10,
      },
      {
        name: 'Змагання',
        playerPoints: 10,
        teamWinPoints: 100,
        teamParticipatedPoints: 50,
        organizerPointsPerParticipant: 10,
      },
      {
        name: 'Вишкiл',
        playerPoints: 12,
        teamWinPoints: 120,
        teamParticipatedPoints: 60,
        organizerPointsPerParticipant: 12,
      },
      {
        name: 'Сучасний MilSim',
        playerPoints: 12,
        teamWinPoints: 120,
        teamParticipatedPoints: 60,
        organizerPointsPerParticipant: 12,
      },
    ];

    await this.prisma.ratingGameType.createMany({
      data: defaults,
    });

    return this.prisma.ratingGameType.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
    });
  }

  async getAllRatingGameTypes() {
    return this.prisma.ratingGameType.findMany({
      orderBy: [{ isActive: 'desc' }, { id: 'asc' }],
    });
  }

  async createRatingGameType(data: {
    name: string;
    playerPoints: number;
    teamWinPoints: number;
    teamParticipatedPoints: number;
    organizerPointsPerParticipant: number;
    isActive?: boolean;
  }) {
    return this.prisma.ratingGameType.create({
      data: {
        name: data.name.trim(),
        playerPoints: data.playerPoints,
        teamWinPoints: data.teamWinPoints,
        teamParticipatedPoints: data.teamParticipatedPoints,
        organizerPointsPerParticipant: data.organizerPointsPerParticipant,
        isActive: data.isActive ?? true,
      },
    });
  }

  async createEventRatingConfig(params: {
    eventId: number;
    gameTypeId: number;
    actualParticipants: number;
    outcomes: Array<{
      sideId?: number;
      teamId?: number;
      outcome: RatingOutcome;
    }>;
  }) {
    return this.prisma.eventRatingConfig.create({
      data: {
        eventId: params.eventId,
        gameTypeId: params.gameTypeId,
        actualParticipants: params.actualParticipants,
        isApplied: true,
        appliedAt: new Date(),
        outcomes: {
          create: params.outcomes.map((outcome) => ({
            sideId: outcome.sideId,
            teamId: outcome.teamId,
            outcome: outcome.outcome,
          })),
        },
      },
      include: {
        gameType: true,
        outcomes: true,
      },
    });
  }

  async hasAppliedRatingConfig(eventId: number): Promise<boolean> {
    const config = await this.prisma.eventRatingConfig.findUnique({
      where: { eventId },
      select: { isApplied: true },
    });
    return config?.isApplied === true;
  }

  async createRatingEntries(
    entries: Array<{
      eventId: number;
      subjectType: RatingEntrySubjectType;
      userId?: number;
      teamId?: number;
      organizerUserId?: number;
      points: number;
      gamesDelta?: number;
      winsDelta?: number;
    }>,
  ) {
    if (entries.length === 0) return;
    await this.prisma.ratingEntry.createMany({
      data: entries,
    });
  }

  async findOrCreateOrganizerStats(userId: number) {
    const stats = await this.prisma.organizerStats.findUnique({
      where: { userId },
    });
    if (stats) return stats;
    return this.prisma.organizerStats.create({
      data: { userId },
    });
  }

  async updateOrganizerStats(
    userId: number,
    data: {
      gamesOrganized?: number;
      totalPoints?: number;
      averagePoints?: number;
      rank?: number;
    },
  ) {
    const updateData: any = {};
    if (data.gamesOrganized !== undefined) {
      updateData.gamesOrganized = data.gamesOrganized;
    }
    if (data.totalPoints !== undefined) {
      updateData.totalPoints = data.totalPoints;
    }
    if (data.averagePoints !== undefined) {
      updateData.averagePoints = new Prisma.Decimal(data.averagePoints);
    }
    if (data.rank !== undefined) {
      updateData.rank = data.rank;
    }

    return this.prisma.organizerStats.upsert({
      where: { userId },
      create: {
        userId,
        ...updateData,
      },
      update: updateData,
    });
  }

  async getOrganizerStatsWithUser(userId: number) {
    return this.prisma.organizerStats.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            nickName: true,
            logoUrl: true,
          },
        },
      },
    });
  }

  async getOrganizerLeaderboard(
    sortBy: string = 'totalPoints',
    order: 'asc' | 'desc' = 'desc',
    limit: number = 50,
    offset: number = 0,
    searchQuery?: string,
  ) {
    const orderBy: any = {};
    orderBy[sortBy] = order;

    const [items, total] = await Promise.all([
      this.prisma.organizerStats.findMany({
        where: searchQuery
          ? {
              user: {
                nickName: {
                  startsWith: searchQuery,
                  mode: 'insensitive',
                },
              },
            }
          : undefined,
        orderBy,
        take: limit,
        skip: offset,
        include: {
          user: {
            select: {
              id: true,
              nickName: true,
              logoUrl: true,
            },
          },
        },
      }),
      this.prisma.organizerStats.count({
        where: searchQuery
          ? {
              user: {
                nickName: {
                  startsWith: searchQuery,
                  mode: 'insensitive',
                },
              },
            }
          : undefined,
      }),
    ]);

    return { items, total };
  }
}
