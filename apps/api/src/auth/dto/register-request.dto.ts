import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import {
  PASSWORD_STRENGTH_MESSAGE,
  PASSWORD_STRENGTH_REGEX,
} from '../../common/password-strength';
import { RegisterRequest } from '../interfaces';

export class RegisterRequestDto implements RegisterRequest {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsString()
  @IsNotEmpty()
  nickName: string;

  @IsString()
  @IsNotEmpty({ message: "Номер телефону є обов'язковим" })
  @Matches(/^\+?380[0-9]{9}$/, {
    message:
      'Номер телефону повинен бути валідним українським номером (наприклад: +380123456789)',
  })
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_STRENGTH_REGEX, {
    message: PASSWORD_STRENGTH_MESSAGE,
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  confirmPassword: string;

  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsNotEmpty()
  region: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsBoolean()
  @IsNotEmpty()
  userAgreement: boolean;

  @IsBoolean()
  @IsNotEmpty()
  ageConfirmation: boolean;

  @IsString()
  @IsNotEmpty()
  frontendUrl: string;
}
