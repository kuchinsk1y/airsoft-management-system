import { BadRequestException, Injectable } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import {
  OAuthUsersRequest,
  OAuthUsersResponse,
  Provider,
  UsersRequest,
  UsersResponse,
} from './interfaces';
import { UsersDataService } from './users-data.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersDataService: UsersDataService,
    private readonly storageService: StorageService,
  ) {}

  async getUser(params: {
    id?: number;
    email?: string;
    nickName?: string;
    provider?: Provider;
    providerId?: string;
  }): Promise<UsersResponse | OAuthUsersResponse | null> {
    return this.usersDataService.findOne(params);
  }

  async searchByNickName(query: string, limit = 20): Promise<UsersResponse[]> {
    return this.usersDataService.searchByNickName(query?.trim() ?? '', limit);
  }

  async getUsers(filters?: {
    ids?: number[];
    email?: string;
    nickName?: string;
    isVerified?: boolean;
  }): Promise<UsersResponse[]> {
    return this.usersDataService.findMany(filters);
  }

  async countUsers(): Promise<number> {
    return this.usersDataService.countUsers();
  }

  async createUser(
    user: UsersRequest,
    oauthProvider?: OAuthUsersRequest,
  ): Promise<UsersResponse | OAuthUsersResponse> {
    return this.usersDataService.create(user, oauthProvider);
  }

  async updateUser(
    userId: number,
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
    return this.usersDataService.update(userId, data);
  }

  updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
    return this.usersDataService.updatePassword(userId, hashedPassword);
  }

  getUserPasswordForVerification(userId: number): Promise<string | null> {
    return this.usersDataService.getPasswordForVerification(userId);
  }

  async uploadAvatar(
    userId: number,
    file: Express.Multer.File,
  ): Promise<{ url: string; user: UsersResponse }> {
    if (!file) {
      throw new BadRequestException('NO_FILE_PROVIDED');
    }

    const user = await this.getUser({ id: userId });
    if (!user) {
      throw new BadRequestException('USER_NOT_FOUND');
    }

    if (user.logoUrl) {
      const oldKey = this.storageService.extractKeyFromUrl(user.logoUrl);
      await this.storageService.remove(oldKey).catch(() => {});
    }

    const saved = await this.storageService.save(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    const updatedUser = await this.updateUser(userId, {
      logoUrl: saved.url,
    });

    return { url: saved.url, user: updatedUser };
  }
}
