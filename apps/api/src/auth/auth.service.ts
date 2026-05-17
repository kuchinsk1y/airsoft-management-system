import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../email/email.service';
import { AclPermission } from '../generated/prisma-client';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import {
  OAuthUsersRequest,
  OAuthUsersResponse,
  Provider,
  UsersRequest,
  UsersResponse,
} from '../users/interfaces';
import { UsersService } from '../users/users.service';
import { FRONTEND_BASE_URL, JWT_SECRET } from '../utils/config';
import {
  LoginRequest,
  LoginResponse,
  OAuthLoginRequest,
  RegisterRequest,
} from './interfaces';

interface JwtPayload {
  sub: number;
  type: string;
}

interface RegisteredUser {
  id: number;
  email: string;
  phoneNumber: string | null;
  fullName: string | null;
  nickName: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private smsService: SmsService,
    private prismaService: PrismaService,
  ) {}

  async register(data: RegisterRequest): Promise<{ email: string }> {
    await this.validateRegistrationData(data);

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.usersService.createUser({
      email: data.email,
      fullName: data.fullName,
      nickName: data.nickName,
      phoneNumber: data.phoneNumber,
      password: hashedPassword,
      dateOfBirth: new Date(data.dateOfBirth),
      country: data.country,
      region: data.region,
      city: data.city,
    });

    await this.sendRegistrationNotifications(user, data.frontendUrl);

    return {
      email: user.email,
    };
  }

  async registerWeb(data: RegisterRequest): Promise<{ email: string }> {
    await this.validateRegistrationData(data);

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const appPhoneNumber = data.phoneNumber.trim();

    const user = await this.prismaService.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: data.email,
          fullName: data.fullName,
          nickName: data.nickName,
          phoneNumber: appPhoneNumber,
          password: hashedPassword,
          dateOfBirth: new Date(data.dateOfBirth),
          country: data.country,
          region: data.region,
          city: data.city,
        },
        select: {
          id: true,
          email: true,
          phoneNumber: true,
          fullName: true,
          nickName: true,
        },
      });

      const application = await tx.application.create({
        data: {
          uid: randomUUID(),
          name: data.nickName.trim(),
          address: this.buildApplicationAddress(data),
          phoneNumber: appPhoneNumber,
          ownerId: createdUser.id,
        },
        select: {
          id: true,
        },
      });

      await tx.acl.createMany({
        data: [
          {
            userId: createdUser.id,
            permission: AclPermission.write,
            resource: 'application',
            applicationId: application.id,
          },
          {
            userId: createdUser.id,
            permission: AclPermission.write,
            resource: 'event',
            applicationId: application.id,
          },
        ],
      });

      return createdUser;
    });

    await this.sendRegistrationNotifications(user, data.frontendUrl);

    return {
      email: user.email,
    };
  }

  private async validateRegistrationData(data: RegisterRequest): Promise<void> {
    const existingUser = await this.usersService.getUser({
      email: data.email,
      nickName: data.nickName,
    });
    if (existingUser) {
      throw new ConflictException('USER_ALREADY_EXISTS');
    }

    if (data.password !== data.confirmPassword) {
      throw new BadRequestException('PASSWORDS_DO_NOT_MATCH');
    }
  }

  private buildApplicationAddress(data: RegisterRequest): string {
    return [data.country, data.region, data.city]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(', ');
  }

  private async sendRegistrationNotifications(
    user: RegisteredUser,
    frontendUrl: string,
  ): Promise<void> {
    try {
      await this.sendVerificationEmail(user.id, user.email, frontendUrl);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${user.email}`,
        error,
      );
    }

    if (user.phoneNumber) {
      try {
        await this.smsService.sendRegistrationSms(
          user.phoneNumber,
          user.fullName || user.nickName,
        );
      } catch (error) {
        this.logger.warn(
          `Failed to send registration SMS to ${user.phoneNumber}`,
          error,
        );
      }
    }
  }

  async verifyPassword(data: LoginRequest): Promise<{ id: number }> {
    const user = await this.usersService.getUser({ email: data.email });

    if (!user) {
      throw new BadRequestException('INVALID_CREDENTIALS');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('EMAIL_NOT_VERIFIED');
    }

    const userPassword = await this.usersService.getUserPasswordForVerification(
      user.id,
    );

    if (!userPassword) {
      throw new BadRequestException('INVALID_CREDENTIALS');
    }

    if (!(await bcrypt.compare(data.password, userPassword))) {
      throw new BadRequestException('INVALID_CREDENTIALS');
    }

    return { id: user.id };
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    const userData = await this.verifyPassword(data);

    const token = this.jwtService.sign({
      sub: userData.id,
      type: 'access',
    });

    return {
      access_token: token,
    };
  }

  async verifyEmail(token: string) {
    try {
      const payload: JwtPayload = this.jwtService.verify(token, {
        secret: JWT_SECRET,
      });
      if (payload.type !== 'verify')
        throw new BadRequestException('INVALID_TOKEN_TYPE');

      await this.usersService.updateUser(payload.sub, { isVerified: true });

      const user = await this.usersService.getUser({ id: payload.sub });

      if (!user) {
        throw new BadRequestException('USER_NOT_FOUND');
      }

      return { message: 'EMAIL_VERIFIED' };
    } catch {
      throw new BadRequestException('INVALID_OR_EXPIRED_TOKEN');
    }
  }

  private async sendVerificationEmail(
    userId: number,
    email: string,
    frontendUrl: string,
  ) {
    const token = this.jwtService.sign(
      {
        sub: userId,
        type: 'verify',
      },
      {
        secret: JWT_SECRET,
        expiresIn: '1h',
      },
    );

    const user = await this.usersService.getUser({ id: userId });

    await this.emailService.send({
      email,
      metadata: {
        template: 'verify',
        subject: 'Підтвердження email',
        frontendUrl,
        type: 'verify',
        token,
        phone: user?.phoneNumber || '',
        event_date: new Date().toISOString().split('T')[0],
      },
    });
  }

  async resendVerificationEmail(email: string, frontendUrl: string) {
    const user = await this.usersService.getUser({ email });

    if (!user) {
      throw new BadRequestException('USER_NOT_FOUND');
    }

    if (!user.email) {
      throw new BadRequestException('EMAIL_REQUIRED');
    }

    await this.sendVerificationEmail(user.id, user.email, frontendUrl);

    return { message: 'VERIFICATION_EMAIL_SENT' };
  }

  async sendResetPasswordEmail(
    email: string,
    frontendUrl: string = `${FRONTEND_BASE_URL}/reset-password`,
  ) {
    try {
      const user = await this.usersService.getUser({ email });

      if (user) {
        const token = this.jwtService.sign(
          {
            sub: user.id,
            type: 'reset-password',
          },
          {
            secret: JWT_SECRET,
            expiresIn: '1h',
          },
        );

        await this.emailService.send({
          email,
          metadata: {
            template: 'reset-password',
            subject: 'Відновлення паролю',
            frontendUrl,
            token,
            phone: user.phoneNumber || '',
            event_date: new Date().toISOString().split('T')[0],
          },
        });

        this.logger.log(`Reset password email sent to ${email}`);
      } else {
        this.logger.warn(
          `Reset password requested for non-existent email: ${email}`,
        );
      }

      return { message: 'RESET_PASSWORD_EMAIL_SENT' };
    } catch (error) {
      this.logger.error(
        `Failed to send reset password email to ${email}`,
        error,
      );
      return { message: 'RESET_PASSWORD_EMAIL_SENT' };
    }
  }

  async resetPassword(token: string, password: string) {
    try {
      const payload: JwtPayload = this.jwtService.verify(token, {
        secret: JWT_SECRET,
      });
      if (payload.type !== 'reset-password') {
        throw new BadRequestException('INVALID_TOKEN_TYPE');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await this.usersService.updateUserPassword(payload.sub, hashedPassword);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('INVALID_OR_EXPIRED_TOKEN');
    }
  }

  async oauthLogin(user: OAuthLoginRequest): Promise<LoginResponse> {
    if (
      user.provider !== Provider.google &&
      user.provider !== Provider.facebook
    ) {
      throw new BadRequestException('INVALID_PROVIDER');
    }

    const givenName = user.givenName ?? null;
    const familyName = user.familyName ?? null;
    const fullName = `${givenName} ${familyName}`.trim() || null;

    const emailLocalPart = user.email.split('@')[0] || 'user';
    const sanitizeNickname = (str: string): string => {
      const cleaned = str.replace(/[^a-zA-Z0-9-_]/g, '');
      return cleaned.slice(0, 30) || 'user';
    };
    const nickName = sanitizeNickname(emailLocalPart);

    let existingUser: UsersResponse | OAuthUsersResponse | null =
      await this.usersService.getUser({
        provider: user.provider,
        providerId: user.providerId,
      });

    if (!existingUser) {
      const userByEmail = await this.usersService.getUser({
        email: user.email,
      });
      if (userByEmail) {
        throw new ConflictException('USER_ALREADY_EXISTS');
      }

      const createData: UsersRequest = {
        email: user.email,
        fullName: fullName || 'User',
        nickName: nickName,
        password: null,
        dateOfBirth: new Date('1990-01-01'),
        country: null,
        region: null,
        city: null,
      };

      const oauthProvider: OAuthUsersRequest = {
        provider: user.provider,
        providerId: user.providerId,
      };

      existingUser = await this.usersService.createUser(
        createData,
        oauthProvider,
      );
    }

    if (!existingUser) {
      throw new BadRequestException('USER_CREATION_FAILED');
    }

    const token = this.jwtService.sign({
      sub: existingUser.id,
      type: 'access',
    });

    return {
      access_token: token,
    };
  }

  async handleOAuthCallback(
    queryError: string | undefined,
    user: OAuthLoginRequest | undefined,
    emailRequiredError: string,
  ): Promise<string> {
    if (queryError === 'access_denied') {
      return `${FRONTEND_BASE_URL}/login?error=${encodeURIComponent('OAUTH_ACCESS_DENIED')}`;
    }

    if (!user) {
      return `${FRONTEND_BASE_URL}/login?error=${encodeURIComponent(emailRequiredError)}`;
    }

    try {
      const result = await this.oauthLogin(user);
      return `${FRONTEND_BASE_URL}?oauth_token=${result.access_token}`;
    } catch (error) {
      const errorMessage =
        error instanceof BadRequestException ||
        error instanceof ConflictException
          ? error.message
          : error instanceof Error && error.message === emailRequiredError
            ? emailRequiredError
            : 'OAUTH_FAILED';
      return `${FRONTEND_BASE_URL}/login?error=${encodeURIComponent(errorMessage)}`;
    }
  }
}
