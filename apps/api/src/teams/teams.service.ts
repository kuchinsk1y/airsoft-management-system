import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { AclService } from '../acl/acl.service';
import { EventsRegistrationService } from '../events/events-registration.service';
import { AclPermission } from '../generated/prisma-client';
import { StorageService } from '../storage/storage.service';
import { UsersService } from '../users/users.service';
import {
  TeamInvitationStatus,
  TeamsFilters,
  TeamsMemberResponse,
  TeamsRequest,
  TeamsResponse,
} from './interfaces';
import { TeamsDataService } from './teams-data.service';
import { TeamsInvitationDataService } from './teams-invitation-data.service';
import { TeamsInvitationService } from './teams-invitation.service';
import { TeamsNotificationService } from './teams-notification.service';
import { TeamsPermissionsService } from './teams-permissions.service';

@Injectable()
export class TeamsService {
  private readonly logger = new Logger(TeamsService.name);
  private readonly teamCreationData = new Map<
    number,
    {
      assistants?: number[];
      members?: number[];
      staff?: Array<{ userId: number; role: string }>;
    }
  >();

  constructor(
    private readonly teamsDataService: TeamsDataService,
    private readonly aclService: AclService,
    private readonly usersService: UsersService,
    private readonly storageService: StorageService,
    @Inject(forwardRef(() => TeamsInvitationService))
    private readonly invitationService: TeamsInvitationService,
    private readonly invitationDataService: TeamsInvitationDataService,
    private readonly eventsRegistrationService: EventsRegistrationService,
    private readonly permissionsService: TeamsPermissionsService,
    private readonly notificationService: TeamsNotificationService,
  ) {}

  async createTeam(
    data: TeamsRequest,
    ownerId: number,
  ): Promise<TeamsResponse> {
    await this.ensureUserNotInAnotherTeam(ownerId, undefined);
    this.validateNoDuplicateRoles(data, ownerId);

    return this.teamsDataService.transaction(async () => {
      const team = await this.teamsDataService.create(data, ownerId);

      await this.aclService.grant(
        ownerId,
        AclPermission.write,
        `team/${team.id}/owner`,
      );

      const { assistants, members, staff } = data;
      this.teamCreationData.set(team.id, { assistants, members, staff });

      const allInvitees = new Set<number>();
      if (assistants) {
        assistants.forEach((id) => allInvitees.add(id));
      }
      if (members) {
        members.forEach((id) => allInvitees.add(id));
      }
      if (staff) {
        staff.forEach(({ userId }) => allInvitees.add(userId));
      }

      const invitationResults = await Promise.allSettled(
        Array.from(allInvitees).map((inviteeId) =>
          this.invitationService.createInvitation(team.id, ownerId, inviteeId),
        ),
      );

      invitationResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          const inviteeId = Array.from(allInvitees)[index];
          const reason =
            result.reason instanceof Error
              ? result.reason.message
              : String(result.reason);
          this.logger.warn(
            `Team ${team.id}: invitation for user ${inviteeId} failed during team creation: ${reason}`,
          );
        }
      });

      return team;
    });
  }

  async ensureUserNotInAnotherTeam(
    userId: number,
    exceptTeamId: number | undefined,
  ): Promise<void> {
    const userTeams = await this.teamsDataService.findMany({ userId });
    const inAnotherTeam = userTeams.some((team) => team.id !== exceptTeamId);
    if (inAnotherTeam) {
      throw new BadRequestException('USER_ALREADY_IN_ANOTHER_TEAM');
    }
  }

  private validateNoDuplicateRoles(
    data: TeamsRequest,
    ownerId: number,
    currentMemberIds?: Set<number>,
  ): void {
    const userIds = new Set<number>();
    const duplicates: number[] = [];

    const allUserIds = [
      ...(data.assistants || []),
      ...(data.members || []),
      ...(data.staff?.map(({ userId }) => userId) || []),
    ];

    allUserIds
      .filter((userId) => userId !== ownerId)
      .forEach((userId) => {
        if (userIds.has(userId)) {
          duplicates.push(userId);
        } else {
          userIds.add(userId);
        }
      });

    if (duplicates.length > 0) {
      throw new BadRequestException('DUPLICATE_USER_ROLES');
    }
  }

  private async withResolvedMemberRoles(
    teamId: number,
    members: TeamsMemberResponse[],
  ): Promise<TeamsMemberResponse[]> {
    if (!members.length) {
      return members;
    }

    const [ownerAcls, assistantAcls, memberAcls, staffAcls] = await Promise.all(
      [
        this.aclService.get({
          permission: AclPermission.write,
          resource: `team/${teamId}/owner`,
        }),
        this.aclService.get({
          permission: AclPermission.write,
          resource: `team/${teamId}/assistant`,
        }),
        this.aclService.get({
          permission: AclPermission.read,
          resource: `team/${teamId}/member`,
        }),
        this.aclService.get({
          permission: AclPermission.read,
          resourcePrefix: `team/${teamId}/staff`,
        }),
      ],
    );

    const ownerIds = new Set(ownerAcls.map((entry) => entry.userId));
    const assistantIds = new Set(assistantAcls.map((entry) => entry.userId));
    const memberIds = new Set(memberAcls.map((entry) => entry.userId));
    const staffIds = new Set(staffAcls.map((entry) => entry.userId));

    return members.map((member) => {
      let role: TeamsMemberResponse['role'];

      if (ownerIds.has(member.userId)) {
        role = 'owner';
      } else if (assistantIds.has(member.userId)) {
        role = 'assistant';
      } else if (staffIds.has(member.userId)) {
        role = 'staff';
      } else if (memberIds.has(member.userId)) {
        role = 'member';
      } else {
        role = undefined;
      }

      return {
        ...member,
        role,
      };
    });
  }

  async get(id: number): Promise<TeamsResponse> {
    const team = await this.teamsDataService.findOne(id);
    if (!team) {
      throw new NotFoundException('TEAM_NOT_FOUND');
    }

    if (team.members?.length) {
      team.members = await this.withResolvedMemberRoles(id, team.members);
    }

    return team;
  }

  async getAll(
    myTeam?: string,
    searchQuery?: string,
    userId?: number,
  ): Promise<TeamsResponse[]> {
    const filters: TeamsFilters = {
      ...(myTeam === 'true' && userId && { userId }),
      ...(searchQuery && { searchQuery }),
    };

    const teams = await this.teamsDataService.findMany(filters);
    if (teams.length === 0 && !filters.userId) {
      throw new NotFoundException('TEAMS_NOT_FOUND');
    }
    return teams;
  }

  async updateTeam(
    id: number,
    data: {
      name?: string;
      logoUrl?: string;
      description?: string;
      assistants?: number[];
      members?: number[];
      staff?: Array<{ userId: number; role: string }>;
    },
    userId: number,
  ): Promise<TeamsResponse> {
    await this.get(id);

    await this.permissionsService.ensureCanManageTeamAsAdminOwnerOrAssistant(
      userId,
      id,
    );

    const currentTeam = await this.teamsDataService.findOne(id);
    const currentMemberIds = new Set(
      (currentTeam?.members || [])
        .filter((member) => member.leftAt === null)
        .map((member) => member.userId),
    );

    const shouldUpdateMembers =
      data.assistants !== undefined ||
      data.members !== undefined ||
      data.staff !== undefined;

    const removedUserIds: number[] = shouldUpdateMembers
      ? (() => {
          const nextUserIds = new Set<number>();
          nextUserIds.add(userId);
          (data.assistants || []).forEach((uid) => nextUserIds.add(uid));
          (data.members || []).forEach((uid) => nextUserIds.add(uid));
          (data.staff || []).forEach((s) => nextUserIds.add(s.userId));

          return Array.from(currentMemberIds).filter(
            (uid) => uid !== userId && !nextUserIds.has(uid),
          );
        })()
      : [];

    if (
      data.assistants !== undefined ||
      data.members !== undefined ||
      data.staff !== undefined
    ) {
      this.validateNoDuplicateRoles(
        {
          assistants: data.assistants,
          members: data.members,
          staff: data.staff,
        } as TeamsRequest,
        userId,
        currentMemberIds,
      );
    }

    return this.teamsDataService.transaction(async () => {
      const updatedTeam = await this.teamsDataService.update(id, data, userId);

      if (
        data.assistants !== undefined ||
        data.members !== undefined ||
        data.staff !== undefined
      ) {
        const allUserIds = new Set<number>();
        if (data.assistants) {
          data.assistants.forEach((id) => allUserIds.add(id));
        }
        if (data.members) {
          data.members.forEach((id) => allUserIds.add(id));
        }
        if (data.staff) {
          data.staff.forEach(({ userId: staffUserId }) =>
            allUserIds.add(staffUserId),
          );
        }

        const newUserIds = Array.from(allUserIds).filter(
          (newUserId) =>
            !currentMemberIds.has(newUserId) && newUserId !== userId,
        );

        if (newUserIds.length > 0) {
          await Promise.allSettled(
            newUserIds.map((inviteeId) =>
              this.invitationService.createInvitation(id, userId, inviteeId),
            ),
          );
        }

        await this.permissionsService.updateTeamAclPermissions(
          id,
          data,
          userId,
        );
      }

      if (removedUserIds.length > 0) {
        await Promise.allSettled(
          removedUserIds.map((removedUserId) =>
            this.notificationService.notifyMemberRemovedFromTeam(
              id,
              removedUserId,
            ),
          ),
        );
      }

      return updatedTeam;
    });
  }

  async uploadTeamLogo(
    teamId: number,
    userId: number,
    file: Express.Multer.File,
  ): Promise<{ url: string; team: TeamsResponse }> {
    if (!file) {
      throw new BadRequestException('NO_FILE_PROVIDED');
    }

    const team = await this.get(teamId);
    await this.permissionsService.ensureCanManageTeamAsAdminOwnerOrAssistant(
      userId,
      teamId,
    );

    const saved = await this.storageService.save(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    const updated = await this.updateTeam(
      teamId,
      { logoUrl: saved.url },
      userId,
    );

    if (team.logoUrl) {
      const oldKey = this.storageService.extractKeyFromUrl(team.logoUrl);
      await this.storageService.remove(oldKey);
    }

    return { url: saved.url, team: updated };
  }

  async removeTeam(id: number, userId: number): Promise<void> {
    await this.get(id);
    await this.permissionsService.ensureCanManageTeamAsAdminOrOwner(userId, id);

    const team = await this.teamsDataService.findOne(id);
    const teamName = team?.name || `#${id}`;
    const recipientUserIds = (team?.members || [])
      .map((m) => m.userId)
      .filter((uid) => uid !== userId);

    const hasRegistrations =
      await this.eventsRegistrationService.hasTeamActiveRegistrations(id);
    if (hasRegistrations) {
      throw new BadRequestException('TEAM_REGISTERED_ON_EVENT_CANNOT_DELETE');
    }

    await this.teamsDataService.transaction(async () => {
      await this.aclService.revokeByResourcePrefix(`team/${id}/`);
      await this.teamsDataService.delete(id);
    });

    try {
      await this.notificationService.notifyTeamDeleted({
        teamId: id,
        teamName,
        recipientUserIds,
      });
    } catch {}
  }

  async leaveTeam(teamId: number, userId: number): Promise<void> {
    await this.get(teamId);

    const member = await this.teamsDataService.findOneMember(teamId, userId);
    if (!member) {
      throw new BadRequestException('NOT_TEAM_MEMBER');
    }
    if (member.leftAt !== null) {
      throw new BadRequestException('NOT_TEAM_MEMBER');
    }

    const isOwner = await this.permissionsService.isOwner(userId, teamId);
    if (isOwner) {
      throw new BadRequestException('OWNER_CANNOT_LEAVE');
    }

    await this.teamsDataService.transaction(async () => {
      await this.teamsDataService.leaveTeam(teamId, userId);
      await this.revokeMemberAclPermissions(teamId, userId);
    });

    await Promise.allSettled([
      this.eventsRegistrationService.cancelTeamEventRegistrationsForMember(
        teamId,
        userId,
      ),
    ]);

    const user = await this.usersService.getUser({ id: userId });
    if (user) {
      const memberName = user.nickName || user.fullName || user.email;
      await this.notificationService.notifyMemberLeftTeam(
        teamId,
        userId,
        memberName,
      );
    }
  }

  async getMembers(
    teamId: number,
    userId: number,
  ): Promise<TeamsMemberResponse[]> {
    await this.get(teamId);
    await this.permissionsService.ensureCanManageTeamAsAdminOwnerOrAssistant(
      userId,
      teamId,
    );

    return this.teamsDataService.findManyMembers(teamId);
  }

  async getLeftMembers(
    teamId: number,
    userId: number,
  ): Promise<TeamsMemberResponse[]> {
    await this.get(teamId);
    await this.permissionsService.ensureCanManageTeamAsAdminOwnerOrAssistant(
      userId,
      teamId,
    );

    return this.teamsDataService.findManyMembers(teamId, {
      onlyLeftMembers: true,
    });
  }

  async removeMember(
    teamId: number,
    memberId: number,
    userId: number,
  ): Promise<void> {
    await this.get(teamId);
    await this.permissionsService.ensureCanManageTeamAsAdminOwnerOrAssistant(
      userId,
      teamId,
    );

    const member = await this.teamsDataService.findOneMember(teamId, memberId);
    if (!member) {
      throw new NotFoundException('MEMBER_NOT_FOUND');
    }
    if (member.leftAt !== null) {
      throw new BadRequestException('MEMBER_ALREADY_LEFT');
    }

    const isMemberOwner = await this.permissionsService.isOwner(
      memberId,
      teamId,
    );
    if (isMemberOwner) {
      throw new BadRequestException('CANNOT_REMOVE_OWNER');
    }

    const currentTeam = await this.teamsDataService.findOne(teamId);
    const activeMembers = (currentTeam?.members || []).filter(
      (member) => member.leftAt === null,
    );
    if (activeMembers.length <= 2) {
      throw new BadRequestException('TEAM_MIN_MEMBERS_REQUIRED');
    }

    await this.teamsDataService.transaction(async () => {
      await this.teamsDataService.leaveTeam(teamId, memberId);
      await this.revokeMemberAclPermissions(teamId, memberId);
    });

    await Promise.allSettled([
      this.eventsRegistrationService.cancelTeamEventRegistrationsForMember(
        teamId,
        memberId,
      ),
    ]);

    const user = await this.usersService.getUser({ id: memberId });
    if (user) {
      await this.notificationService.notifyMemberRemovedFromTeam(
        teamId,
        memberId,
      );
    }
  }

  private async revokeMemberAclPermissions(
    teamId: number,
    userId: number,
  ): Promise<void> {
    const assistantResource = `team/${teamId}/assistant`;
    const memberResource = `team/${teamId}/member`;

    await Promise.all([
      this.aclService.revoke(userId, AclPermission.write, assistantResource),
      this.aclService.revoke(userId, AclPermission.read, memberResource),
      this.aclService.revokeByResourcePrefix(`team/${teamId}/staff/`),
    ]);
  }

  async getMemberRole(
    teamId: number,
    userId: number,
  ): Promise<'owner' | 'assistant' | 'staff' | 'member' | null> {
    const ownerAcl = await this.aclService.get({
      userId,
      permission: AclPermission.write,
      resource: `team/${teamId}/owner`,
    });
    if (ownerAcl.length > 0) {
      return 'owner';
    }

    const assistantAcl = await this.aclService.get({
      userId,
      permission: AclPermission.write,
      resource: `team/${teamId}/assistant`,
    });
    if (assistantAcl.length > 0) {
      return 'assistant';
    }

    const hasStaffRole =
      (
        await this.aclService.get({
          userId,
          permission: AclPermission.read,
          resourcePrefix: `team/${teamId}/staff`,
        })
      ).length > 0;
    if (hasStaffRole) {
      return 'staff';
    }

    const memberAcl = await this.aclService.get({
      userId,
      permission: AclPermission.read,
      resource: `team/${teamId}/member`,
    });
    if (memberAcl.length > 0) {
      return 'member';
    }

    return null;
  }

  async grantRoleFromCreationData(
    teamId: number,
    userId: number,
  ): Promise<void> {
    const creationData = this.teamCreationData.get(teamId);
    await this.permissionsService.grantRoleFromCreationData(
      teamId,
      userId,
      creationData,
    );
  }

  getCreationData(teamId: number):
    | {
        assistants?: number[];
        members?: number[];
        staff?: Array<{ userId: number; role: string }>;
      }
    | undefined {
    return this.teamCreationData.get(teamId);
  }

  cleanupCreationData(teamId: number): void {
    this.teamCreationData.delete(teamId);
  }

  async cleanupCreationDataIfNeeded(teamId: number): Promise<void> {
    const creationData = this.teamCreationData.get(teamId);
    if (!creationData) {
      return;
    }

    const allInvitations = await this.invitationDataService.findMany({
      teamId,
    });

    const hasPendingInvitations = allInvitations.some(
      (invitation) => invitation.status === TeamInvitationStatus.PENDING,
    );

    if (!hasPendingInvitations) {
      this.teamCreationData.delete(teamId);
    }
  }
}
