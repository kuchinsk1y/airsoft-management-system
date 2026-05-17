import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { EventStatus } from '../../generated/prisma-client';
import { EventStatusRequest } from '../interfaces';

export class EventStatusRequestDto implements EventStatusRequest {
  @IsEnum(EventStatus)
  status: EventStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
