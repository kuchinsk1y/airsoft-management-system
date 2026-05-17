import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class StaffMemberDto {
  @IsNumber()
  userId: number;

  @IsString()
  @IsNotEmpty()
  role: string;
}

export class TeamsUpdateRequestDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

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
