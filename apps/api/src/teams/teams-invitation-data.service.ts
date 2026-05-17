import { BadRequestException, Injectable } from '@nestjs/common';
import { TeamInvitationStatus } from '../generated/prisma-client';
import { PrismaService } from '../prisma/prisma.service';
import { TeamInvitationResponse } from './interfaces';

@Injectable()
export class TeamsInvitationDataService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly invitationInclude = {
    team: {
      select: {
        id: true,
        name: true,
        logoUrl: true,
      },
    },
    inviter: {
      select: {
        id: true,
        nickName: true,
        fullName: true,
      },
    },
    invitee: {
      select: {
        id: true,
        nickName: true,
        fullName: true,
      },
    },
  };

  async create(
    teamId: number,
    inviterId: number,
    inviteeId: number,
    expiresAt?: Date,
  ): Promise<TeamInvitationResponse> {
    if (expiresAt && expiresAt < new Date()) {
      throw new BadRequestException('EXPIRES_AT_CANNOT_BE_IN_PAST');
    }

    const existing = await this.prisma.teamInvitation.findUnique({
      where: {
        teamId_inviteeId: {
          teamId,
          inviteeId,
        },
      },
      include: this.invitationInclude,
    });

    if (existing?.status === TeamInvitationStatus.PENDING) {
      throw new BadRequestException('INVITATION_ALREADY_EXISTS');
    }

    const invitation = existing
      ? await this.prisma.teamInvitation.update({
          where: { id: existing.id },
          data: {
            inviterId,
            status: TeamInvitationStatus.PENDING,
            respondedAt: null,
            expiresAt,
          },
          include: this.invitationInclude,
        })
      : await this.prisma.teamInvitation.create({
          data: {
            teamId,
            inviterId,
            inviteeId,
            status: TeamInvitationStatus.PENDING,
            expiresAt,
          },
          include: this.invitationInclude,
        });

    return invitation as TeamInvitationResponse;
  }

  async findOne(
    invitationId: number,
    inviteeId?: number,
  ): Promise<TeamInvitationResponse | null> {
    const invitation = await this.prisma.teamInvitation.findUnique({
      where: { id: invitationId },
      include: this.invitationInclude,
    });

    if (!invitation) {
      return null;
    }

    if (inviteeId && invitation.inviteeId !== inviteeId) {
      return null;
    }

    return invitation as TeamInvitationResponse;
  }

  async findMany(filters: {
    teamId?: number;
    inviteeId?: number;
    inviterId?: number;
    status?: TeamInvitationStatus;
  }): Promise<TeamInvitationResponse[]> {
    const invitations = await this.prisma.teamInvitation.findMany({
      where: {
        ...(filters.teamId ? { teamId: filters.teamId } : {}),
        ...(filters.inviteeId ? { inviteeId: filters.inviteeId } : {}),
        ...(filters.inviterId ? { inviterId: filters.inviterId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      include: this.invitationInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return invitations as TeamInvitationResponse[];
  }

  async countPendingByInvitee(inviteeId: number): Promise<number> {
    return this.prisma.teamInvitation.count({
      where: {
        inviteeId,
        status: TeamInvitationStatus.PENDING,
      },
    });
  }

  async update(
    invitationId: number,
    status: TeamInvitationStatus,
  ): Promise<TeamInvitationResponse> {
    const invitation = await this.prisma.teamInvitation.update({
      where: { id: invitationId },
      data: {
        status,
        respondedAt: new Date(),
      },
      include: this.invitationInclude,
    });

    return invitation as TeamInvitationResponse;
  }

  async delete(invitationId: number): Promise<void> {
    await this.prisma.teamInvitation.delete({
      where: { id: invitationId },
    });
  }

  async expire(): Promise<number> {
    const result = await this.prisma.teamInvitation.updateMany({
      where: {
        status: TeamInvitationStatus.PENDING,
        expiresAt: {
          lte: new Date(),
        },
      },
      data: {
        status: TeamInvitationStatus.EXPIRED,
      },
    });

    return result.count;
  }
}
