import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  OAuthUsersRequest,
  OAuthUsersResponse,
  Provider,
  UsersRequest,
  UsersResponse,
} from './interfaces';

@Injectable()
export class UsersDataService {
  constructor(private prisma: PrismaService) {}

  private baseSelect = {
    id: true,
    email: true,
    fullName: true,
    nickName: true,
    phoneNumber: true,
    dateOfBirth: true,
    country: true,
    region: true,
    city: true,
    logoUrl: true,
    isVerified: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  async findOne(where: {
    id?: number;
    email?: string;
    nickName?: string;
    provider?: Provider;
    providerId?: string;
  }) {
    if (where.provider && where.providerId) {
      const oauthAccount = await this.prisma.oAuthAccount.findUnique({
        where: {
          provider_providerId: {
            provider: where.provider,
            providerId: where.providerId,
          },
        },
        include: {
          user: {
            select: this.baseSelect,
          },
        },
      });

      return oauthAccount?.user ?? null;
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { id: where.id },
          { email: where.email },
          { nickName: where.nickName },
        ],
      },
      select: this.baseSelect,
    });

    if (!user) return null;
    return user;
  }

  async findMany(filters?: {
    ids?: number[];
    email?: string;
    nickName?: string;
    isVerified?: boolean;
  }): Promise<UsersResponse[]> {
    const where: {
      id?: { in: number[] };
      email?: string;
      nickName?: string;
      isVerified?: boolean;
    } = {};

    if (filters?.ids && filters.ids.length > 0) {
      const validIds = filters.ids.filter(
        (id): id is number =>
          typeof id === 'number' && Number.isInteger(id) && id > 0,
      );
      if (validIds.length > 0) {
        where.id = { in: validIds };
      }
    }
    if (filters?.email) {
      where.email = filters.email;
    }
    if (filters?.nickName) {
      where.nickName = filters.nickName;
    }
    if (filters?.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
    }

    return this.prisma.user.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      select: this.baseSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async countUsers(): Promise<number> {
    return this.prisma.user.count();
  }

  async searchByNickName(query: string, limit = 20): Promise<UsersResponse[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];
    return this.prisma.user.findMany({
      where: {
        nickName: { contains: trimmed, mode: 'insensitive' },
      },
      select: this.baseSelect,
      orderBy: { nickName: 'asc' },
      take: Math.min(limit, 50),
    });
  }

  async create(
    user: UsersRequest,
    oauthProvider?: OAuthUsersRequest,
  ): Promise<UsersResponse | OAuthUsersResponse> {
    if (oauthProvider) {
      return this.prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: { ...user, password: null, isVerified: true },
          select: this.baseSelect,
        });

        await tx.oAuthAccount.create({
          data: {
            provider: oauthProvider.provider,
            providerId: oauthProvider.providerId,
            userId: created.id,
          },
        });

        return {
          ...created,
          provider: oauthProvider.provider,
          providerId: oauthProvider.providerId,
        };
      });
    }

    return this.prisma.user.create({ data: user, select: this.baseSelect });
  }

  async update(
    id: number,
    data: Partial<{
      fullName?: string;
      phoneNumber?: string;
      dateOfBirth?: Date;
      country?: string;
      region?: string;
      city?: string;
      logoUrl?: string;
      isVerified?: boolean;
    }>,
  ): Promise<UsersResponse> {
    const updated = await this.prisma.user.update({
      where: { id },
      data,
      select: this.baseSelect,
    });

    return updated;
  }

  async updatePassword(userId: number, hashedPassword: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  async getPasswordForVerification(userId: number): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });
    return user?.password ?? null;
  }
}
