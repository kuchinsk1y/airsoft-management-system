import 'reflect-metadata';
import { AclPermission } from '../../generated/prisma-client';
import { ACL_REQUIRED, AclMetadata } from '../guards/acl.guard';

export const Admin = () => {
  return (
    target: object,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor,
  ) => {
    const targetObject = descriptor?.value
      ? (descriptor.value as unknown as object)
      : target;

    const existingRaw = Reflect.getMetadata(ACL_REQUIRED, targetObject) as
      | AclMetadata[]
      | undefined;
    const existing = Array.isArray(existingRaw) ? existingRaw : [];

    const newRule: AclMetadata = {
      permission: AclPermission.write,
      resource: 'system',
    };

    const metadata: AclMetadata[] = [...existing, newRule];

    Reflect.defineMetadata(ACL_REQUIRED, metadata, targetObject);
  };
};
