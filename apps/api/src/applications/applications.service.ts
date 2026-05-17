import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AclService } from '../acl/acl.service';
import { AclPermission } from '../generated/prisma-client';
import { ApplicationsDataService } from './applications-data.service';
import { ApplicationRequest, ApplicationResponse } from './interfaces';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly applicationsDataService: ApplicationsDataService,
    private readonly aclService: AclService,
  ) {}

  async getApplications(userId: number): Promise<{
    applications: ApplicationResponse[];
    isAdmin: boolean;
  }> {
    const isAdmin = await this.aclService.can(
      userId,
      AclPermission.write,
      'system',
      null,
    );
    const applications = await this.applicationsDataService.findMany(
      isAdmin ? undefined : userId,
    );
    return { applications, isAdmin };
  }

  async createApplication(
    ownerId: number,
    data: ApplicationRequest,
  ): Promise<ApplicationResponse> {
    const uid = randomUUID();

    const application = await this.applicationsDataService.create(
      ownerId,
      data,
      uid,
    );

    await this.aclService.grantMany([
      {
        userId: ownerId,
        permission: AclPermission.write,
        resource: 'application',
        applicationId: application.id,
      },
      {
        userId: ownerId,
        permission: AclPermission.write,
        resource: 'event',
        applicationId: application.id,
      },
    ]);

    return application;
  }

  async get(where: {
    id?: number;
    uid?: string;
    ownerId?: number;
  }): Promise<ApplicationResponse> {
    const application = await this.applicationsDataService.findOne(where);
    if (!application) {
      throw new NotFoundException('APPLICATION_NOT_FOUND');
    }
    return application;
  }

  async updateApplication(
    userId: number,
    id: number,
    data: Partial<ApplicationRequest>,
  ): Promise<ApplicationResponse> {
    return this.applicationsDataService.update(id, data);
  }

  async removeApplication(userId: number, id: number): Promise<void> {
    return this.applicationsDataService.delete(id);
  }
}
