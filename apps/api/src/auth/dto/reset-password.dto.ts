import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import {
  PASSWORD_STRENGTH_MESSAGE,
  PASSWORD_STRENGTH_REGEX,
} from '../../common/password-strength';

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_STRENGTH_REGEX, {
    message: PASSWORD_STRENGTH_MESSAGE,
  })
  password: string;
}
