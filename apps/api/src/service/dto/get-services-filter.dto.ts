import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ServiceOrderStatus } from '../../generated/prisma-client';

export class GetServicesFilterDto {
  @IsOptional()
  @IsEnum(ServiceOrderStatus)
  status?: ServiceOrderStatus;

  @IsOptional()
  @IsString()
  searchQuery?: string;
}
