import {
  IsEmail,
  MaxLength,
  MinLength,
  IsOptional,
  IsString,
} from 'class-validator';

export class ServiceRequestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  name!: string;

  @IsString()
  phoneNumber!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(500)
  message!: string;

  @IsString()
  topic!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  company?: string;
}
