import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationResponseDto } from './dto/organization-response.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

  async getOrganization(): Promise<OrganizationResponseDto> {
    const org = await this.prisma.organization.findUnique({
      where: { id: 1 },
    });

    if (!org) {
      return this.createDefaultOrganization();
    }

    return this.mapToDto(org);
  }

  async updateOrganization(
    data: UpdateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    const org = await this.prisma.organization.update({
      where: { id: 1 },
      data: {
        companyName: data.companyName,
        logoUrl: data.logoUrl,
        websiteUrl: data.websiteUrl,
        phone: data.phone,
        registrationSmsEnabled: data.registrationSmsEnabled,
        socialLinks: data.socialLinks
          ? JSON.stringify(data.socialLinks)
          : undefined,
      },
    });

    return this.mapToDto(org);
  }

  private async createDefaultOrganization(): Promise<OrganizationResponseDto> {
    const org = await this.prisma.organization.create({
      data: {
        id: 1,
        companyName: 'Strike Shop Action',
        registrationSmsEnabled: true,
        socialLinks: JSON.stringify([]),
      },
    });

    return this.mapToDto(org);
  }

  private mapToDto(org: any): OrganizationResponseDto {
    return {
      id: org.id,
      companyName: org.companyName,
      logoUrl: org.logoUrl,
      websiteUrl: org.websiteUrl,
      phone: org.phone,
      registrationSmsEnabled: org.registrationSmsEnabled,
      socialLinks: org.socialLinks ? JSON.parse(org.socialLinks) : [],
      updatedAt: org.updatedAt,
    };
  }
}
