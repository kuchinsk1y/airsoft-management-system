import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CompetitionType, PaymentMethod } from '../../generated/prisma-client';

class EventSideRequestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(1)
  sideCapacity: number;
}

export class EventsRequestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  image: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  gameStartDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  regionId?: number;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  applicationId: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxParticipants?: number;

  @IsEnum(CompetitionType)
  competitionType: CompetitionType;

  @IsNumber()
  @Min(1)
  gameTypeId: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(PaymentMethod, { each: true })
  paymentMethods: PaymentMethod[];

  @IsNumber()
  price: number;

  @IsOptional()
  isActive?: boolean;

  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => EventSideRequestDto)
  sides: EventSideRequestDto[];

  @IsOptional()
  @IsObject()
  socialLinks?: Record<string, string>;
}
