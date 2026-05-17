import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { AclService } from '../acl/acl.service';
import { EventsRegistrationService } from '../events/events-registration.service';
import {
  AclPermission,
  TeamInvitationStatus,
  TeamMemberStatus,
} from '../generated/prisma-client';
import { TeamInvitationResponse, TeamsInvitationFilters } from './interfaces';
import { TeamsDataService } from './teams-data.service';
import { TeamsInvitationDataService } from './teams-invitation-data.service';
import { TeamsNotificationService } from './teams-notification.service';
import { TeamsPermissionsService } from './teams-permissions.service';
import { TeamsService } from './teams.service';

@Injectable()
export class TeamsInvitationService {
  private readonly logger = new Logger(TeamsInvitationService.name);

  constructor(
    private readonly invitationDataService: TeamsInvitationDataService,
    private readonly teamsDataService: TeamsDataService,
    private readonly aclService: AclService,
    private readonly notificationService: TeamsNotificationService,
    private readonly eventsRegistrationService: EventsRegistrationService,
    private readonly permissionsService: TeamsPermissionsService,
    @Inject(forwardRef(() => TeamsService))
    private readonly teamsService: TeamsService,
  ) {}

  async createInvitation(
    teamId: number,
    inviterId: number,
    inviteeId: number,
    expiresInDays?: number,
  ): Promise<TeamInvitationResponse> {
    const team = await this.teamsDataService.findOne(teamId);
    if (!team) {
      throw new NotFoundException('TEAM_NOT_FOUND');
    }

    const [isAdmin, isOwner, isAssistant] = await Promise.all([
      this.aclService.can(inviterId, AclPermission.write, 'system'),
      this.aclService.can(
        inviterId,
        AclPermission.write,
        `team/${teamId}/owner`,
      ),
      this.aclService.can(
        inviterId,
        AclPermission.write,
        `team/${teamId}/assistant`,
      ),
    ]);

    if (!isAdmin && !isOwner && !isAssistant) {
      throw new ForbiddenException('ACCESS_DENIED');
    }

    if (inviterId === inviteeId) {
      throw new BadRequestException('CANNOT_INVITE_YOURSELF');
    }

    const existingMember = await this.teamsDataService.findOneMember(
      teamId,
      inviteeId,
    );
    if (existingMember && existingMember.leftAt === null) {
      throw new BadRequestException('USER_ALREADY_TEAM_MEMBER');
    }

    const existingInvitation = await this.invitationDataService.findMany({
      teamId,
      inviteeId,
      status: TeamInvitationStatus.PENDING,
    });

    if (existingInvitation.length > 0) {
      throw new BadRequestException('INVITATION_ALREADY_EXISTS');
    }

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    const invitation = await this.invitationDataService.create(
      teamId,
      inviterId,
      inviteeId,
      expiresAt,
    );

    try {
      await this.notificationService.notifyTeamInvitation(
        teamId,
        inviterId,
        inviteeId,
      );
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Failed to send invitation notification for team ${teamId}, inviter ${inviterId}, invitee ${inviteeId}: ${reason}`,
      );
    }

    return invitation;
  }

  async getInvitations(
    userId: number,
    teamId?: string,
    status?: string,
  ): Promise<TeamInvitationResponse[]> {
    const filters: TeamsInvitationFilters = {};

    if (teamId) {
      const parsedTeamId = parseInt(teamId, 10);
      if (isNaN(parsedTeamId)) {
        throw new BadRequestException('INVALID_TEAM_ID');
      }
      filters.teamId = parsedTeamId;
    }

    if (status) {
      if (
        !Object.values(TeamInvitationStatus).includes(
          status as TeamInvitationStatus,
        )
      ) {
        throw new BadRequestException('INVALID_STATUS');
      }
      filters.status = status as TeamInvitationStatus;
    }

    if (filters.teamId) {
      const [isAdmin, isOwner] = await Promise.all([
        this.aclService.can(userId, AclPermission.write, 'system'),
        this.aclService.can(
          userId,
          AclPermission.write,
          `team/${filters.teamId}/owner`,
        ),
      ]);

      if (isAdmin || isOwner) {
        return this.invitationDataService.findMany({
          teamId: filters.teamId,
          ...(filters.status ? { status: filters.status } : {}),
        });
      }
    }

    return this.invitationDataService.findMany({
      inviteeId: userId,
      ...filters,
    });
  }

  async acceptInvitation(
    invitationId: number,
    userId: number,
  ): Promise<TeamInvitationResponse> {
    const invitation = await this.invitationDataService.findOne(
      invitationId,
      userId,
    );

    if (!invitation) {
      throw new NotFoundException('INVITATION_NOT_FOUND');
    }

    if (invitation.status !== TeamInvitationStatus.PENDING) {
      throw new BadRequestException('INVITATION_ALREADY_PROCESSED');
    }

    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
      throw new BadRequestException('INVITATION_EXPIRED');
    }

    const team = await this.teamsDataService.findOne(invitation.teamId);
    if (!team) {
      throw new NotFoundException('TEAM_NOT_FOUND');
    }

    const userTeams = await this.teamsDataService.findMany({ userId });
    const inAnotherTeam = userTeams.some(
      (team) => team.id !== invitation.teamId,
    );
    if (inAnotherTeam) {
      throw new BadRequestException('USER_ALREADY_IN_ANOTHER_TEAM');
    }

    const existingMember = await this.teamsDataService.findOneMember(
      invitation.teamId,
      userId,
    );

    const now = new Date();

    if (!existingMember) {
      await this.teamsDataService.addTeamMember({
        teamId: invitation.teamId,
        userId,
        memberStatus: TeamMemberStatus.ACTIVE,
        joinedAt: now,
      });
    } else {
      await this.teamsDataService.updateMember(invitation.teamId, userId, {
        memberStatus: TeamMemberStatus.ACTIVE,
        joinedAt: now,
        leftAt: null,
      });
    }

    const creationData = this.teamsService.getCreationData(invitation.teamId);
    await this.permissionsService.grantRoleFromCreationData(
      invitation.teamId,
      userId,
      creationData,
    );

    await this.eventsRegistrationService.registerNewMemberOnTeamEvents(
      invitation.teamId,
      userId,
    );

    await this.teamsService.cleanupCreationDataIfNeeded(invitation.teamId);

    const updatedInvitation = await this.invitationDataService.update(
      invitationId,
      TeamInvitationStatus.ACCEPTED,
    );

    await this.notificationService.notifyTeamInvitationAccepted(
      invitation.teamId,
      invitation.inviterId,
      userId,
    );

    return updatedInvitation;
  }

  async rejectInvitation(
    invitationId: number,
    userId: number,
  ): Promise<TeamInvitationResponse> {
    const invitation = await this.invitationDataService.findOne(
      invitationId,
      userId,
    );

    if (!invitation) {
      throw new NotFoundException('INVITATION_NOT_FOUND');
    }

    if (invitation.status !== TeamInvitationStatus.PENDING) {
      throw new BadRequestException('INVITATION_ALREADY_PROCESSED');
    }

    const updatedInvitation = await this.invitationDataService.update(
      invitationId,
      TeamInvitationStatus.REJECTED,
    );

    await this.notificationService.notifyTeamInvitationRejected(
      invitation.teamId,
      invitation.inviterId,
      userId,
    );

    return updatedInvitation;
  }
}
