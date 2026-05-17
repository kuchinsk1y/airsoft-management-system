import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  TeamOwnershipTransferRequest,
  TeamOwnershipTransferStatus,
} from '../generated/prisma-client';
import { TeamOwnershipTransferRequest as TeamOwnershipTransferRequestResponse } from './interfaces';

@Injectable()
export class TransferOwnershipsDataService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly transferInclude = {
    team: {
      select: {
        id: true,
        name: true,
        logoUrl: true,
      },
    },
    currentOwner: {
      select: {
        id: true,
        nickName: true,
        fullName: true,
        email: true,
      },
    },
    newOwner: {
      select: {
        id: true,
        nickName: true,
        fullName: true,
        email: true,
      },
    },
  };

  async createTransferRequest(
    teamId: number,
    newOwnerId: number,
    currentOwnerId: number,
    expiresAt?: Date,
  ): Promise<TeamOwnershipTransferRequestResponse> {
    return this.prisma.teamOwnershipTransferRequest.create({
      data: {
        teamId,
        newOwnerId,
        currentOwnerId,
        expiresAt,
      },
      include: this.transferInclude,
    }) as Promise<TeamOwnershipTransferRequestResponse>;
  }

  async findRequest(params: {
    teamId: number;
    newOwnerId: number;
    status: TeamOwnershipTransferStatus;
  }): Promise<TeamOwnershipTransferRequest | null> {
    return await this.prisma.teamOwnershipTransferRequest.findUnique({
      where: {
        teamId_newOwnerId: {
          teamId: params.teamId,
          newOwnerId: params.newOwnerId,
        },
        status: params.status,
      },
    });
  }

  async findRequestByPair(
    teamId: number,
    newOwnerId: number,
  ): Promise<TeamOwnershipTransferRequest | null> {
    return this.prisma.teamOwnershipTransferRequest.findUnique({
      where: {
        teamId_newOwnerId: {
          teamId,
          newOwnerId,
        },
      },
    });
  }

  async findManyRequests(filters: {
    teamId?: number;
    currentOwnerId?: number;
    newOwnerId?: number;
    status?: TeamOwnershipTransferStatus;
  }): Promise<TeamOwnershipTransferRequestResponse[]> {
    const requests = await this.prisma.teamOwnershipTransferRequest.findMany({
      where: {
        ...(typeof filters.teamId === 'number'
          ? { teamId: filters.teamId }
          : {}),
        ...(typeof filters.currentOwnerId === 'number'
          ? { currentOwnerId: filters.currentOwnerId }
          : {}),
        ...(typeof filters.newOwnerId === 'number'
          ? { newOwnerId: filters.newOwnerId }
          : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      include: this.transferInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return requests as TeamOwnershipTransferRequestResponse[];
  }

  async findPendingRequestByTeam(
    teamId: number,
  ): Promise<TeamOwnershipTransferRequest | null> {
    return this.prisma.teamOwnershipTransferRequest.findFirst({
      where: {
        teamId,
        status: TeamOwnershipTransferStatus.PENDING,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateRequestStatus(
    params: {
      teamId: number;
      newOwnerId: number;
      status: TeamOwnershipTransferStatus;
    },
    updateData: {
      status: TeamOwnershipTransferStatus;
      respondedAt?: Date | null;
    },
  ): Promise<TeamOwnershipTransferRequestResponse> {
    return this.prisma.teamOwnershipTransferRequest.update({
      where: {
        teamId_newOwnerId: {
          teamId: params.teamId,
          newOwnerId: params.newOwnerId,
        },
        status: params.status,
      },
      data: updateData,
      include: this.transferInclude,
    }) as Promise<TeamOwnershipTransferRequestResponse>;
  }

  async reopenTransferRequest(
    teamId: number,
    newOwnerId: number,
    currentOwnerId: number,
    expiresAt?: Date,
  ): Promise<TeamOwnershipTransferRequestResponse> {
    return this.prisma.teamOwnershipTransferRequest.update({
      where: {
        teamId_newOwnerId: {
          teamId,
          newOwnerId,
        },
      },
      data: {
        currentOwnerId,
        status: TeamOwnershipTransferStatus.PENDING,
        createdAt: new Date(),
        respondedAt: null,
        expiresAt,
      },
      include: this.transferInclude,
    }) as Promise<TeamOwnershipTransferRequestResponse>;
  }

  async expireAndCollect(params?: {
    teamId?: number;
  }): Promise<TeamOwnershipTransferRequest[]> {
    return this.prisma.$transaction(async (tx) => {
      const respondedAt = new Date();

      const expiredCandidates = await tx.teamOwnershipTransferRequest.findMany({
        where: {
          status: TeamOwnershipTransferStatus.PENDING,
          expiresAt: {
            lte: new Date(),
          },
          ...(typeof params?.teamId === 'number' ? { teamId: params.teamId } : {}),
        },
      });

      if (!expiredCandidates.length) {
        return [];
      }

      await tx.teamOwnershipTransferRequest.updateMany({
        where: {
          id: {
            in: expiredCandidates.map((item) => item.id),
          },
          status: TeamOwnershipTransferStatus.PENDING,
        },
        data: {
          status: TeamOwnershipTransferStatus.EXPIRED,
          respondedAt,
        },
      });

      return tx.teamOwnershipTransferRequest.findMany({
        where: {
          id: {
            in: expiredCandidates.map((item) => item.id),
          },
          status: TeamOwnershipTransferStatus.EXPIRED,
          respondedAt,
        },
      });
    });
  }
}
