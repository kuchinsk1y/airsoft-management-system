import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UsersUpdateRequestDto {
  @IsOptional()
  @IsNotEmpty()
  fullName?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  dateOfBirth?: Date;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  country?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  region?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  city?: string;
}
