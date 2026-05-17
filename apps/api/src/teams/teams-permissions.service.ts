import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AclService } from '../acl/acl.service';
import { AclPermission } from '../generated/prisma-client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class TeamsPermissionsService {
  constructor(
    private readonly aclService: AclService,
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async ensureCanManageTeamAsAdminOrOwner(
    userId: number,
    teamId: number,
  ): Promise<void> {
    const [isAdmin, isOwner] = await Promise.all([
      this.isAdmin(userId),
      this.isOwner(userId, teamId),
    ]);
    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('ACCESS_DENIED');
    }
  }

  async ensureCanManageTeamAsAdminOwnerOrAssistant(
    userId: number,
    teamId: number,
  ): Promise<void> {
    const isAdmin = await this.isAdmin(userId);
    if (isAdmin) {
      return;
    }
    const isOwner = await this.isOwner(userId, teamId);
    const isAssistant = await this.isAssistant(userId, teamId);
    if (!isOwner && !isAssistant) {
      throw new ForbiddenException('ACCESS_DENIED');
    }
  }

  async isOwner(userId: number, teamId: number): Promise<boolean> {
    return this.aclService.can(
      userId,
      AclPermission.write,
      `team/${teamId}/owner`,
    );
  }

  async isAssistant(userId: number, teamId: number): Promise<boolean> {
    return this.aclService.can(
      userId,
      AclPermission.write,
      `team/${teamId}/assistant`,
    );
  }

  async isAdmin(userId: number): Promise<boolean> {
    return this.aclService.can(userId, AclPermission.write, 'system', null);
  }

  async getTeamOwnerId(teamId: number): Promise<number> {
    const ownerAcl = await this.prisma.acl.findFirst({
      where: {
        resource: `team/${teamId}/owner`,
        permission: AclPermission.write,
      },
      select: { userId: true },
    });
    if (!ownerAcl) {
      throw new NotFoundException('TEAM_OWNER_NOT_FOUND');
    }

    const owner = await this.usersService.getUser({ id: ownerAcl.userId });
    if (!owner) {
      throw new NotFoundException('TEAM_OWNER_USER_NOT_FOUND');
    }

    return ownerAcl.userId;
  }

  async getTeamManagers(
    teamId: number,
  ): Promise<Array<{ id: number; email: string }> | null> {
    const ownerAcls = await this.aclService.get({
      permission: AclPermission.write,
      resource: `team/${teamId}/owner`,
    });

    const assistantAcls = await this.aclService.get({
      permission: AclPermission.write,
      resource: `team/${teamId}/assistant`,
    });

    if (ownerAcls.length === 0 && assistantAcls.length === 0) {
      return null;
    }

    const ownerIds = Array.from(
      new Set(ownerAcls.map((ownerAcl) => ownerAcl.userId)),
    );
    const assistantIds = Array.from(
      new Set(assistantAcls.map((assistantAcl) => assistantAcl.userId)),
    );
    const allManagerIds = Array.from(new Set([...ownerIds, ...assistantIds]));
    const managers = await this.usersService.getUsers({ ids: allManagerIds });

    return managers;
  }

  async updateTeamAclPermissions(
    teamId: number,
    data: {
      assistants?: number[];
      members?: number[];
      staff?: Array<{ userId: number; role: string }>;
    },
    userId: number,
  ): Promise<void> {
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

    if (allUserIds.size > 0) {
      const users = await this.usersService.getUsers({
        ids: Array.from(allUserIds),
      });
      const existingUserIds = new Set(users.map((user) => user.id));
      const missingUserIds = Array.from(allUserIds).filter(
        (id) => !existingUserIds.has(id),
      );

      if (missingUserIds.length > 0) {
        throw new NotFoundException(
          `USERS_NOT_FOUND: ${missingUserIds.join(', ')}`,
        );
      }
    }

    await this.aclService.revokeByResourcePrefix(`team/${teamId}/assistant`);
    await this.aclService.revokeByResourcePrefix(`team/${teamId}/member`);
    await this.aclService.revokeByResourcePrefix(`team/${teamId}/staff`);

    const aclGrants = [
      ...(data.assistants || [])
        .filter((assistantUserId) => assistantUserId !== userId)
        .map((assistantId) => ({
          userId: assistantId,
          permission: AclPermission.write,
          resource: `team/${teamId}/assistant`,
        })),
      ...(data.members || [])
        .filter((memberUserId) => memberUserId !== userId)
        .map((memberId) => ({
          userId: memberId,
          permission: AclPermission.read,
          resource: `team/${teamId}/member`,
        })),
      ...(data.staff || [])
        .filter(({ userId: staffUserId }) => staffUserId !== userId)
        .map(({ userId: staffUserId, role }) => ({
          userId: staffUserId,
          permission: AclPermission.read,
          resource: `team/${teamId}/staff/${role}`,
        })),
    ];

    if (aclGrants.length > 0) {
      await this.aclService.grantMany(aclGrants);
    }
  }

  async grantRoleFromCreationData(
    teamId: number,
    userId: number,
    creationData:
      | {
          assistants?: number[];
          members?: number[];
          staff?: Array<{ userId: number; role: string }>;
        }
      | undefined,
  ): Promise<void> {
    if (!creationData) {
      await this.aclService.grant(
        userId,
        AclPermission.read,
        `team/${teamId}/member`,
      );
      return;
    }
    if (creationData.assistants?.includes(userId)) {
      await this.aclService.grant(
        userId,
        AclPermission.write,
        `team/${teamId}/assistant`,
      );
    } else {
      const staffMember = creationData.staff?.find(
        (staffMember) => staffMember.userId === userId,
      );
      if (staffMember) {
        await this.aclService.grant(
          userId,
          AclPermission.read,
          `team/${teamId}/staff/${staffMember.role}`,
        );
      } else {
        await this.aclService.grant(
          userId,
          AclPermission.read,
          `team/${teamId}/member`,
        );
      }
    }
  }
}
