import { IsEnum } from 'class-validator';
import { ServiceOrderStatus } from '../../generated/prisma-client';

export class ResponseServiceDto {
  id!: number;
  name!: string;
  phoneNumber!: string;
  email!: string;
  message!: string;
  topic!: string;
  company?: string;
  createdAt!: Date;
  updatedAt!: Date;
  @IsEnum(ServiceOrderStatus)
  status!: ServiceOrderStatus;
}
