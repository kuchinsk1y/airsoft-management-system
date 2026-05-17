import { ForbiddenException, Injectable } from '@nestjs/common';
import { ApplicationsDataService } from '../applications/applications-data.service';
import { AclDataService } from './acl-data.service';
import { AclData, AclFilters, AclPermission } from './interfaces';

@Injectable()
export class AclService {
  constructor(
    private readonly aclData: AclDataService,
    private readonly applicationsData: ApplicationsDataService,
  ) {}

  async can(
    userId: number,
    permission: AclPermission,
    resource: string,
    applicationId?: number | null,
  ): Promise<boolean> {
    const isAdmin = await this.aclData.findOne({
      userId,
      permission: AclPermission.write,
      resource: 'system',
      applicationId: null,
    });
    if (isAdmin !== null) {
      return true;
    }

    const acl = await this.aclData.findOne({
      userId,
      permission,
      resource,
      applicationId: applicationId ?? null,
    });
    if (acl !== null) {
      return true;
    }

    if (resource.startsWith('event/')) {
      const eventAcl = await this.aclData.findOne({
        userId,
        permission,
        resource: 'event',
        applicationId: applicationId ?? null,
      });
      if (eventAcl !== null) {
        return true;
      }
    }

    if (resource === 'application' && applicationId) {
      const isOwner = await this.applicationsData.isOwner(
        userId,
        applicationId,
      );
      if (isOwner) {
        return true;
      }
    }

    return false;
  }

  async assert(
    userId: number,
    permission: AclPermission,
    resource: string,
    applicationId?: number | null,
  ): Promise<void> {
    const allowed = await this.can(userId, permission, resource, applicationId);
    if (!allowed) {
      throw new ForbiddenException('ACCESS_DENIED');
    }
  }

  async grant(
    userId: number,
    permission: AclPermission,
    resource: string,
    applicationId?: number | null,
  ): Promise<void> {
    await this.aclData.create({
      userId,
      permission,
      resource,
      applicationId: applicationId ?? null,
    });
  }

  async grantMany(data: Array<Omit<AclData, 'id'>>): Promise<void> {
    await this.aclData.createMany(data);
  }

  async revoke(
    userId: number,
    permission: AclPermission,
    resource: string,
    applicationId?: number | null,
  ): Promise<void> {
    await this.aclData.deleteByUniqueKey({
      userId,
      permission,
      resource,
      applicationId: applicationId ?? null,
    });
  }

  async get(filters: AclFilters = {}) {
    return this.aclData.findMany(filters);
  }

  async revokeByResourcePrefix(resourcePrefix: string): Promise<void> {
    await this.aclData.deleteByResourcePrefix(resourcePrefix);
  }

  async findAdminUserIds(): Promise<number[]> {
    const acls = await this.aclData.findMany({
      permission: AclPermission.write,
      resource: 'system',
      applicationId: null,
    });
    return acls.map((acl) => acl.userId);
  }
}
