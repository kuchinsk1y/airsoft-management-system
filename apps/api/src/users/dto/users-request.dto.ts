import {
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import {
  PASSWORD_STRENGTH_MESSAGE,
  PASSWORD_STRENGTH_REGEX,
} from '../../common/password-strength';
import { UsersRequest } from '../interfaces';

export class UsersRequestDto implements UsersRequest {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  nickName: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?380[0-9]{9}$/, {
    message:
      'Номер телефону повинен бути валідним українським номером (наприклад: +380123456789)',
  })
  phoneNumber?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_STRENGTH_REGEX, {
    message: PASSWORD_STRENGTH_MESSAGE,
  })
  password: string;

  @IsDate()
  @IsNotEmpty()
  dateOfBirth: Date;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsNotEmpty()
  region: string;

  @IsString()
  @IsNotEmpty()
  city: string;
}
