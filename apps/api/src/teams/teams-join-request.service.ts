import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AclService } from '../acl/acl.service';
import { EventsRegistrationService } from '../events/events-registration.service';
import { AclPermission } from '../generated/prisma-client';
import {
  TeamMemberStatus,
  TeamsJoinRequestResponse,
  TeamsJoinRequestStatus,
} from './interfaces';
import { TeamsDataService } from './teams-data.service';
import { TeamsJoinRequestDataService } from './teams-join-request-data.service';
import { TeamsNotificationService } from './teams-notification.service';
import { TeamsPermissionsService } from './teams-permissions.service';
import { TeamsService } from './teams.service';

@Injectable()
export class TeamsJoinRequestService {
  private readonly logger = new Logger(TeamsJoinRequestService.name);

  constructor(
    private readonly teamsDataService: TeamsDataService,
    private readonly joinRequestDataService: TeamsJoinRequestDataService,
    private readonly teamsService: TeamsService,
    private readonly aclService: AclService,
    private readonly eventsRegistrationService: EventsRegistrationService,
    private readonly permissionsService: TeamsPermissionsService,
    private readonly notificationService: TeamsNotificationService,
  ) {}

  async createJoinRequest(
    teamId: number,
    userId: number,
  ): Promise<TeamsJoinRequestResponse> {
    const team = await this.teamsDataService.findOne(teamId);
    if (!team) {
      throw new NotFoundException('TEAM_NOT_FOUND');
    }

    await this.teamsService.ensureUserNotInAnotherTeam(userId, teamId);

    const existingMember = await this.teamsDataService.findOneMember(
      teamId,
      userId,
    );
    if (existingMember && existingMember.leftAt === null) {
      throw new BadRequestException('ALREADY_TEAM_MEMBER');
    }

    const existingJoinRequest =
      await this.joinRequestDataService.getJoinRequests(
        teamId,
        undefined,
        undefined,
        userId,
      );
    if (
      existingJoinRequest &&
      !Array.isArray(existingJoinRequest) &&
      existingJoinRequest.status === TeamsJoinRequestStatus.PENDING
    ) {
      throw new BadRequestException('JOIN_REQUEST_ALREADY_EXISTS');
    }

    const joinRequest = await this.joinRequestDataService.createJoinRequest(
      teamId,
      userId,
    );

    try {
      await this.notificationService.notifyTeamJoinRequest(teamId, userId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Join request created but notification failed | ${JSON.stringify({
          teamId,
          applicantId: userId,
          message,
        })}`,
      );
    }

    return joinRequest;
  }

  async getJoinRequests(
    teamId: number,
    userId: number,
    statusQuery?: string,
  ): Promise<TeamsJoinRequestResponse[]> {
    const team = await this.teamsDataService.findOne(teamId);
    if (!team) {
      throw new NotFoundException('TEAM_NOT_FOUND');
    }

    await this.permissionsService.ensureCanManageTeamAsAdminOwnerOrAssistant(
      userId,
      teamId,
    );

    const status =
      statusQuery &&
      Object.values(TeamsJoinRequestStatus).includes(
        statusQuery as TeamsJoinRequestStatus,
      )
        ? (statusQuery as TeamsJoinRequestStatus)
        : undefined;

    const result = await this.joinRequestDataService.getJoinRequests(
      teamId,
      status,
    );
    return Array.isArray(result) ? result : [];
  }

  async approveJoinRequest(
    teamId: number,
    joinRequestId: number,
    reviewerId: number,
  ): Promise<TeamsJoinRequestResponse> {
    const team = await this.teamsDataService.findOne(teamId);
    if (!team) {
      throw new NotFoundException('TEAM_NOT_FOUND');
    }

    await this.permissionsService.ensureCanManageTeamAsAdminOwnerOrAssistant(
      reviewerId,
      teamId,
    );

    const joinRequest = await this.joinRequestDataService.getJoinRequests(
      teamId,
      undefined,
      joinRequestId,
    );

    if (!joinRequest || Array.isArray(joinRequest)) {
      throw new NotFoundException('JOIN_REQUEST_NOT_FOUND');
    }

    if (joinRequest.status !== TeamsJoinRequestStatus.PENDING) {
      throw new BadRequestException('JOIN_REQUEST_ALREADY_PROCESSED');
    }

    await this.teamsService.ensureUserNotInAnotherTeam(
      joinRequest.userId,
      teamId,
    );

    const updatedJoinRequest =
      await this.joinRequestDataService.updateJoinRequestStatus(
        joinRequestId,
        TeamsJoinRequestStatus.APPROVED,
        reviewerId,
      );

    const existingMember = await this.teamsDataService.findOneMember(
      teamId,
      joinRequest.userId,
    );

    const now = new Date();

    if (!existingMember) {
      await this.teamsDataService.addTeamMember({
        teamId,
        userId: joinRequest.userId,
        memberStatus: TeamMemberStatus.ACTIVE,
        joinedAt: now,
      });
    } else {
      await this.teamsDataService.updateMember(teamId, joinRequest.userId, {
        memberStatus: TeamMemberStatus.ACTIVE,
        joinedAt: now,
        leftAt: null,
      });
    }

    await this.aclService.grant(
      joinRequest.userId,
      AclPermission.read,
      `team/${teamId}/member`,
    );

    await this.registerNewMemberOnTeamEvents(teamId, joinRequest.userId);

    await this.notificationService.notifyTeamApproved(
      teamId,
      joinRequest.userId,
    );

    return updatedJoinRequest;
  }

  async rejectJoinRequest(
    teamId: number,
    joinRequestId: number,
    reviewerId: number,
  ): Promise<TeamsJoinRequestResponse> {
    const team = await this.teamsDataService.findOne(teamId);
    if (!team) {
      throw new NotFoundException('TEAM_NOT_FOUND');
    }

    await this.permissionsService.ensureCanManageTeamAsAdminOwnerOrAssistant(
      reviewerId,
      teamId,
    );

    const joinRequest = await this.joinRequestDataService.getJoinRequests(
      teamId,
      undefined,
      joinRequestId,
    );

    if (!joinRequest || Array.isArray(joinRequest)) {
      throw new NotFoundException('JOIN_REQUEST_NOT_FOUND');
    }

    if (joinRequest.status !== TeamsJoinRequestStatus.PENDING) {
      throw new BadRequestException('JOIN_REQUEST_ALREADY_PROCESSED');
    }

    const updatedJoinRequest =
      await this.joinRequestDataService.updateJoinRequestStatus(
        joinRequestId,
        TeamsJoinRequestStatus.REJECTED,
        reviewerId,
      );

    await this.notificationService.notifyTeamRejected(
      teamId,
      joinRequest.userId,
    );

    return updatedJoinRequest;
  }

  async updateJoinRequest(
    teamId: number,
    joinRequestId: number,
    userId: number,
    status?: TeamsJoinRequestStatus,
  ): Promise<TeamsJoinRequestResponse> {
    if (!status) {
      throw new BadRequestException('STATUS_REQUIRED');
    }

    if (
      status !== TeamsJoinRequestStatus.APPROVED &&
      status !== TeamsJoinRequestStatus.REJECTED
    ) {
      throw new BadRequestException('INVALID_STATUS');
    }

    return status === TeamsJoinRequestStatus.APPROVED
      ? this.approveJoinRequest(teamId, joinRequestId, userId)
      : this.rejectJoinRequest(teamId, joinRequestId, userId);
  }

  private async registerNewMemberOnTeamEvents(
    teamId: number,
    userId: number,
  ): Promise<void> {
    await this.eventsRegistrationService.registerNewMemberOnTeamEvents(
      teamId,
      userId,
    );
  }
}
