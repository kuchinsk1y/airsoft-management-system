import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TeamsJoinRequestResponse, TeamsJoinRequestStatus } from './interfaces';

@Injectable()
export class TeamsJoinRequestDataService {
  constructor(private prisma: PrismaService) {}

  private readonly joinRequestInclude = {
    user: {
      include: {
        playerStats: true,
      },
    },
  };

  async createJoinRequest(
    teamId: number,
    userId: number,
  ): Promise<TeamsJoinRequestResponse> {
    const existing = await this.prisma.teamsJoinRequest.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
      include: this.joinRequestInclude,
    });

    const joinRequest = existing
      ? await this.prisma.teamsJoinRequest.update({
          where: { id: existing.id },
          data: {
            status: TeamsJoinRequestStatus.PENDING,
            reviewedAt: null,
            reviewedBy: null,
          },
          include: this.joinRequestInclude,
        })
      : await this.prisma.teamsJoinRequest.create({
          data: {
            teamId,
            userId,
            status: TeamsJoinRequestStatus.PENDING,
          },
          include: this.joinRequestInclude,
        });

    return this.formatJoinRequestResponse(joinRequest);
  }

  async getJoinRequests(
    teamId: number,
    status?: TeamsJoinRequestStatus,
    joinRequestId?: number,
    userId?: number,
  ): Promise<TeamsJoinRequestResponse | TeamsJoinRequestResponse[] | null> {
    if (joinRequestId !== undefined) {
      const joinRequest = await this.prisma.teamsJoinRequest.findUnique({
        where: { id: joinRequestId },
        include: this.joinRequestInclude,
      });

      if (!joinRequest || joinRequest.teamId !== teamId) return null;

      return this.formatJoinRequestResponse(joinRequest);
    }

    if (userId !== undefined) {
      const joinRequest = await this.prisma.teamsJoinRequest.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId,
          },
        },
        include: this.joinRequestInclude,
      });

      if (!joinRequest) return null;

      return this.formatJoinRequestResponse(joinRequest);
    }

    const where: {
      teamId: number;
      status?: TeamsJoinRequestStatus;
    } = { teamId };
    if (status) {
      where.status = status;
    }

    const joinRequests = await this.prisma.teamsJoinRequest.findMany({
      where,
      include: this.joinRequestInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return joinRequests as TeamsJoinRequestResponse[];
  }

  async updateJoinRequestStatus(
    joinRequestId: number,
    status: TeamsJoinRequestStatus,
    reviewedBy: number,
  ): Promise<TeamsJoinRequestResponse> {
    const joinRequest = await this.prisma.teamsJoinRequest.update({
      where: { id: joinRequestId },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy,
      },
      include: this.joinRequestInclude,
    });

    return this.formatJoinRequestResponse(joinRequest);
  }

  private formatJoinRequestResponse(
    joinRequest: unknown,
  ): TeamsJoinRequestResponse {
    const request = joinRequest as {
      user?: { playerStats?: unknown } | null;
      [key: string]: unknown;
    };
    return {
      ...(request as Record<string, unknown>),
      playerStats: request.user?.playerStats || undefined,
    } as TeamsJoinRequestResponse;
  }
}
