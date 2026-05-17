import { AclPermission } from '../generated/prisma-client';

export { AclPermission };

export interface AclData {
  id: number;
  userId: number;
  permission: AclPermission;
  resource: string;
  applicationId?: number | null;
}

export interface AclFilters {
  userId?: number;
  permission?: AclPermission;
  resource?: string;
  resourcePrefix?: string;
  applicationId?: number | null;
}

export interface AclUniqueKey {
  userId: number;
  permission: AclPermission;
  resource: string;
  applicationId?: number | null;
}

export interface AclPermissionResponse {
  permission: string;
  resource?: string;
}
