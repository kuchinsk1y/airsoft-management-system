import { ServiceOrderStatus } from '../../generated/prisma-client';
import { IsEnum } from 'class-validator';

export class UpdateServiceDto {
  @IsEnum(ServiceOrderStatus)
  status!: ServiceOrderStatus;
}
