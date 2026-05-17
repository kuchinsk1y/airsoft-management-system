import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMyEquipmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  primaryWeapon?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  secondaryWeapon?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  protection?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  communication?: string;
}
