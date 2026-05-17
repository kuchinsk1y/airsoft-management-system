import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma-client';
import { PrismaService } from '../prisma/prisma.service';
import {
  TeamMemberStatus,
  TeamsFilters,
  TeamsMemberResponse,
  TeamsRequest,
  TeamsResponse,
} from './interfaces';

@Injectable()
export class TeamsDataService {
  constructor(private prisma: PrismaService) {}

  async transaction<T>(
    callback: (tx: PrismaService) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(callback);
  }

  private collectUserIds(
    ownerId: number,
    assistants?: number[],
    members?: number[],
    staff?: Array<{ userId: number; role: string }>,
  ): Set<number> {
    const userIds = new Set<number>([ownerId]);
    if (assistants) assistants.forEach((id) => userIds.add(id));
    if (members) members.forEach((id) => userIds.add(id));
    if (staff) staff.forEach(({ userId }) => userIds.add(userId));
    return userIds;
  }

  async create(data: TeamsRequest, ownerId: number): Promise<TeamsResponse> {
    const ownerMember = {
      userId: ownerId,
      memberStatus: TeamMemberStatus.ACTIVE,
      joinedAt: new Date(),
    };

    const team = await this.prisma.team.create({
      data: {
        name: data.name,
        logoUrl: data.logoUrl,
        description: data.description,
        members: {
          create: [ownerMember],
        },
      },
      include: {
        members: {
          where: { leftAt: null },
          include: {
            user: {
              include: {
                playerStats: true,
              },
            },
          },
        },
      },
    });

    return team as TeamsResponse;
  }

  async findOne(
    id: number,
    options?: { onlyActiveMembers?: boolean },
  ): Promise<TeamsResponse | null> {
    const membersWhere: { leftAt: null; memberStatus?: TeamMemberStatus } = {
      leftAt: null,
    };

    if (options?.onlyActiveMembers) {
      membersWhere.memberStatus = TeamMemberStatus.ACTIVE;
    }

    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          where: membersWhere,
          include: {
            user: {
              include: {
                playerStats: true,
              },
            },
          },
        },
      },
    });

    if (!team) return null;

    return team as TeamsResponse;
  }

  async findMany(filters: TeamsFilters = {}): Promise<TeamsResponse[]> {
    if (filters.userId !== undefined) {
      const teamMembers = await this.prisma.teamMember.findMany({
        where: {
          userId: filters.userId,
          leftAt: null,
          memberStatus: TeamMemberStatus.ACTIVE,
        },
        include: {
          team: {
            include: {
              members: {
                where: { leftAt: null },
                include: {
                  user: {
                    include: {
                      playerStats: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
      });

      return teamMembers.map((teamMember) => ({
        ...teamMember.team,
        members: teamMember.team.members,
      })) as TeamsResponse[];
    }

    const where: Prisma.TeamWhereInput = {};

    if (filters.searchQuery) {
      where.name = { contains: filters.searchQuery };
    }

    const teams = await this.prisma.team.findMany({
      where,
      include: {
        members: {
          where: { leftAt: null },
          include: {
            user: {
              include: {
                playerStats: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return teams as TeamsResponse[];
  }

  async update(
    id: number,
    data: {
      name?: string;
      logoUrl?: string;
      description?: string;
      assistants?: number[];
      members?: number[];
      staff?: Array<{ userId: number; role: string }>;
    },
    ownerId: number,
  ): Promise<TeamsResponse> {
    const { assistants, members, staff, ...teamData } = data;

    await this.prisma.team.update({
      where: { id },
      data: teamData,
    });

    if (
      assistants !== undefined ||
      members !== undefined ||
      staff !== undefined
    ) {
      const newUserIds = this.collectUserIds(
        ownerId,
        assistants,
        members,
        staff,
      );

      const currentMembers = await this.prisma.teamMember.findMany({
        where: { teamId: id, leftAt: null },
        select: { userId: true },
      });
      const currentUserIds = new Set(
        currentMembers.map((member) => member.userId),
      );

      const toRemove = Array.from(currentUserIds).filter(
        (userId) => userId !== ownerId && !newUserIds.has(userId),
      );

      if (toRemove.length > 0) {
        await this.prisma.teamMember.updateMany({
          where: {
            teamId: id,
            userId: { in: toRemove },
            leftAt: null,
          },
          data: {
            leftAt: new Date(),
            memberStatus: TeamMemberStatus.LEFT,
          },
        });
      }
    }

    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          where: { leftAt: null },
          include: {
            user: {
              include: {
                playerStats: true,
              },
            },
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException('TEAM_NOT_FOUND');
    }

    return team as TeamsResponse;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.team.delete({
      where: { id },
    });
  }

  async addTeamMember(data: {
    teamId: number;
    userId: number;
    memberStatus: TeamMemberStatus;
    joinedAt: Date;
  }): Promise<void> {
    await this.prisma.teamMember.create({ data });
  }

  async findOneMember(
    teamId: number,
    userId: number,
  ): Promise<{ id: number; leftAt: Date | null } | null> {
    return this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
      select: {
        id: true,
        leftAt: true,
      },
    });
  }

  async findManyMembers(
    teamId: number,
    options?: { onlyLeftMembers?: boolean },
  ): Promise<TeamsMemberResponse[]> {
    const where: Prisma.TeamMemberWhereInput = {
      teamId,
    };

    if (options?.onlyLeftMembers) {
      where.leftAt = { not: null };
      where.memberStatus = TeamMemberStatus.LEFT;
    } else {
      where.leftAt = null;
    }

    const findManyOptions: Prisma.TeamMemberFindManyArgs = {
      where,
      include: {
        user: {
          include: {
            playerStats: true,
          },
        },
      },
    };

    if (options?.onlyLeftMembers) {
      findManyOptions.orderBy = { leftAt: 'desc' };
    }

    const members = await this.prisma.teamMember.findMany(findManyOptions);

    return members as unknown as TeamsMemberResponse[];
  }

  async updateMember(
    teamId: number,
    userId: number | undefined,
    data: {
      memberStatus: TeamMemberStatus;
      joinedAt: Date;
      leftAt?: null;
    },
  ): Promise<void> {
    if (userId === undefined) {
      await this.prisma.teamMember.updateMany({
        where: {
          teamId,
          memberStatus: TeamMemberStatus.PENDING,
          leftAt: null,
        },
        data,
      });
      return;
    }

    await this.prisma.teamMember.update({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
      data,
    });
  }

  async updateMembersByUserIds(
    teamId: number,
    userIds: number[],
    data: {
      memberStatus: TeamMemberStatus;
      joinedAt: Date;
      leftAt?: null;
    },
  ): Promise<void> {
    if (userIds.length === 0) {
      return;
    }

    await this.prisma.teamMember.updateMany({
      where: {
        teamId,
        userId: { in: userIds },
        leftAt: null,
      },
      data,
    });
  }

  async leaveTeam(teamId: number, userId: number): Promise<void> {
    await this.prisma.teamMember.updateMany({
      where: {
        teamId,
        userId,
        leftAt: null,
      },
      data: {
        leftAt: new Date(),
        memberStatus: TeamMemberStatus.LEFT,
      },
    });
  }
}
