import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AclData, AclFilters, AclUniqueKey } from './interfaces';

@Injectable()
export class AclDataService {
  constructor(private prisma: PrismaService) {}

  async create(data: Omit<AclData, 'id'>): Promise<void> {
    await this.prisma.acl.create({ data });
  }

  async createMany(data: Array<Omit<AclData, 'id'>>): Promise<void> {
    if (data.length === 0) return;
    await this.prisma.acl.createMany({ data });
  }

  async findMany(filters: AclFilters = {}): Promise<AclData[]> {
    return this.prisma.acl.findMany({
      where: {
        userId: filters.userId,
        permission: filters.permission,
        applicationId: filters.applicationId ?? null,
        ...(filters.resourcePrefix
          ? { resource: { startsWith: filters.resourcePrefix } }
          : { resource: filters.resource }),
      },
    });
  }

  async findOne(filters: AclUniqueKey): Promise<AclData | null> {
    const appId = filters.applicationId ?? null;
    return this.prisma.acl.findFirst({
      where: {
        userId: filters.userId,
        permission: filters.permission,
        resource: filters.resource,
        ...(appId === null
          ? { applicationId: { equals: null } }
          : { applicationId: appId }),
      },
    });
  }

  async deleteByUniqueKey(data: AclUniqueKey): Promise<void> {
    await this.prisma.acl.deleteMany({
      where: {
        userId: data.userId,
        permission: data.permission,
        resource: data.resource,
        applicationId: data.applicationId ?? null,
      },
    });
  }

  async deleteByResourcePrefix(resourcePrefix: string): Promise<void> {
    await this.prisma.acl.deleteMany({
      where: {
        resource: {
          startsWith: resourcePrefix,
        },
      },
    });
  }
}
