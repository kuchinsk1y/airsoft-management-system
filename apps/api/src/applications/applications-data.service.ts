import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApplicationRequest, ApplicationResponse } from './interfaces';

@Injectable()
export class ApplicationsDataService {
  constructor(private prisma: PrismaService) {}

  async create(
    ownerId: number,
    data: ApplicationRequest,
    uid: string,
  ): Promise<ApplicationResponse> {
    const application = await this.prisma.application.create({
      data: {
        uid,
        name: data.name,
        address: data.address,
        phoneNumber: data.phoneNumber,
        description: data.description,
        logoUrl: data.logoUrl,
        ownerId,
      },
    });

    return application;
  }

  async findOne(where: {
    id?: number;
    uid?: string;
    ownerId?: number;
  }): Promise<ApplicationResponse | null> {
    return this.prisma.application.findFirst({
      where: {
        OR: [{ id: where.id }, { uid: where.uid }, { ownerId: where.ownerId }],
      },
    });
  }

  async findMany(ownerId?: number): Promise<ApplicationResponse[]> {
    return this.prisma.application.findMany({
      where: ownerId ? { ownerId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    id: number,
    data: Partial<ApplicationRequest>,
  ): Promise<ApplicationResponse> {
    const application = await this.prisma.application.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address,
        phoneNumber: data.phoneNumber,
        description: data.description,
        logoUrl: data.logoUrl,
      },
    });

    return application;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.application.delete({
      where: { id },
    });
  }

  async isOwner(userId: number, applicationId: number): Promise<boolean> {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      select: { ownerId: true },
    });
    return application?.ownerId === userId;
  }
}
