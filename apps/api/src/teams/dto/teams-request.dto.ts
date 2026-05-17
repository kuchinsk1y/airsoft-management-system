import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { TeamsRequest } from '../interfaces';

class StaffMemberDto {
  @IsNumber()
  userId: number;

  @IsString()
  @IsNotEmpty()
  role: string;
}

export class TeamsRequestDto implements TeamsRequest {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  assistants?: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  members?: number[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StaffMemberDto)
  @IsOptional()
  staff?: Array<{ userId: number; role: string }>;
}
