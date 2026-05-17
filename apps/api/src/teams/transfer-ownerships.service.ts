import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AclService } from '../acl/acl.service';
import { TeamsDataService } from './teams-data.service';
import { TeamsNotificationService } from './teams-notification.service';
import { TeamsPermissionsService } from './teams-permissions.service';
import { TeamsService } from './teams.service';
import {
  TeamOwnershipTransferStatus,
  
  AclPermission,
} from '../generated/prisma-client';
import { PrismaService } from '../prisma/prisma.service';
import { TransferOwnershipsDataService } from './transfer-ownerships-data.service';
import { TeamOwnershipTransferRequest as TeamOwnershipTransferRequestResponse } from './interfaces';

@Injectable()
export class TransferOwnershipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly teamsDataService: TeamsDataService,
    private readonly teamsService: TeamsService,
    private readonly aclService: AclService,
    private readonly notificationService: TeamsNotificationService,
    private readonly permissionsService: TeamsPermissionsService,
    private readonly transferOwnershipDataService: TransferOwnershipsDataService,
  ) {}

  async getTransferRequests(
    userId: number,
    status?: string,
  ): Promise<TeamOwnershipTransferRequestResponse[]> {
    await this.expireStaleRequests();

    let parsedStatus: TeamOwnershipTransferStatus | undefined;

    if (status) {
      if (
        !Object.values(TeamOwnershipTransferStatus).includes(
          status as TeamOwnershipTransferStatus,
        )
      ) {
        throw new BadRequestException('INVALID_STATUS');
      }

      parsedStatus = status as TeamOwnershipTransferStatus;
    }

    return this.transferOwnershipDataService.findManyRequests({
      newOwnerId: userId,
      ...(parsedStatus ? { status: parsedStatus } : {}),
    });
  }

  async createTransferRequest(
    teamId: number,
    newOwnerId: number,
    userId: number,
    expiresInMinutes?: number,
  ): Promise<TeamOwnershipTransferRequestResponse> {
    await this.teamsService.get(teamId);
    await this.expireStaleRequests({ teamId });

    const isOwner = await this.permissionsService.isOwner(userId, teamId);

    if (!isOwner) {
      throw new BadRequestException('ONLY_TEAM_OWNER_CAN_INITIATE_TRANSFER');
    }

    const existingMember = await this.teamsDataService.findOneMember(
      teamId,
      newOwnerId,
    );

    if (!existingMember || existingMember.leftAt !== null) {
      throw new NotFoundException('USER_NOT_TEAM_MEMBER');
    }

    if (newOwnerId === userId) {
      throw new BadRequestException('CANNOT_TRANSFER_TO_YOURSELF');
    }

    const existingInvitation =
      await this.transferOwnershipDataService.findRequest({
        teamId,
        newOwnerId,
        status: TeamOwnershipTransferStatus.PENDING,
      });

    if (existingInvitation) {
      throw new BadRequestException('TRANSFER_REQUEST_ALREADY_EXISTS');
    }

    const existingPendingRequestForTeam =
      await this.transferOwnershipDataService.findPendingRequestByTeam(teamId);

    if (existingPendingRequestForTeam) {
      throw new ConflictException('TRANSFER_REQUEST_ALREADY_EXISTS_FOR_TEAM');
    }

    const existingRequest =
      await this.transferOwnershipDataService.findRequestByPair(
        teamId,
        newOwnerId,
      );

    if (typeof expiresInMinutes === 'number' && expiresInMinutes <= 0) {
      throw new BadRequestException('INVALID_EXPIRES_IN_MINUTES');
    }

    const expiresAt =
      typeof expiresInMinutes === 'number'
        ? new Date(Date.now() + expiresInMinutes * 60 * 1000)
        : undefined;

    const transferRequest = existingRequest
      ? await this.transferOwnershipDataService.reopenTransferRequest(
          teamId,
          newOwnerId,
          userId,
          expiresAt,
        )
      : await this.transferOwnershipDataService.createTransferRequest(
          teamId,
          newOwnerId,
          userId,
          expiresAt,
        );

    if (transferRequest) {
      await this.notificationService.notifyOwnershipTransferRequest(
        teamId,
        newOwnerId,
        userId,
      );
    }
    return transferRequest;
  }

  async transferOwnershipReject(
    teamId: number,
    wishfulNewOwnerId: number,
  ): Promise<TeamOwnershipTransferRequestResponse> {
    await this.teamsService.get(teamId);
    await this.expireStaleRequests({ teamId });

    const existingInvitation =
      await this.transferOwnershipDataService.findRequest({
        teamId,
        newOwnerId: wishfulNewOwnerId,
        status: TeamOwnershipTransferStatus.PENDING,
      });

    if (!existingInvitation) {
      throw new NotFoundException('TRANSFER_REQUEST_NOT_FOUND');
    }

    const transferRequest =
      await this.transferOwnershipDataService.updateRequestStatus(
        {
          teamId,
          newOwnerId: wishfulNewOwnerId,
          status: TeamOwnershipTransferStatus.PENDING,
        },
        {
          status: TeamOwnershipTransferStatus.REJECTED,
          respondedAt: new Date(),
        },
      );

    await this.notificationService.notifyOwnershipTransferRejected(
      teamId,
      wishfulNewOwnerId,
      existingInvitation.currentOwnerId,
    );

    return transferRequest;
  }

  async transferOwnershipAccept(
    teamId: number,
    newOwnerId: number,
  ): Promise<TeamOwnershipTransferRequestResponse> {
    await this.teamsService.get(teamId);
    await this.expireStaleRequests({ teamId });

    const existingInvitation =
      await this.transferOwnershipDataService.findRequest({
        teamId,
        newOwnerId,
        status: TeamOwnershipTransferStatus.PENDING,
      });

    if (!existingInvitation) {
      throw new NotFoundException('TRANSFER_REQUEST_NOT_FOUND');
    }

    if (
      existingInvitation.expiresAt &&
      new Date(existingInvitation.expiresAt) < new Date()
    ) {
      throw new BadRequestException('TRANSFER_REQUEST_EXPIRED');
    }

    const actualOwnerId = await this.permissionsService.getTeamOwnerId(teamId);
    if (actualOwnerId !== existingInvitation.currentOwnerId) {
      throw new ConflictException('TRANSFER_REQUEST_STALE');
    }

    let transferRequest: TeamOwnershipTransferRequestResponse;

    try {
      transferRequest = await this.transferOwnershipDataService.updateRequestStatus(
        {
          teamId,
          newOwnerId,
          status: TeamOwnershipTransferStatus.PENDING,
        },
        {
          status: TeamOwnershipTransferStatus.APPROVED,
          respondedAt: new Date(),
        },
      );
    } catch {
      throw new ConflictException('TRANSFER_REQUEST_NOT_PENDING');
    }

    await this.applyOwnershipTransfer(
      teamId,
      newOwnerId,
      existingInvitation.currentOwnerId,
    );
    await this.notificationService.notifyOwnershipTransferAccepted(
      teamId,
      existingInvitation.currentOwnerId,
      newOwnerId,
    );

    return transferRequest;
  }

  async transferOwnership(
    teamId: number,
    newOwnerId: number,
    ownerId: number,
  ): Promise<void> {
    const transferRequestApproved =
      await this.transferOwnershipDataService.findRequest({
        teamId,
        newOwnerId,
        status: TeamOwnershipTransferStatus.APPROVED,
      });
    if (transferRequestApproved) {
      await this.applyOwnershipTransfer(teamId, newOwnerId, ownerId);
    } else {
      throw new NotFoundException('TRANSFER_REQUEST_NOT_APPROVED');
    }
  }

  async adminReassignOwnership(
    teamId: number,
    newOwnerId: number,
    adminUserId: number,
  ): Promise<void> {
    await this.teamsService.get(teamId);

    const isAdmin = await this.permissionsService.isAdmin(adminUserId);
    if (!isAdmin) {
      throw new ForbiddenException('ACCESS_DENIED');
    }

    const currentOwnerId = await this.permissionsService.getTeamOwnerId(teamId);

    if (currentOwnerId === newOwnerId) {
      throw new ConflictException('USER_ALREADY_TEAM_OWNER');
    }

    const newOwnerMember = await this.teamsDataService.findOneMember(
      teamId,
      newOwnerId,
    );
    if (!newOwnerMember || newOwnerMember.leftAt !== null) {
      throw new NotFoundException('USER_NOT_TEAM_MEMBER');
    }

    await this.applyOwnershipTransfer(teamId, newOwnerId, currentOwnerId);

    await this.notificationService.notifyOwnershipReassignedByAdmin(
      teamId,
      currentOwnerId,
      newOwnerId,
      adminUserId,
    );
  }

  private async applyOwnershipTransfer(
    teamId: number,
    newOwnerId: number,
    ownerId: number,
  ): Promise<void> {
    const isOwner = await this.permissionsService.isOwner(ownerId, teamId);
    if (!isOwner) {
      throw new BadRequestException('USER_NOT_TEAM_OWNER');
    }

    const member = await this.teamsDataService.findOneMember(
      teamId,
      newOwnerId,
    );
    if (!member || member.leftAt !== null) {
      throw new NotFoundException('USER_NOT_TEAM_MEMBER');
    }

    const oldRoleNewOwner = await this.teamsService.getMemberRole(
      teamId,
      newOwnerId,
    );

    await this.prisma.$transaction(async (tx) => {
      const currentOwnerAcls = await this.aclService.get({
        permission: AclPermission.write,
        resource: `team/${teamId}/owner`,
      });

      for (const ownerAcl of currentOwnerAcls) {
        await this.aclService.revoke(
          ownerAcl.userId,
          AclPermission.write,
          `team/${teamId}/owner`,
          undefined,
        );
      }

      if (oldRoleNewOwner === 'assistant') {
        await this.aclService.revoke(
          newOwnerId,
          AclPermission.write,
          `team/${teamId}/assistant`,
          undefined,
        );
      } else if (oldRoleNewOwner === 'member') {
        await this.aclService.revoke(
          newOwnerId,
          AclPermission.read,
          `team/${teamId}/member`,
          undefined,
        );
      } else if (oldRoleNewOwner === 'staff') {
        const staffAcls = await this.aclService.get({
          userId: newOwnerId,
          resourcePrefix: `team/${teamId}/staff`,
        });
        for (const entry of staffAcls) {
          await this.aclService.revoke(
            newOwnerId,
            entry.permission,
            entry.resource,
            undefined,
          );
        }
      }

      await this.aclService.grant(
        newOwnerId,
        AclPermission.write,
        `team/${teamId}/owner`,
        undefined,
      );
      await this.aclService.grant(
        ownerId,
        AclPermission.read,
        `team/${teamId}/member`,
        undefined,
      );
    });
  }

  private async expireStaleRequests(params?: { teamId?: number }): Promise<void> {
    await this.transferOwnershipDataService.expireAndCollect(params);
  }
}
