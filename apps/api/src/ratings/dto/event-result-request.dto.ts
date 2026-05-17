import { IsEnum, IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { EventPlacement } from '../../generated/prisma-client';

export class EventResultRequestDto {
  @IsInt()
  @Min(1)
  eventId: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  userId?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  teamId?: number;

  @IsEnum(EventPlacement)
  placement: EventPlacement;

  @IsInt()
  @IsOptional()
  @Min(0)
  points?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  kills?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  deaths?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  accuracy?: number;
}
