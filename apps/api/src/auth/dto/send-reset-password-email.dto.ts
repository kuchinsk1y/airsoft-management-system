import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SendResetPasswordEmailDto {
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  frontendUrl: string;
}
