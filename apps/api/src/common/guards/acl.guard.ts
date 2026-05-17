import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AclService } from '../../acl/acl.service';
import { ApplicationsDataService } from '../../applications/applications-data.service';
import { AclPermission } from '../../generated/prisma-client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../types/request.types';

export const ACL_REQUIRED = 'acl_required';

export interface AclMetadata {
  permission: AclPermission;
  resource: string;
  applicationId?: number | null;
  paramId?: string;
  fromResource?: boolean;
}

@Injectable()
export class AclGuard implements CanActivate {
  constructor(
    private readonly aclService: AclService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly applicationsDataService: ApplicationsDataService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user: AuthenticatedUser | undefined = request.user;

    if (user?.userId) {
      if (user.isAdmin === undefined) {
        user.isAdmin = await this.aclService.can(
          user.userId,
          AclPermission.write,
          'system',
          null,
        );
      }

      if (user.userApplicationId === undefined) {
        const userApplication = await this.applicationsDataService.findOne({
          ownerId: user.userId,
        });
        user.userApplicationId = userApplication?.id;
      }
    }

    if (isPublic) {
      return true;
    }

    const aclMetadataArray = this.reflector.getAllAndMerge<AclMetadata[]>(
      ACL_REQUIRED,
      [context.getHandler(), context.getClass()],
    );

    if (!aclMetadataArray || aclMetadataArray.length === 0) {
      return true;
    }

    if (!user?.userId) {
      throw new ForbiddenException('USER_NOT_AUTHENTICATED');
    }

    for (const aclMetadata of aclMetadataArray) {
      let applicationId: number | null | undefined = aclMetadata.applicationId;

      if (aclMetadata.paramId) {
        const rawParamValue = request.params[aclMetadata.paramId];
        let paramValue: string | string[] | undefined =
          typeof rawParamValue === 'string' || Array.isArray(rawParamValue)
            ? rawParamValue
            : undefined;

        if (!paramValue && ['POST', 'PATCH', 'PUT'].includes(request.method)) {
          const body = request.body as Record<string, unknown> | undefined;
          const bodyValue = body?.[aclMetadata.paramId];
          if (bodyValue !== undefined && typeof bodyValue === 'string') {
            paramValue = bodyValue;
          } else if (bodyValue !== undefined && typeof bodyValue === 'number') {
            paramValue = String(bodyValue);
          }
        }

        if (paramValue) {
          const paramValueString: string = Array.isArray(paramValue)
            ? String(paramValue[0])
            : String(paramValue);

          const paramIdValue = parseInt(paramValueString, 10);
          if (isNaN(paramIdValue)) {
            throw new ForbiddenException('INVALID_PARAM_ID');
          }

          if (aclMetadata.fromResource) {
            const controllerName = context.getClass().name;
            const isEventsController = controllerName === 'EventsController';
            const isRatingsController = controllerName === 'RatingsController';

            if (
              (isEventsController && aclMetadata.paramId === 'id') ||
              (isRatingsController && aclMetadata.paramId === 'eventId')
            ) {
              const event = await this.prisma.event.findUnique({
                where: { id: paramIdValue },
                select: { applicationId: true },
              });
              if (!event) {
                throw new ForbiddenException('EVENT_NOT_FOUND');
              }
              applicationId = event.applicationId;
            } else {
              applicationId = paramIdValue;
            }
          } else {
            applicationId = paramIdValue;
          }
        }
      }

      const allowed = await this.aclService.can(
        user.userId,
        aclMetadata.permission,
        aclMetadata.resource,
        applicationId,
      );

      if (allowed) {
        return true;
      }
    }

    throw new ForbiddenException('ACCESS_DENIED');
  }
}
